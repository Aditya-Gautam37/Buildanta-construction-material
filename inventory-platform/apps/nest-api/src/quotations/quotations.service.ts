import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  InventoryLedgerType,
  InventoryReservationStatus,
  Prisma,
  ProductStatus,
  QuotationApprovalStatus,
  QuotationStatus,
  SalesOrderStatus,
  UserRole,
  VariantStatus,
} from '@workspace/db';
import { requireRole } from '../auth/roles';
import { withSerializableRetry } from '../common/serializable-transaction';
import { PrismaService } from '../database/prisma.service';
import { availableQuantity } from '../inventory-locations/inventory-locations.service';
import type {
  QuotationAcceptDTO,
  QuotationApprovalDecisionDTO,
  QuotationRevisionCreateDTO,
  QuotationStatusUpdateDTO,
  SalesOrderCancelDTO,
} from './dto/quotation-dto';

const salesRoles: UserRole[] = [UserRole.ADMIN, UserRole.SALES];
const approvalRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCE];
const cancellationRoles: UserRole[] = [UserRole.ADMIN, UserRole.SALES, UserRole.SUPPORT];
const revisableStatuses: QuotationStatus[] = [QuotationStatus.SUBMITTED, QuotationStatus.REVIEWING, QuotationStatus.QUOTED];
const closeableStatuses: QuotationStatus[] = [QuotationStatus.REJECTED, QuotationStatus.EXPIRED];

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function balanceSnapshot(balance: {
  physicalQuantity: number;
  reservedQuantity: number;
  blockedQuantity: number;
  damagedQuantity: number;
  quarantineQuantity: number;
  inTransitQuantity: number;
}) {
  return {
    physicalQuantity: balance.physicalQuantity,
    reservedQuantity: balance.reservedQuantity,
    blockedQuantity: balance.blockedQuantity,
    damagedQuantity: balance.damagedQuantity,
    quarantineQuantity: balance.quarantineQuantity,
    inTransitQuantity: balance.inTransitQuantity,
  };
}

@Injectable()
export class QuotationsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(role: UserRole): Promise<unknown> {
    const canViewMargin = role === UserRole.ADMIN || role === UserRole.FINANCE;
    const [quotations, salesOrders, fulfilmentLocations, variants, supplierProducts, dealerProducts] = await Promise.all([
      this.prisma.client.quotation.findMany({
        include: {
          items: { include: { product: { include: { brand: true } }, variant: true }, orderBy: { sortOrder: 'asc' } },
          revisions: {
            include: {
              items: { include: { variant: { include: { product: true } }, fulfilmentLocation: true, supplierProduct: { include: { supplier: true } }, dealerProduct: { include: { dealer: true } } } },
              approvals: { include: { requestedBy: { select: { email: true } }, decidedBy: { select: { email: true } } }, orderBy: { createdAt: 'desc' } },
            },
            orderBy: { number: 'desc' },
          },
          history: { include: { actor: { select: { email: true } } }, orderBy: { createdAt: 'desc' } },
          salesOrder: { include: { items: { include: { reservation: true, fulfilmentLocation: true, variant: { include: { product: true } } } } } },
          materialEstimate: {
            select: {
              reference: true,
              inputs: true,
              assumptions: true,
              qualityTier: true,
              calculatorVersion: { select: { version: true } },
              definition: { select: { name: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.client.salesOrder.findMany({
        include: { quotation: { select: { reference: true } }, items: { include: { variant: { include: { product: true } }, fulfilmentLocation: true, reservation: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.client.fulfilmentLocation.findMany({ where: { active: true }, include: { serviceAreas: { include: { serviceArea: true } }, dealer: true, warehouse: true }, orderBy: { name: 'asc' } }),
      this.prisma.client.productVariant.findMany({ where: { status: VariantStatus.ACTIVE, product: { status: ProductStatus.PUBLISHED } }, include: { product: { include: { brand: true } } }, orderBy: [{ product: { name: 'asc' } }, { sku: 'asc' }] }),
      this.prisma.client.supplierProduct.findMany({ where: { active: true }, include: { supplier: true, variant: { include: { product: true } }, prices: { orderBy: { validFrom: 'desc' }, take: 1 } } }),
      this.prisma.client.dealerProduct.findMany({ where: { active: true }, include: { dealer: true, variant: { include: { product: true } } } }),
    ]);
    return {
      quotations: quotations.map((quotation) => ({
        ...quotation,
        revisions: quotation.revisions.map((revision) => ({ ...revision, marginTotal: canViewMargin ? revision.marginTotal : null })),
      })),
      salesOrders,
      fulfilmentLocations,
      variants,
      supplierProducts,
      dealerProducts,
      canViewMargin,
    };
  }

  async updateStatus(id: string, input: QuotationStatusUpdateDTO, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, salesRoles, 'Sales workflow');
    return this.prisma.client.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({ where: { id } });
      if (!quotation) throw new NotFoundException('Quotation not found.');
      const allowed =
        (input.status === QuotationStatus.REVIEWING && quotation.status === QuotationStatus.SUBMITTED) ||
        (input.status === QuotationStatus.REJECTED && revisableStatuses.includes(quotation.status)) ||
        (input.status === QuotationStatus.CLOSED && closeableStatuses.includes(quotation.status));
      if (!allowed) throw new ConflictException(`Quotation cannot move from ${quotation.status} to ${input.status}.`);
      const updated = await tx.quotation.update({
        where: { id },
        data: {
          status: input.status,
          rejectedAt: input.status === QuotationStatus.REJECTED ? new Date() : quotation.rejectedAt,
          history: { create: { fromStatus: quotation.status, toStatus: input.status, reason: input.reason, actorId } },
        },
      });
      if (quotation.sourceQuoteRequestId) {
        await tx.quoteRequest.update({ where: { id: quotation.sourceQuoteRequestId }, data: { status: input.status === QuotationStatus.REVIEWING ? 'REVIEWING' : 'CLOSED' } });
      }
      return updated;
    });
  }

  async createRevision(id: string, input: QuotationRevisionCreateDTO, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, salesRoles, 'Quotation preparation');
    if (input.marginTotal !== undefined && role !== UserRole.ADMIN && role !== UserRole.FINANCE) {
      throw new ForbiddenException('Finance margin permission is required.');
    }
    if (input.validUntil <= new Date()) throw new BadRequestException('Quotation validity must end in the future.');
    return withSerializableRetry(() => this.prisma.client.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({ where: { id }, include: { items: true } });
      if (!quotation) throw new NotFoundException('Quotation not found.');
      if (!revisableStatuses.includes(quotation.status)) throw new ConflictException('This quotation cannot be revised.');
      const quotationItemIds = new Set(quotation.items.map((item) => item.id));
      if (new Set(input.items.map((item) => item.quotationItemId)).size !== input.items.length) throw new BadRequestException('Each requested item can appear only once per revision.');
      if (input.items.length !== quotation.items.length || input.items.some((item) => !quotationItemIds.has(item.quotationItemId))) throw new BadRequestException('A revision must price every quotation item exactly once.');
      const serviceAreas = await tx.pincodeCoverage.findMany({ where: { pincode: quotation.deliveryPincode, active: true, serviceArea: { active: true } }, select: { serviceAreaId: true } });
      if (!serviceAreas.length) throw new ConflictException('The delivery PIN code is not serviceable.');
      const serviceAreaIds = serviceAreas.map((item) => item.serviceAreaId);
      const variants = await tx.productVariant.findMany({ where: { id: { in: input.items.map((item) => item.variantId) } }, include: { product: true } });
      const variantMap = new Map(variants.map((variant) => [variant.id, variant]));
      const locations = await tx.fulfilmentLocation.findMany({ where: { id: { in: input.items.map((item) => item.fulfilmentLocationId) }, active: true }, include: { serviceAreas: { where: { active: true, serviceAreaId: { in: serviceAreaIds } } } } });
      const locationMap = new Map(locations.map((location) => [location.id, location]));
      const supplierProductIds = input.items.flatMap((item) => item.supplierProductId ? [item.supplierProductId] : []);
      const dealerProductIds = input.items.flatMap((item) => item.dealerProductId ? [item.dealerProductId] : []);
      const supplierProducts = supplierProductIds.length ? await tx.supplierProduct.findMany({ where: { id: { in: supplierProductIds }, active: true } }) : [];
      const dealerProducts = dealerProductIds.length ? await tx.dealerProduct.findMany({ where: { id: { in: dealerProductIds }, active: true } }) : [];
      const supplierProductMap = new Map(supplierProducts.map((item) => [item.id, item]));
      const dealerProductMap = new Map(dealerProducts.map((item) => [item.id, item]));
      let subtotal = 0;
      let gstTotal = 0;
      let lineDiscountTotal = 0;
      const revisionItems = input.items.map((item, index) => {
        const variant = variantMap.get(item.variantId);
        if (!variant || variant.status !== VariantStatus.ACTIVE || variant.product.status !== ProductStatus.PUBLISHED) throw new ConflictException(`Line ${index + 1} does not use an active published variant.`);
        const location = locationMap.get(item.fulfilmentLocationId);
        if (!location || location.serviceAreas.length === 0) throw new ConflictException(`Line ${index + 1} is not serviceable from the selected location.`);
        if (item.supplierProductId && item.dealerProductId) throw new BadRequestException(`Line ${index + 1} cannot use both supplier and dealer allocation.`);
        if (item.supplierProductId && supplierProductMap.get(item.supplierProductId)?.variantId !== item.variantId) throw new ConflictException(`Line ${index + 1} has an invalid supplier allocation.`);
        const dealerProduct = item.dealerProductId ? dealerProductMap.get(item.dealerProductId) : undefined;
        if (item.dealerProductId && (!dealerProduct || dealerProduct.variantId !== item.variantId || dealerProduct.dealerId !== location.dealerId)) throw new ConflictException(`Line ${index + 1} has an invalid dealer allocation.`);
        const lineSubtotal = money(item.quantity * item.unitPrice);
        if (item.discountAmount > lineSubtotal) throw new BadRequestException(`Line ${index + 1} discount exceeds its subtotal.`);
        const taxable = money(lineSubtotal - item.discountAmount);
        const gstAmount = money(taxable * item.gstPercent / 100);
        const lineTotal = money(taxable + gstAmount);
        subtotal = money(subtotal + lineSubtotal);
        gstTotal = money(gstTotal + gstAmount);
        lineDiscountTotal = money(lineDiscountTotal + item.discountAmount);
        return { ...item, lineSubtotal, gstAmount, lineTotal };
      });
      const discountTotal = money(lineDiscountTotal + input.discountTotal);
      const grandTotal = money(subtotal - discountTotal + gstTotal + input.freightTotal);
      if (grandTotal < 0) throw new BadRequestException('Discounts cannot exceed the quotation value.');
      const revisionNumber = quotation.currentRevisionNumber + 1;
      const revision = await tx.quotationRevision.create({
        data: {
          quotationId: quotation.id,
          number: revisionNumber,
          validUntil: input.validUntil,
          subtotal,
          gstTotal,
          freightTotal: input.freightTotal,
          discountTotal,
          marginTotal: input.marginTotal,
          grandTotal,
          customerNotes: input.customerNotes,
          internalNotes: input.internalNotes,
          createdById: actorId,
          items: { create: revisionItems },
          approvals: { create: { quotationId: quotation.id, requestedById: actorId } },
        },
        include: { items: true, approvals: true },
      });
      await tx.quotation.update({
        where: { id: quotation.id },
        data: {
          status: QuotationStatus.REVIEWING,
          currentRevisionNumber: revisionNumber,
          internalNotes: input.internalNotes,
          history: { create: { fromStatus: quotation.status, toStatus: QuotationStatus.REVIEWING, reason: `Revision ${revisionNumber} prepared for approval`, actorId } },
        },
      });
      return revision;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  async decideApproval(quotationId: string, approvalId: string, input: QuotationApprovalDecisionDTO, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, approvalRoles, 'Quotation approval');
    return this.prisma.client.$transaction(async (tx) => {
      const approval = await tx.quotationApproval.findUnique({ where: { id: approvalId }, include: { revision: true } });
      if (!approval || approval.quotationId !== quotationId) throw new NotFoundException('Quotation approval not found.');
      if (approval.status !== QuotationApprovalStatus.PENDING) throw new ConflictException('This approval is already decided.');
      return tx.quotationApproval.update({ where: { id: approvalId }, data: { status: input.status, reason: input.reason, decidedById: actorId, decidedAt: new Date() } });
    });
  }

  async send(id: string, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, salesRoles, 'Quotation sending');
    return this.prisma.client.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({ where: { id }, include: { revisions: { orderBy: { number: 'desc' }, take: 1, include: { approvals: true } } } });
      if (!quotation) throw new NotFoundException('Quotation not found.');
      const revision = quotation.revisions[0];
      if (!revision || revision.number !== quotation.currentRevisionNumber) throw new ConflictException('Prepare a current revision before sending.');
      if (revision.validUntil <= new Date()) throw new ConflictException('The quotation revision has expired.');
      if (!revision.approvals.some((approval) => approval.status === QuotationApprovalStatus.APPROVED)) throw new ConflictException('The current revision must be approved before sending.');
      if (quotation.status !== QuotationStatus.REVIEWING) throw new ConflictException('Only a reviewed quotation can be sent.');
      const updated = await tx.quotation.update({ where: { id }, data: { status: QuotationStatus.QUOTED, expiresAt: revision.validUntil, history: { create: { fromStatus: quotation.status, toStatus: QuotationStatus.QUOTED, reason: `Revision ${revision.number} sent to customer`, actorId } } } });
      await tx.quotationRevision.update({ where: { id: revision.id }, data: { sentAt: new Date() } });
      if (quotation.sourceQuoteRequestId) await tx.quoteRequest.update({ where: { id: quotation.sourceQuoteRequestId }, data: { status: 'QUOTED' } });
      return updated;
    });
  }

  async accept(id: string, input: QuotationAcceptDTO, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, salesRoles, 'Quotation acceptance');
    return this.acceptInternal(id, input, actorId);
  }

  async acceptForCustomer(id: string, input: QuotationAcceptDTO, actorId: string, customerEmail: string): Promise<unknown> {
    return this.acceptInternal(id, input, actorId, customerEmail.toLowerCase());
  }

  private async acceptInternal(id: string, input: QuotationAcceptDTO, actorId: string, customerEmail?: string): Promise<unknown> {
    const now = new Date();
    const reservationExpiresAt = input.reservationExpiresAt ?? new Date(now.getTime() + 48 * 60 * 60 * 1000);
    if (reservationExpiresAt <= now) throw new BadRequestException('Reservation expiry must be in the future.');
    return withSerializableRetry(() => this.prisma.client.$transaction(async (tx) => {
      const quotation = await tx.quotation.findUnique({
        where: { id },
        include: { revisions: { orderBy: { number: 'desc' }, take: 1, include: { approvals: true, items: { include: { variant: { include: { product: true } }, fulfilmentLocation: true } } } }, salesOrder: true },
      });
      if (!quotation) throw new NotFoundException('Quotation not found.');
      if (customerEmail && quotation.customerEmail.toLowerCase() !== customerEmail) throw new ForbiddenException('This quotation does not belong to your account.');
      if (quotation.salesOrder) {
        return tx.salesOrder.findUnique({ where: { id: quotation.salesOrder.id }, include: { items: { include: { reservation: true, fulfilmentLocation: true, variant: { include: { product: true } } } } } });
      }
      if (quotation.status !== QuotationStatus.QUOTED) throw new ConflictException('Only a final quoted quotation can be booked.');
      const revision = quotation.revisions[0];
      if (!revision || revision.number !== quotation.currentRevisionNumber || revision.validUntil <= now) throw new ConflictException('The current quotation revision is missing or expired.');
      if (!revision.approvals.some((approval) => approval.status === QuotationApprovalStatus.APPROVED)) throw new ConflictException('The current quotation revision is not approved.');
      const coveredAreas = await tx.pincodeCoverage.findMany({ where: { pincode: quotation.deliveryPincode, active: true, serviceArea: { active: true } }, select: { serviceAreaId: true } });
      if (!coveredAreas.length) throw new ConflictException('The delivery PIN code is not serviceable.');
      const serviceAreaIds = coveredAreas.map((item) => item.serviceAreaId);
      const orderReference = `SO-${now.toISOString().slice(2, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
      const order = await tx.salesOrder.create({
        data: {
          reference: orderReference,
          quotationId: quotation.id,
          revisionId: revision.id,
          paymentTerms: input.paymentTerms,
          customerName: quotation.customerName,
          customerEmail: quotation.customerEmail,
          customerPhone: quotation.customerPhone,
          deliveryPincode: quotation.deliveryPincode,
          subtotal: revision.subtotal,
          gstTotal: revision.gstTotal,
          freightTotal: revision.freightTotal,
          discountTotal: revision.discountTotal,
          grandTotal: revision.grandTotal,
          reservedUntil: reservationExpiresAt,
          createdById: actorId,
        },
      });
      const touchedVariants = new Set<string>();
      for (const [index, line] of revision.items.entries()) {
        const quantity = Number(line.quantity);
        if (!Number.isSafeInteger(quantity) || quantity <= 0 || !line.variantId || !line.fulfilmentLocationId) throw new ConflictException(`Quotation line ${index + 1} cannot be reserved as an allocated whole quantity.`);
        if (!line.variant || line.variant.status !== VariantStatus.ACTIVE || line.variant.product.status !== ProductStatus.PUBLISHED || !line.fulfilmentLocation?.active) throw new ConflictException(`Quotation line ${index + 1} is no longer active.`);
        const serviceable = await tx.fulfilmentServiceArea.findFirst({ where: { fulfilmentLocationId: line.fulfilmentLocationId, serviceAreaId: { in: serviceAreaIds }, active: true } });
        if (!serviceable) throw new ConflictException(`Quotation line ${index + 1} is not serviceable from its allocated location.`);
        const balance = await tx.inventoryBalance.findUnique({ where: { variantId_fulfilmentLocationId: { variantId: line.variantId, fulfilmentLocationId: line.fulfilmentLocationId } } });
        if (!balance || availableQuantity(balance) < quantity) throw new ConflictException(`Quotation line ${index + 1} does not have sufficient available stock.`);
        const orderItem = await tx.salesOrderItem.create({ data: { salesOrderId: order.id, quotationItemId: line.quotationItemId, variantId: line.variantId, fulfilmentLocationId: line.fulfilmentLocationId, description: line.description, quantity, unitCode: line.unitCode, unitPrice: line.unitPrice, gstPercent: line.gstPercent, discountAmount: line.discountAmount, lineSubtotal: line.lineSubtotal, gstAmount: line.gstAmount, lineTotal: line.lineTotal } });
        const updated = await tx.inventoryBalance.update({ where: { id: balance.id }, data: { reservedQuantity: { increment: quantity } } });
        await tx.inventoryReservation.create({ data: { reference: `${orderReference}-${index + 1}`, variantId: line.variantId, fulfilmentLocationId: line.fulfilmentLocationId, quantity, expiresAt: reservationExpiresAt, notes: `Reserved for ${orderReference}`, salesOrderItemId: orderItem.id } });
        await tx.inventoryLedgerEntry.create({ data: { balanceId: balance.id, type: InventoryLedgerType.RESERVATION, reservedDelta: quantity, before: balanceSnapshot(balance), after: balanceSnapshot(updated), reason: input.reason, reference: orderReference, actorId } });
        touchedVariants.add(line.variantId);
      }
      for (const variantId of touchedVariants) await this.syncVariantSummary(tx, variantId);
      await tx.quotation.update({ where: { id: quotation.id }, data: { status: QuotationStatus.ACCEPTED, acceptedAt: now, history: { create: { fromStatus: quotation.status, toStatus: QuotationStatus.ACCEPTED, reason: input.reason, actorId } } } });
      if (quotation.sourceQuoteRequestId) await tx.quoteRequest.update({ where: { id: quotation.sourceQuoteRequestId }, data: { status: 'ACCEPTED' } });
      return tx.salesOrder.findUnique({ where: { id: order.id }, include: { items: { include: { reservation: true, fulfilmentLocation: true, variant: { include: { product: true } } } } } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  async cancelSalesOrder(id: string, input: SalesOrderCancelDTO, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, cancellationRoles, 'Sales-order cancellation');
    return this.cancelSalesOrderInternal(id, input, actorId);
  }

  async cancelSalesOrderForCustomer(id: string, input: SalesOrderCancelDTO, actorId: string, customerEmail: string): Promise<unknown> {
    return this.cancelSalesOrderInternal(id, input, actorId, customerEmail.toLowerCase());
  }

  private async cancelSalesOrderInternal(id: string, input: SalesOrderCancelDTO, actorId: string, customerEmail?: string): Promise<unknown> {
    return withSerializableRetry(() => this.prisma.client.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({ where: { id }, include: { items: { include: { reservation: true } }, quotation: true } });
      if (!order) throw new NotFoundException('Sales order not found.');
      if (customerEmail && order.customerEmail.toLowerCase() !== customerEmail) throw new ForbiddenException('This sales order does not belong to your account.');
      if (order.status !== SalesOrderStatus.CONFIRMED) throw new ConflictException('Only a confirmed sales order can be cancelled.');
      const touchedVariants = new Set<string>();
      for (const item of order.items) {
        const reservation = item.reservation;
        if (!reservation || reservation.status !== InventoryReservationStatus.ACTIVE) continue;
        const balance = await tx.inventoryBalance.findUniqueOrThrow({ where: { variantId_fulfilmentLocationId: { variantId: item.variantId, fulfilmentLocationId: item.fulfilmentLocationId } } });
        if (balance.reservedQuantity < reservation.quantity) throw new ConflictException('Reservation balance is inconsistent; cancellation was not applied.');
        const updated = await tx.inventoryBalance.update({ where: { id: balance.id }, data: { reservedQuantity: { decrement: reservation.quantity } } });
        await tx.inventoryReservation.update({ where: { id: reservation.id }, data: { status: InventoryReservationStatus.CANCELLED } });
        await tx.inventoryLedgerEntry.create({ data: { balanceId: balance.id, type: InventoryLedgerType.RESERVATION_RELEASE, reservedDelta: -reservation.quantity, before: balanceSnapshot(balance), after: balanceSnapshot(updated), reason: input.reason, reference: order.reference, actorId } });
        touchedVariants.add(item.variantId);
      }
      for (const variantId of touchedVariants) await this.syncVariantSummary(tx, variantId);
      const updated = await tx.salesOrder.update({ where: { id }, data: { status: SalesOrderStatus.CANCELLED, cancelledAt: new Date(), cancelledById: actorId, cancellationReason: input.reason } });
      await tx.quotation.update({ where: { id: order.quotationId }, data: { status: QuotationStatus.CLOSED, history: { create: { fromStatus: order.quotation.status, toStatus: QuotationStatus.CLOSED, reason: `Sales order ${order.reference} cancelled: ${input.reason}`, actorId } } } });
      if (order.quotation.sourceQuoteRequestId) await tx.quoteRequest.update({ where: { id: order.quotation.sourceQuoteRequestId }, data: { status: 'CLOSED' } });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  private async syncVariantSummary(tx: Prisma.TransactionClient, variantId: string) {
    const totals = await tx.inventoryBalance.aggregate({ where: { variantId }, _sum: { physicalQuantity: true, reservedQuantity: true } });
    await tx.productVariant.update({ where: { id: variantId }, data: { stockQuantity: totals._sum.physicalQuantity ?? 0, reservedQuantity: totals._sum.reservedQuantity ?? 0, stockTracked: true } });
  }
}
