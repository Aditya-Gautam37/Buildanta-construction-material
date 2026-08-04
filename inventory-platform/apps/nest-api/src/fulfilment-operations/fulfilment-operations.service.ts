import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreditNoteStatus, DispatchStatus, GoodsReceiptStatus, InventoryLedgerType, InventoryReservationStatus,
  PickingListStatus, Prisma, PurchaseApprovalDecision, PurchaseOrderStatus, PurchaseRequisitionStatus,
  ReplacementStatus, ReturnRequestStatus, SalesOrderStatus, SupplierRFQStatus, SupplierResponseStatus,
  SupplierReturnStatus, UserRole,
} from '@workspace/db';
import { randomUUID } from 'node:crypto';
import { requireRole } from '../auth/roles';
import { withSerializableRetry } from '../common/serializable-transaction';
import { PrismaService } from '../database/prisma.service';
import type {
  DecisionInput, DispatchCreateInput, GoodsReceiptCreateInput, PickingCreateInput, ProofOfDeliveryInput,
  PurchaseOrderCreateInput, RequisitionCreateInput, ReturnCreateInput, ReturnInspectInput, ReturnReceiveInput,
  RfqCreateInput, SupplierResponseInput, SupplierReturnCreateInput,
} from './operations.schemas';

const procurementRoles: UserRole[] = [UserRole.ADMIN, UserRole.PROCUREMENT];
const approvalRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCE];
const warehouseRoles: UserRole[] = [UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER];
const returnRoles: UserRole[] = [UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.SUPPORT];

function reference(prefix: string) { return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`; }
function snapshot(balance: { physicalQuantity: number; reservedQuantity: number; blockedQuantity: number; damagedQuantity: number; quarantineQuantity: number; inTransitQuantity: number }) {
  return { physicalQuantity: balance.physicalQuantity, reservedQuantity: balance.reservedQuantity, blockedQuantity: balance.blockedQuantity, damagedQuantity: balance.damagedQuantity, quarantineQuantity: balance.quarantineQuantity, inTransitQuantity: balance.inTransitQuantity };
}

@Injectable()
export class FulfilmentOperationsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(): Promise<unknown> {
    const [requisitions, rfqs, purchaseOrders, receipts, salesOrders, pickingLists, dispatches, returns, supplierReturns, variants, locations, suppliers, carriers] = await Promise.all([
      this.prisma.client.purchaseRequisition.findMany({ include: { items: { include: { variant: { include: { product: true } }, targetLocation: true } }, rfqs: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.client.supplierRFQ.findMany({ include: { items: { include: { variant: { include: { product: true } } } }, responses: { include: { supplier: true, items: true } } }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.client.purchaseOrder.findMany({ include: { supplier: true, items: { include: { variant: { include: { product: true } }, targetLocation: true } }, approvalHistory: { orderBy: { createdAt: 'desc' } }, goodsReceipts: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.client.goodsReceipt.findMany({ include: { purchaseOrder: true, fulfilmentLocation: true, items: { include: { variant: { include: { product: true } } } } }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.client.salesOrder.findMany({ where: { status: { notIn: [SalesOrderStatus.CANCELLED, SalesOrderStatus.EXPIRED] } }, include: { items: { include: { variant: { include: { product: true } }, reservation: true, fulfilmentLocation: true } } }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.client.pickingList.findMany({ include: { salesOrder: true, fulfilmentLocation: true, items: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.client.dispatch.findMany({ include: { salesOrder: true, items: { include: { salesOrderItem: { include: { variant: { include: { product: true } } } } } }, challan: true, proofOfDelivery: true, history: { orderBy: { createdAt: 'desc' } } }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.client.returnRequest.findMany({ include: { salesOrder: true, items: { include: { salesOrderItem: { include: { variant: { include: { product: true } } } }, inspection: true } }, replacement: true, creditNote: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.client.supplierReturn.findMany({ include: { supplier: true, fulfilmentLocation: true, items: { include: { variant: { include: { product: true } } } } }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.client.productVariant.findMany({ where: { status: 'ACTIVE' }, include: { product: true }, orderBy: [{ product: { name: 'asc' } }, { sku: 'asc' }] }),
      this.prisma.client.fulfilmentLocation.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
      this.prisma.client.supplier.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.client.carrier.findMany({ where: { active: true }, orderBy: { name: 'asc' } }),
    ]);
    return { requisitions, rfqs, purchaseOrders, receipts, salesOrders, pickingLists, dispatches, returns, supplierReturns, variants, locations, suppliers, carriers };
  }

  async dashboard(role: UserRole): Promise<unknown> {
    const now = new Date(); const sevenDays = new Date(now.getTime() + 7 * 86_400_000);
    const [balances, reservations, quotations, salesOrders, purchaseOrders, draftReceipts, delayedSchedules, supplierResponses, receipts, ledger] = await Promise.all([
      this.prisma.client.inventoryBalance.findMany({ include: { fulfilmentLocation: { include: { warehouse: true } }, variant: { include: { product: true } } } }),
      this.prisma.client.inventoryReservation.findMany({ where: { status: InventoryReservationStatus.ACTIVE }, include: { variant: { include: { product: true } }, fulfilmentLocation: true } }),
      this.prisma.client.quotation.findMany({ include: { history: { orderBy: { createdAt: 'asc' } }, revisions: { orderBy: { number: 'desc' }, take: 1 } } }),
      this.prisma.client.salesOrder.findMany({ where: { status: { notIn: [SalesOrderStatus.CANCELLED, SalesOrderStatus.CLOSED, SalesOrderStatus.EXPIRED] } } }),
      this.prisma.client.purchaseOrder.findMany({ where: { status: { in: [PurchaseOrderStatus.PENDING_APPROVAL, PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.SENT, PurchaseOrderStatus.PARTIALLY_RECEIVED] } }, include: { supplier: true } }),
      this.prisma.client.goodsReceipt.count({ where: { status: GoodsReceiptStatus.DRAFT } }),
      this.prisma.client.deliverySchedule.count({ where: { scheduledFor: { lt: now }, status: { in: ['PLANNED', 'CONFIRMED'] } } }),
      this.prisma.client.supplierRFQResponse.findMany({ where: { status: { in: [SupplierResponseStatus.SUBMITTED, SupplierResponseStatus.SELECTED] } }, include: { supplier: true, items: true, supplierRfq: true } }),
      this.prisma.client.goodsReceipt.findMany({ where: { status: GoodsReceiptStatus.POSTED }, include: { purchaseOrder: { include: { supplier: true } } } }),
      this.prisma.client.inventoryLedgerEntry.findMany({ orderBy: { createdAt: 'asc' }, select: { balanceId: true, createdAt: true } }),
    ]);
    const warehouses = new Map<string, { name: string; physical: number; reserved: number; available: number; valuation: number }>();
    for (const balance of balances) { const name = balance.fulfilmentLocation.warehouse?.name ?? balance.fulfilmentLocation.name; const row = warehouses.get(name) ?? { name, physical: 0, reserved: 0, available: 0, valuation: 0 }; const available = Math.max(0, balance.physicalQuantity - balance.reservedQuantity - balance.blockedQuantity - balance.damagedQuantity - balance.quarantineQuantity); row.physical += balance.physicalQuantity; row.reserved += balance.reservedQuantity; row.available += available; row.valuation += available * Number(balance.variant.price ?? balance.variant.product.sellingPrice ?? 0); warehouses.set(name, row); }
    const quoted = quotations.filter((item) => ['QUOTED', 'ACCEPTED', 'REJECTED', 'CLOSED'].includes(item.status)).length; const accepted = quotations.filter((item) => item.status === 'ACCEPTED').length;
    const responseHours = quotations.flatMap((item) => { const submitted = item.history.find((h) => h.toStatus === 'SUBMITTED'); const sent = item.history.find((h) => h.toStatus === 'QUOTED'); return submitted && sent ? [(sent.createdAt.getTime() - submitted.createdAt.getTime()) / 3_600_000] : []; });
    const canViewMargin = role === UserRole.ADMIN || role === UserRole.FINANCE; const warehouse = Array.from(warehouses.values());
    return { summary: { warehouses: warehouses.size, physicalStock: balances.reduce((n, b) => n + b.physicalQuantity, 0), availableToPromise: warehouse.reduce((n, b) => n + b.available, 0), lowStockItems: balances.filter((b) => Math.max(0, b.physicalQuantity - b.reservedQuantity - b.blockedQuantity - b.damagedQuantity - b.quarantineQuantity) <= b.lowStockThreshold).length, pendingReservations: reservations.length, expiringReservations: reservations.filter((r) => r.expiresAt && r.expiresAt <= sevenDays).length, newQuotations: quotations.filter((q) => q.status === 'SUBMITTED').length, averageQuoteResponseHours: responseHours.length ? responseHours.reduce((a, b) => a + b, 0) / responseHours.length : null, quoteConversionRate: quoted ? accepted / quoted * 100 : 0, acceptedAwaitingAllocation: salesOrders.filter((o) => o.status === SalesOrderStatus.CONFIRMED).length, openSalesOrders: salesOrders.length, delayedDispatches: delayedSchedules, pendingPurchaseOrders: purchaseOrders.length, pendingGoodsReceipts: draftReceipts, inventoryValuation: warehouse.reduce((n, b) => n + b.valuation, 0), grossMargin: canViewMargin ? quotations.reduce((n, q) => n + Number(q.revisions[0]?.marginTotal ?? 0), 0) : null }, warehouse, lowStock: balances.filter((b) => Math.max(0, b.physicalQuantity - b.reservedQuantity - b.blockedQuantity - b.damagedQuantity - b.quarantineQuantity) <= b.lowStockThreshold).slice(0, 20).map((b) => ({ product: b.variant.product.name, sku: b.variant.sku, location: b.fulfilmentLocation.name, available: Math.max(0, b.physicalQuantity - b.reservedQuantity - b.blockedQuantity - b.damagedQuantity - b.quarantineQuantity), threshold: b.lowStockThreshold })), reservations: reservations.slice(0, 20).map((r) => ({ reference: r.reference, product: r.variant.product.name, location: r.fulfilmentLocation.name, quantity: r.quantity, expiresAt: r.expiresAt })), purchaseOrders: purchaseOrders.map((o) => ({ reference: o.reference, supplier: o.supplier.name, status: o.status, expectedAt: o.expectedAt, total: o.grandTotal })), supplierComparison: supplierResponses.map((r) => ({ rfq: r.supplierRfq.reference, supplier: r.supplier.name, total: r.items.reduce((n, i) => n + i.offeredQuantity * Number(i.unitCost), Number(r.freightTotal)), averageLeadDays: r.items.length ? r.items.reduce((n, i) => n + i.leadTimeDays, 0) / r.items.length : 0, status: r.status })), supplierPerformance: receipts.map((r) => ({ supplier: r.purchaseOrder.supplier.name, purchaseOrder: r.purchaseOrder.reference, expectedAt: r.purchaseOrder.expectedAt, receivedAt: r.receivedAt, onTime: !r.purchaseOrder.expectedAt || r.receivedAt <= r.purchaseOrder.expectedAt })), stockAgeing: Array.from(new Map(ledger.map((item) => [item.balanceId, item.createdAt])).entries()).map(([balanceId, firstMovementAt]) => ({ balanceId, firstMovementAt, ageDays: Math.floor((now.getTime() - firstMovementAt.getTime()) / 86_400_000) })).sort((a, b) => b.ageDays - a.ageDays).slice(0, 20), canViewMargin };
  }

  async createRequisition(input: RequisitionCreateInput, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, procurementRoles, 'Procurement');
    const [variantCount, locationCount] = await Promise.all([
      this.prisma.client.productVariant.count({ where: { id: { in: input.items.map((item) => item.variantId) }, status: 'ACTIVE' } }),
      this.prisma.client.fulfilmentLocation.count({ where: { id: { in: input.items.map((item) => item.targetLocationId) }, active: true } }),
    ]);
    if (variantCount !== new Set(input.items.map((item) => item.variantId)).size || locationCount !== new Set(input.items.map((item) => item.targetLocationId)).size) throw new ConflictException('Every requisition line needs an active variant and location.');
    return this.prisma.client.purchaseRequisition.create({ data: { reference: reference('PR'), reason: input.reason, requiredBy: input.requiredBy, internalNotes: input.internalNotes, createdById: actorId, items: { create: input.items } }, include: { items: true } });
  }

  async submitRequisition(id: string, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, procurementRoles, 'Procurement');
    const item = await this.prisma.client.purchaseRequisition.findUnique({ where: { id }, include: { items: true } });
    if (!item) throw new NotFoundException('Purchase requisition not found.');
    if (item.status !== PurchaseRequisitionStatus.DRAFT || !item.items.length) throw new ConflictException('Only a complete draft requisition can be submitted.');
    return this.prisma.client.purchaseRequisition.update({ where: { id }, data: { status: PurchaseRequisitionStatus.SUBMITTED, submittedAt: new Date(), createdById: item.createdById ?? actorId } });
  }

  async decideRequisition(id: string, input: DecisionInput, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, approvalRoles, 'Purchase approval');
    const item = await this.prisma.client.purchaseRequisition.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Purchase requisition not found.');
    if (item.status !== PurchaseRequisitionStatus.SUBMITTED) throw new ConflictException('Only submitted requisitions can be decided.');
    return this.prisma.client.purchaseRequisition.update({ where: { id }, data: { status: input.approve ? PurchaseRequisitionStatus.APPROVED : PurchaseRequisitionStatus.REJECTED, decidedAt: new Date(), decidedById: actorId, decisionReason: input.reason } });
  }

  async createRfq(requisitionId: string, input: RfqCreateInput, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, procurementRoles, 'Procurement');
    const requisition = await this.prisma.client.purchaseRequisition.findUnique({ where: { id: requisitionId }, include: { items: true } });
    if (!requisition) throw new NotFoundException('Purchase requisition not found.');
    if (requisition.status !== PurchaseRequisitionStatus.APPROVED) throw new ConflictException('The requisition must be approved first.');
    return this.prisma.client.supplierRFQ.create({ data: { reference: reference('RFQ'), purchaseRequisitionId: requisition.id, status: SupplierRFQStatus.SENT, responseDueAt: input.responseDueAt, sentAt: new Date(), notes: input.notes, createdById: actorId, items: { create: requisition.items.map((item) => ({ purchaseRequisitionItemId: item.id, variantId: item.variantId, targetLocationId: item.targetLocationId, quantity: item.quantity, unitCode: item.unitCode })) } }, include: { items: true } });
  }

  async addSupplierResponse(rfqId: string, input: SupplierResponseInput, role: UserRole): Promise<unknown> {
    requireRole(role, procurementRoles, 'Procurement');
    if (input.validUntil <= new Date()) throw new BadRequestException('Supplier response validity must end in the future.');
    const rfq = await this.prisma.client.supplierRFQ.findUnique({ where: { id: rfqId }, include: { items: true } });
    if (!rfq || rfq.status !== SupplierRFQStatus.SENT) throw new ConflictException('Supplier RFQ is not open.');
    const ids = new Set(rfq.items.map((item) => item.id));
    if (input.items.length !== rfq.items.length || input.items.some((item) => !ids.has(item.supplierRfqItemId))) throw new BadRequestException('A supplier response must quote every RFQ line exactly once.');
    return this.prisma.client.supplierRFQResponse.create({ data: { reference: reference('SR'), supplierRfqId: rfq.id, supplierId: input.supplierId, status: SupplierResponseStatus.SUBMITTED, validUntil: input.validUntil, freightTotal: input.freightTotal, notes: input.notes, items: { create: input.items } }, include: { supplier: true, items: true } });
  }

  async createPurchaseOrder(responseId: string, input: PurchaseOrderCreateInput, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, procurementRoles, 'Procurement');
    return this.prisma.client.$transaction(async (tx) => {
      const response = await tx.supplierRFQResponse.findUnique({ where: { id: responseId }, include: { items: { include: { supplierRfqItem: true } } } });
      if (!response || response.status !== SupplierResponseStatus.SUBMITTED || response.validUntil <= new Date()) throw new ConflictException('Supplier response is unavailable or expired.');
      const subtotal = response.items.reduce((sum, item) => sum + Number(item.unitCost) * item.offeredQuantity, 0);
      const gstTotal = response.items.reduce((sum, item) => sum + Number(item.unitCost) * item.offeredQuantity * Number(item.gstPercent) / 100, 0);
      const order = await tx.purchaseOrder.create({ data: { reference: reference('PO'), supplierId: response.supplierId, supplierResponseId: response.id, status: PurchaseOrderStatus.PENDING_APPROVAL, expectedAt: input.expectedAt, subtotal, gstTotal, freightTotal: response.freightTotal, grandTotal: subtotal + gstTotal + Number(response.freightTotal), paymentTerms: input.paymentTerms, internalNotes: input.internalNotes, createdById: actorId, items: { create: response.items.map((item) => ({ variantId: item.supplierRfqItem.variantId, targetLocationId: item.supplierRfqItem.targetLocationId, orderedQuantity: item.offeredQuantity, unitCode: item.supplierRfqItem.unitCode, unitCost: item.unitCost, gstPercent: item.gstPercent, lineTotal: Number(item.unitCost) * item.offeredQuantity * (1 + Number(item.gstPercent) / 100) })) }, approvalHistory: { create: { decision: PurchaseApprovalDecision.SUBMITTED, actorId, reason: 'Created from selected supplier response.' } } }, include: { items: true } });
      await tx.supplierRFQResponse.updateMany({ where: { supplierRfqId: response.supplierRfqId, id: { not: response.id }, status: SupplierResponseStatus.SUBMITTED }, data: { status: SupplierResponseStatus.REJECTED } });
      await tx.supplierRFQResponse.update({ where: { id: response.id }, data: { status: SupplierResponseStatus.SELECTED } });
      await tx.supplierRFQ.update({ where: { id: response.supplierRfqId }, data: { status: SupplierRFQStatus.CLOSED, closedAt: new Date() } });
      return order;
    });
  }

  async decidePurchaseOrder(id: string, input: DecisionInput, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, approvalRoles, 'Purchase-order approval');
    const order = await this.prisma.client.purchaseOrder.findUnique({ where: { id } });
    if (!order || order.status !== PurchaseOrderStatus.PENDING_APPROVAL) throw new ConflictException('Purchase order is not awaiting approval.');
    return this.prisma.client.purchaseOrder.update({ where: { id }, data: { status: input.approve ? PurchaseOrderStatus.APPROVED : PurchaseOrderStatus.CANCELLED, approvedById: input.approve ? actorId : null, approvedAt: input.approve ? new Date() : null, approvalHistory: { create: { decision: input.approve ? PurchaseApprovalDecision.APPROVED : PurchaseApprovalDecision.REJECTED, reason: input.reason, actorId } } } });
  }

  async sendPurchaseOrder(id: string, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, procurementRoles, 'Procurement');
    const order = await this.prisma.client.purchaseOrder.findUnique({ where: { id } });
    if (!order || order.status !== PurchaseOrderStatus.APPROVED) throw new ConflictException('Only an approved purchase order can be sent.');
    return this.prisma.client.purchaseOrder.update({ where: { id }, data: { status: PurchaseOrderStatus.SENT, sentAt: new Date(), approvalHistory: { create: { decision: PurchaseApprovalDecision.SENT, actorId, reason: 'Purchase order sent to supplier.' } } } });
  }

  async createGoodsReceipt(input: GoodsReceiptCreateInput, role: UserRole): Promise<unknown> {
    requireRole(role, warehouseRoles, 'Goods receipt');
    const order = await this.prisma.client.purchaseOrder.findUnique({ where: { id: input.purchaseOrderId }, include: { items: true } });
    if (!order || (order.status !== PurchaseOrderStatus.SENT && order.status !== PurchaseOrderStatus.PARTIALLY_RECEIVED)) throw new ConflictException('Purchase order is not open for receiving.');
    const orderItems = new Map(order.items.map((item) => [item.id, item]));
    const items = input.items.map((item, index) => {
      const orderItem = orderItems.get(item.purchaseOrderItemId);
      if (!orderItem || orderItem.targetLocationId !== input.fulfilmentLocationId) throw new ConflictException(`Receipt line ${index + 1} does not match the order location.`);
      if (item.acceptedQuantity + item.rejectedQuantity + item.damagedQuantity !== item.receivedQuantity) throw new BadRequestException(`Receipt line ${index + 1} quality quantities must equal received quantity.`);
      const cumulative = orderItem.receivedQuantity + item.receivedQuantity;
      return { ...item, variantId: orderItem.variantId, shortageQuantity: Math.max(0, orderItem.orderedQuantity - cumulative), excessQuantity: Math.max(0, cumulative - orderItem.orderedQuantity) };
    });
    return this.prisma.client.goodsReceipt.create({ data: { reference: reference('GRN'), purchaseOrderId: order.id, fulfilmentLocationId: input.fulfilmentLocationId, receivedAt: input.receivedAt, supplierDocument: input.supplierDocument, qualityNotes: input.qualityNotes, items: { create: items } }, include: { items: true } });
  }

  async postGoodsReceipt(id: string, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, warehouseRoles, 'Goods receipt');
    return withSerializableRetry(() => this.prisma.client.$transaction(async (tx) => {
      const receipt = await tx.goodsReceipt.findUnique({ where: { id }, include: { items: { include: { purchaseOrderItem: true } }, purchaseOrder: { include: { items: true } } } });
      if (!receipt || receipt.status !== GoodsReceiptStatus.DRAFT) throw new ConflictException('Only a draft goods receipt can be posted.');
      for (const item of receipt.items) {
        const balance = await tx.inventoryBalance.upsert({ where: { variantId_fulfilmentLocationId: { variantId: item.variantId, fulfilmentLocationId: receipt.fulfilmentLocationId } }, update: {}, create: { variantId: item.variantId, fulfilmentLocationId: receipt.fulfilmentLocationId } });
        const before = snapshot(balance);
        const updated = await tx.inventoryBalance.update({ where: { id: balance.id }, data: { physicalQuantity: { increment: item.receivedQuantity }, damagedQuantity: { increment: item.damagedQuantity }, quarantineQuantity: { increment: item.rejectedQuantity } } });
        await tx.inventoryLedgerEntry.create({ data: { balanceId: balance.id, type: InventoryLedgerType.GOODS_RECEIPT, physicalDelta: item.receivedQuantity, damagedDelta: item.damagedQuantity, quarantineDelta: item.rejectedQuantity, before, after: snapshot(updated), reason: 'Approved goods receipt posted.', reference: receipt.reference, actorId } });
        await tx.purchaseOrderItem.update({ where: { id: item.purchaseOrderItemId }, data: { receivedQuantity: { increment: item.receivedQuantity } } });
      }
      const refreshed = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: receipt.purchaseOrderId } });
      const complete = refreshed.every((item) => item.receivedQuantity >= item.orderedQuantity);
      await tx.purchaseOrder.update({ where: { id: receipt.purchaseOrderId }, data: { status: complete ? PurchaseOrderStatus.RECEIVED : PurchaseOrderStatus.PARTIALLY_RECEIVED } });
      return tx.goodsReceipt.update({ where: { id }, data: { status: GoodsReceiptStatus.POSTED, postedAt: new Date(), postedById: actorId } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  async createPickingList(input: PickingCreateInput, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, warehouseRoles, 'Picking');
    const order = await this.prisma.client.salesOrder.findUnique({ where: { id: input.salesOrderId }, include: { items: { include: { reservation: true } } } });
    if (!order || (order.status !== SalesOrderStatus.CONFIRMED && order.status !== SalesOrderStatus.FULFILLING && order.status !== SalesOrderStatus.PARTIALLY_DISPATCHED)) throw new ConflictException('Sales order is not available for picking.');
    const items = order.items.filter((item) => item.fulfilmentLocationId === input.fulfilmentLocationId && item.reservation?.status === InventoryReservationStatus.ACTIVE);
    if (!items.length) throw new ConflictException('No active reservations exist at this location.');
    const picking = await this.prisma.client.pickingList.create({ data: { reference: reference('PICK'), salesOrderId: order.id, fulfilmentLocationId: input.fulfilmentLocationId, status: PickingListStatus.IN_PROGRESS, assignedToId: actorId, items: { create: items.map((item) => ({ salesOrderItemId: item.id, requestedQuantity: item.quantity, pickedQuantity: item.quantity })) } }, include: { items: true } });
    await this.prisma.client.salesOrder.update({ where: { id: order.id }, data: { status: SalesOrderStatus.FULFILLING } });
    return picking;
  }

  async createDispatch(input: DispatchCreateInput, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, warehouseRoles, 'Dispatch');
    const order = await this.prisma.client.salesOrder.findUnique({ where: { id: input.salesOrderId }, include: { items: { include: { reservation: true } } } });
    if (!order) throw new NotFoundException('Sales order not found.');
    const map = new Map(order.items.map((item) => [item.id, item]));
    const items = input.items.map((item) => {
      const orderItem = map.get(item.salesOrderItemId);
      if (!orderItem?.reservation || orderItem.reservation.status !== InventoryReservationStatus.ACTIVE || item.quantity > orderItem.reservation.quantity) throw new ConflictException('Every dispatch line needs sufficient active reserved stock.');
      return { ...item, reservationId: orderItem.reservation.id, fulfilmentLocationId: orderItem.fulfilmentLocationId };
    });
    return this.prisma.client.dispatch.create({ data: { reference: reference('DSP'), salesOrderId: order.id, pickingListId: input.pickingListId, deliveryScheduleId: input.deliveryScheduleId, carrierId: input.carrierId, vehicleNumber: input.vehicleNumber, trackingReference: input.trackingReference, createdById: actorId, items: { create: items }, challan: { create: { number: reference('DC') } }, history: { create: { toStatus: DispatchStatus.DRAFT, actorId, notes: 'Dispatch prepared from reserved order lines.' } } }, include: { items: true, challan: true } });
  }

  async postDispatch(id: string, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, warehouseRoles, 'Dispatch');
    return withSerializableRetry(() => this.prisma.client.$transaction(async (tx) => {
      const dispatch = await tx.dispatch.findUnique({ where: { id }, include: { items: { include: { reservation: true, salesOrderItem: true } }, salesOrder: { include: { items: true } } } });
      if (!dispatch || dispatch.status !== DispatchStatus.DRAFT) throw new ConflictException('Only a draft dispatch can be posted.');
      for (const item of dispatch.items) {
        const prior = await tx.dispatchItem.aggregate({ where: { salesOrderItemId: item.salesOrderItemId, dispatchId: { not: dispatch.id }, dispatch: { status: { in: [DispatchStatus.DISPATCHED, DispatchStatus.IN_TRANSIT, DispatchStatus.DELIVERED] } } }, _sum: { quantity: true } });
        const total = (prior._sum.quantity ?? 0) + item.quantity;
        if (item.reservation.status !== InventoryReservationStatus.ACTIVE || total > item.reservation.quantity) throw new ConflictException('Reservation is no longer sufficient for this dispatch.');
        const balance = await tx.inventoryBalance.findUnique({ where: { variantId_fulfilmentLocationId: { variantId: item.salesOrderItem.variantId, fulfilmentLocationId: item.fulfilmentLocationId } } });
        if (!balance || balance.physicalQuantity < item.quantity || balance.reservedQuantity < item.quantity) throw new ConflictException('Physical or reserved stock is insufficient.');
        const before = snapshot(balance);
        const updated = await tx.inventoryBalance.update({ where: { id: balance.id }, data: { physicalQuantity: { decrement: item.quantity }, reservedQuantity: { decrement: item.quantity } } });
        await tx.inventoryLedgerEntry.create({ data: { balanceId: balance.id, type: InventoryLedgerType.DISPATCH, physicalDelta: -item.quantity, reservedDelta: -item.quantity, before, after: snapshot(updated), reason: 'Dispatch consumed reserved stock.', reference: dispatch.reference, actorId } });
        if (total === item.reservation.quantity) await tx.inventoryReservation.update({ where: { id: item.reservationId }, data: { status: InventoryReservationStatus.CONSUMED } });
      }
      const shipped = await tx.dispatchItem.aggregate({ where: { dispatch: { salesOrderId: dispatch.salesOrderId, status: { in: [DispatchStatus.DISPATCHED, DispatchStatus.IN_TRANSIT, DispatchStatus.DELIVERED] } } }, _sum: { quantity: true } });
      const ordered = dispatch.salesOrder.items.reduce((sum, item) => sum + item.quantity, 0);
      await tx.salesOrder.update({ where: { id: dispatch.salesOrderId }, data: { status: (shipped._sum.quantity ?? 0) + dispatch.items.reduce((sum, item) => sum + item.quantity, 0) >= ordered ? SalesOrderStatus.DISPATCHED : SalesOrderStatus.PARTIALLY_DISPATCHED } });
      return tx.dispatch.update({ where: { id }, data: { status: DispatchStatus.DISPATCHED, dispatchedAt: new Date(), history: { create: { fromStatus: DispatchStatus.DRAFT, toStatus: DispatchStatus.DISPATCHED, actorId, notes: 'Stock and reservations consumed.' } } } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  async deliverDispatch(id: string, input: ProofOfDeliveryInput, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, warehouseRoles, 'Delivery');
    return this.prisma.client.$transaction(async (tx) => {
      const dispatch = await tx.dispatch.findUnique({ where: { id } });
      if (!dispatch || (dispatch.status !== DispatchStatus.DISPATCHED && dispatch.status !== DispatchStatus.IN_TRANSIT)) throw new ConflictException('Dispatch is not awaiting delivery.');
      await tx.proofOfDelivery.create({ data: { dispatchId: id, ...input, recordedById: actorId } });
      await tx.dispatch.update({ where: { id }, data: { status: DispatchStatus.DELIVERED, deliveredAt: input.receivedAt, history: { create: { fromStatus: dispatch.status, toStatus: DispatchStatus.DELIVERED, actorId, notes: `Received by ${input.receivedBy}` } } } });
      const open = await tx.dispatch.count({ where: { salesOrderId: dispatch.salesOrderId, status: { notIn: [DispatchStatus.DELIVERED, DispatchStatus.CANCELLED] } } });
      if (open === 0) await tx.salesOrder.update({ where: { id: dispatch.salesOrderId }, data: { status: SalesOrderStatus.DELIVERED } });
      return tx.dispatch.findUnique({ where: { id }, include: { proofOfDelivery: true, challan: true } });
    });
  }

  async createReturn(input: ReturnCreateInput, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, returnRoles, 'Returns');
    const order = await this.prisma.client.salesOrder.findUnique({ where: { id: input.salesOrderId }, include: { items: true } });
    if (!order || (order.status !== SalesOrderStatus.DISPATCHED && order.status !== SalesOrderStatus.DELIVERED && order.status !== SalesOrderStatus.RETURNED)) throw new ConflictException('Only dispatched or delivered orders can be returned.');
    const map = new Map(order.items.map((item) => [item.id, item]));
    const items = input.items.map((item) => { const source = map.get(item.salesOrderItemId); if (!source || item.requestedQuantity > source.quantity) throw new ConflictException('Return quantity exceeds the order line.'); return { ...item, variantId: source.variantId, fulfilmentLocationId: source.fulfilmentLocationId }; });
    return this.prisma.client.returnRequest.create({ data: { reference: reference('RET'), salesOrderId: order.id, dispatchId: input.dispatchId, reason: input.reason, customerNotes: input.customerNotes, actorId, items: { create: items } }, include: { items: true } });
  }

  async approveReturn(id: string, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, returnRoles, 'Returns');
    const item = await this.prisma.client.returnRequest.findUnique({ where: { id } });
    if (!item || item.status !== ReturnRequestStatus.REQUESTED) throw new ConflictException('Return is not awaiting approval.');
    return this.prisma.client.returnRequest.update({ where: { id }, data: { status: ReturnRequestStatus.APPROVED, approvedAt: new Date(), actorId } });
  }

  async receiveReturn(id: string, input: ReturnReceiveInput, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, warehouseRoles, 'Return receiving');
    return withSerializableRetry(() => this.prisma.client.$transaction(async (tx) => {
      const request = await tx.returnRequest.findUnique({ where: { id }, include: { items: true } });
      if (!request || request.status !== ReturnRequestStatus.APPROVED) throw new ConflictException('Return is not approved for receiving.');
      const map = new Map(request.items.map((item) => [item.id, item]));
      for (const line of input.items) {
        const item = map.get(line.returnItemId);
        if (!item || line.receivedQuantity > item.requestedQuantity) throw new ConflictException('Received return quantity is invalid.');
        const balance = await tx.inventoryBalance.upsert({ where: { variantId_fulfilmentLocationId: { variantId: item.variantId, fulfilmentLocationId: item.fulfilmentLocationId } }, update: {}, create: { variantId: item.variantId, fulfilmentLocationId: item.fulfilmentLocationId } });
        const before = snapshot(balance);
        const updated = await tx.inventoryBalance.update({ where: { id: balance.id }, data: { physicalQuantity: { increment: line.receivedQuantity }, quarantineQuantity: { increment: line.receivedQuantity } } });
        await tx.inventoryLedgerEntry.create({ data: { balanceId: balance.id, type: InventoryLedgerType.CUSTOMER_RETURN, physicalDelta: line.receivedQuantity, quarantineDelta: line.receivedQuantity, before, after: snapshot(updated), reason: 'Customer return received into quarantine.', reference: request.reference, actorId } });
        await tx.returnItem.update({ where: { id: item.id }, data: { receivedQuantity: line.receivedQuantity } });
      }
      return tx.returnRequest.update({ where: { id }, data: { status: ReturnRequestStatus.RECEIVED, receivedAt: new Date(), actorId } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  async inspectReturn(id: string, input: ReturnInspectInput, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, warehouseRoles, 'Return inspection');
    return withSerializableRetry(() => this.prisma.client.$transaction(async (tx) => {
      const request = await tx.returnRequest.findUnique({ where: { id }, include: { items: { include: { salesOrderItem: true } } } });
      if (!request || request.status !== ReturnRequestStatus.RECEIVED) throw new ConflictException('Return is not ready for inspection.');
      const map = new Map(request.items.map((item) => [item.id, item]));
      for (const line of input.items) {
        const item = map.get(line.returnItemId);
        if (!item || line.restockQuantity + line.damagedQuantity + line.rejectedQuantity !== item.receivedQuantity) throw new BadRequestException('Inspection quantities must equal the received return quantity.');
        const balance = await tx.inventoryBalance.findUniqueOrThrow({ where: { variantId_fulfilmentLocationId: { variantId: item.variantId, fulfilmentLocationId: item.fulfilmentLocationId } } });
        if (balance.quarantineQuantity < item.receivedQuantity) throw new ConflictException('Quarantine stock is insufficient for inspection.');
        const before = snapshot(balance);
        const updated = await tx.inventoryBalance.update({ where: { id: balance.id }, data: { quarantineQuantity: { decrement: item.receivedQuantity }, damagedQuantity: { increment: line.damagedQuantity }, blockedQuantity: { increment: line.rejectedQuantity } } });
        await tx.inventoryLedgerEntry.create({ data: { balanceId: balance.id, type: InventoryLedgerType.CUSTOMER_RETURN, quarantineDelta: -item.receivedQuantity, damagedDelta: line.damagedQuantity, blockedDelta: line.rejectedQuantity, before, after: snapshot(updated), reason: `Return inspection: ${line.decision}`, reference: request.reference, actorId } });
        await tx.returnInspection.create({ data: { returnItemId: item.id, decision: line.decision, restockQuantity: line.restockQuantity, damagedQuantity: line.damagedQuantity, rejectedQuantity: line.rejectedQuantity, notes: input.notes, inspectedById: actorId } });
      }
      if (input.resolution === 'REPLACEMENT') await tx.replacement.create({ data: { reference: reference('RPL'), returnRequestId: id, status: ReplacementStatus.APPROVED, notes: input.notes, items: { create: request.items.filter((item) => item.receivedQuantity > 0).map((item) => ({ returnItemId: item.id, salesOrderItemId: item.salesOrderItemId, variantId: item.variantId, fulfilmentLocationId: item.fulfilmentLocationId, quantity: item.receivedQuantity })) } } });
      if (input.resolution === 'CREDIT_NOTE') { if (input.creditAmount === undefined) throw new BadRequestException('Credit amount is required.'); await tx.creditNote.create({ data: { reference: reference('CN'), returnRequestId: id, status: CreditNoteStatus.ISSUED, amount: input.creditAmount, reason: input.notes ?? request.reason, issuedAt: new Date(), issuedById: actorId } }); }
      await tx.salesOrder.update({ where: { id: request.salesOrderId }, data: { status: SalesOrderStatus.RETURNED } });
      return tx.returnRequest.update({ where: { id }, data: { status: ReturnRequestStatus.RESOLVED, inspectedAt: new Date(), resolvedAt: new Date(), internalNotes: input.notes, actorId } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  async createSupplierReturn(input: SupplierReturnCreateInput, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, warehouseRoles, 'Supplier return');
    return this.prisma.client.supplierReturn.create({ data: { reference: reference('SRET'), supplierId: input.supplierId, purchaseOrderId: input.purchaseOrderId, goodsReceiptId: input.goodsReceiptId, fulfilmentLocationId: input.fulfilmentLocationId, reason: input.reason, status: SupplierReturnStatus.APPROVED, approvedById: actorId, items: { create: input.items } }, include: { items: true } });
  }

  async dispatchSupplierReturn(id: string, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, warehouseRoles, 'Supplier return');
    return withSerializableRetry(() => this.prisma.client.$transaction(async (tx) => {
      const request = await tx.supplierReturn.findUnique({ where: { id }, include: { items: true } });
      if (!request || request.status !== SupplierReturnStatus.APPROVED) throw new ConflictException('Supplier return is not approved.');
      for (const item of request.items) {
        const balance = await tx.inventoryBalance.findUniqueOrThrow({ where: { variantId_fulfilmentLocationId: { variantId: item.variantId, fulfilmentLocationId: request.fulfilmentLocationId } } });
        const source = item.fromDamaged ? balance.damagedQuantity : balance.quarantineQuantity;
        if (source < item.quantity || balance.physicalQuantity < item.quantity) throw new ConflictException('Return stock bucket is insufficient.');
        const before = snapshot(balance);
        const updated = await tx.inventoryBalance.update({ where: { id: balance.id }, data: { physicalQuantity: { decrement: item.quantity }, ...(item.fromDamaged ? { damagedQuantity: { decrement: item.quantity } } : { quarantineQuantity: { decrement: item.quantity } }) } });
        await tx.inventoryLedgerEntry.create({ data: { balanceId: balance.id, type: InventoryLedgerType.SUPPLIER_RETURN, physicalDelta: -item.quantity, damagedDelta: item.fromDamaged ? -item.quantity : 0, quarantineDelta: item.fromDamaged ? 0 : -item.quantity, before, after: snapshot(updated), reason: 'Stock returned to supplier.', reference: request.reference, actorId } });
      }
      return tx.supplierReturn.update({ where: { id }, data: { status: SupplierReturnStatus.DISPATCHED, dispatchedAt: new Date() } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }
}
