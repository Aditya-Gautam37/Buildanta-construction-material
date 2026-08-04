import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryLedgerType,
  InventoryReservationStatus,
  Prisma,
  ProductStatus,
  StockCountStatus,
  StockTransferStatus,
  UserRole,
  VariantStatus,
} from '@workspace/db';
import { LOCATION_CONFIG_ROLES, requireRole, STOCK_WRITE_ROLES, SUPPLIER_WRITE_ROLES } from '../auth/roles';
import { withSerializableRetry } from '../common/serializable-transaction';
import { PrismaService } from '../database/prisma.service';
import type {
  CarrierCreateDTO,
  CarrierServiceAreaCreateDTO,
  DealerCreateDTO,
  DealerProductCreateDTO,
  DealerServiceAreaCreateDTO,
  FulfilmentServiceAreaDTO,
  InventoryBalanceAdjustmentDTO,
  InventoryReservationCreateDTO,
  PincodeCoverageCreateDTO,
  ServiceAreaCreateDTO,
  StockCountCreateDTO,
  StockCountStatusDTO,
  StockTransferCreateDTO,
  StockTransferStatusDTO,
  SupplierProductCreateDTO,
  WarehouseCreateDTO,
  WarehouseLocationCreateDTO,
  UnitCreateDTO,
  UnitConversionCreateDTO,
} from './dto/inventory-location-dto';

type BalanceQuantities = {
  physicalQuantity: number;
  reservedQuantity: number;
  blockedQuantity: number;
  damagedQuantity: number;
  quarantineQuantity: number;
  inTransitQuantity: number;
};

function balanceSnapshot(balance: BalanceQuantities) {
  return {
    physicalQuantity: balance.physicalQuantity,
    reservedQuantity: balance.reservedQuantity,
    blockedQuantity: balance.blockedQuantity,
    damagedQuantity: balance.damagedQuantity,
    quarantineQuantity: balance.quarantineQuantity,
    inTransitQuantity: balance.inTransitQuantity,
  };
}

export function availableQuantity(balance: BalanceQuantities) {
  return Math.max(
    0,
    balance.physicalQuantity -
      balance.reservedQuantity -
      balance.blockedQuantity -
      balance.damagedQuantity -
      balance.quarantineQuantity,
  );
}

function assertValidBalance(balance: BalanceQuantities) {
  if (Object.values(balance).some((value) => value < 0)) {
    throw new BadRequestException('Inventory quantities cannot be negative.');
  }
  if (availableQuantity(balance) < 0) {
    throw new BadRequestException(
      'Reserved, blocked, damaged and quarantine quantities exceed physical stock.',
    );
  }
  const unavailable =
    balance.reservedQuantity +
    balance.blockedQuantity +
    balance.damagedQuantity +
    balance.quarantineQuantity;
  if (unavailable > balance.physicalQuantity) {
    throw new BadRequestException(
      'Unavailable quantities cannot exceed physical stock.',
    );
  }
}

@Injectable()
export class InventoryLocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(): Promise<unknown> {
    const [
      warehouses,
      serviceAreas,
      fulfilmentLocations,
      balances,
      reservations,
      transfers,
      stockCounts,
      supplierProducts,
      dealers,
      carriers,
      units,
      recentLedger,
      variants,
      suppliers,
    ] = await Promise.all([
      this.prisma.client.warehouse.findMany({
        include: { locations: { orderBy: { code: 'asc' } }, fulfilmentLocation: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.client.serviceArea.findMany({
        include: { pincodes: { orderBy: { pincode: 'asc' } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.client.fulfilmentLocation.findMany({
        include: {
          warehouse: true,
          dealer: true,
          supplier: { select: { id: true, name: true } },
          serviceAreas: { include: { serviceArea: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.client.inventoryBalance.findMany({
        include: {
          variant: { include: { product: { include: { brand: true } } } },
          fulfilmentLocation: true,
          warehouseLocation: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.client.inventoryReservation.findMany({
        include: { variant: { include: { product: true } }, fulfilmentLocation: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.client.stockTransfer.findMany({
        include: {
          originLocation: true,
          destinationLocation: true,
          items: { include: { variant: { include: { product: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.client.stockCount.findMany({
        include: {
          fulfilmentLocation: true,
          items: { include: { variant: { include: { product: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.client.supplierProduct.findMany({
        include: {
          supplier: true,
          variant: { include: { product: true } },
          prices: { orderBy: { validFrom: 'desc' }, take: 3 },
          leadTimes: { include: { serviceArea: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.client.dealer.findMany({
        include: { fulfilmentLocation: true, products: true, serviceAreas: { include: { serviceArea: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.client.carrier.findMany({
        include: { serviceAreas: { include: { serviceArea: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.client.unit.findMany({
        include: { conversionsFrom: { include: { toUnit: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.client.inventoryLedgerEntry.findMany({
        include: {
          balance: {
            include: {
              variant: { include: { product: true } },
              fulfilmentLocation: true,
            },
          },
          actor: { select: { email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.client.productVariant.findMany({
        where: { status: VariantStatus.ACTIVE },
        include: { product: { include: { brand: true } } },
        orderBy: [{ product: { name: 'asc' } }, { sku: 'asc' }],
      }),
      this.prisma.client.supplier.findMany({ orderBy: { name: 'asc' } }),
    ]);
    return {
      warehouses,
      serviceAreas,
      fulfilmentLocations,
      balances: balances.map((balance) => ({
        ...balance,
        availableQuantity: availableQuantity(balance),
      })),
      reservations,
      transfers,
      stockCounts,
      supplierProducts,
      dealers,
      carriers,
      units,
      recentLedger,
      variants,
      suppliers,
    };
  }

  async publicAvailability(pincode: string, productId?: string): Promise<unknown> {
    if (!/^\d{6}$/.test(pincode)) {
      throw new BadRequestException('Enter a valid six-digit PIN code.');
    }
    const coverages = await this.prisma.client.pincodeCoverage.findMany({
      where: { pincode, active: true, serviceArea: { active: true } },
      select: { serviceAreaId: true },
    });
    if (coverages.length === 0) {
      return { pincode, serviceable: false, products: [] };
    }
    const serviceAreaIds = coverages.map((item) => item.serviceAreaId);
    const [balances, dealerProducts, supplierProducts] = await Promise.all([this.prisma.client.inventoryBalance.findMany({
      where: {
        ...(productId ? { variant: { productId } } : {}),
        variant: {
          ...(productId ? { productId } : {}),
          status: VariantStatus.ACTIVE,
          product: { status: ProductStatus.PUBLISHED },
        },
        fulfilmentLocation: {
          active: true,
          serviceAreas: { some: { active: true, serviceAreaId: { in: serviceAreaIds } } },
        },
      },
      include: {
        variant: { select: { productId: true } },
        fulfilmentLocation: {
          include: {
            warehouse: { select: { id: true } },
            dealer: { select: { id: true } },
            serviceAreas: {
              where: { active: true, serviceAreaId: { in: serviceAreaIds } },
              select: { estimatedLeadDays: true },
            },
          },
        },
      },
    }), this.prisma.client.dealerProduct.findMany({
      where:{active:true,variant:{status:VariantStatus.ACTIVE,product:{status:ProductStatus.PUBLISHED,...(productId?{id:productId}:{})}},dealer:{active:true,serviceAreas:{some:{active:true,serviceAreaId:{in:serviceAreaIds}}}}},
      select:{reportedQuantity:true,leadTimeDays:true,variant:{select:{productId:true}}},
    }), this.prisma.client.supplierProduct.findMany({
      where:{active:true,variant:{status:VariantStatus.ACTIVE,product:{status:ProductStatus.PUBLISHED,...(productId?{id:productId}:{})}},leadTimes:{some:{OR:[{serviceAreaId:null},{serviceAreaId:{in:serviceAreaIds}}]}}},
      select:{fulfilmentMode:true,variant:{select:{productId:true}},leadTimes:{where:{OR:[{serviceAreaId:null},{serviceAreaId:{in:serviceAreaIds}}]},select:{minimumDays:true,maximumDays:true}}},
    })]);
    const productMap = new Map<string, { available: number; partnerAvailable: number; onRequest: boolean; low: number; leadDays: number[]; modes: Set<string> }>();
    for (const balance of balances) {
      const current = productMap.get(balance.variant.productId) ?? { available: 0, partnerAvailable: 0, onRequest: false, low: 0, leadDays: [], modes: new Set<string>() };
      current.available += availableQuantity(balance);
      current.low += balance.lowStockThreshold;
      current.leadDays.push(...balance.fulfilmentLocation.serviceAreas.map((area) => area.estimatedLeadDays));
      current.modes.add(balance.fulfilmentLocation.warehouse ? 'STOCKED' : balance.fulfilmentLocation.dealer ? 'PARTNER_STOCK' : 'ON_REQUEST');
      productMap.set(balance.variant.productId, current);
    }
    for(const dealerProduct of dealerProducts){const current=productMap.get(dealerProduct.variant.productId)??{available:0,partnerAvailable:0,onRequest:false,low:0,leadDays:[],modes:new Set<string>()};current.partnerAvailable+=Math.max(0,dealerProduct.reportedQuantity??0);current.leadDays.push(dealerProduct.leadTimeDays);current.modes.add('PARTNER_STOCK');productMap.set(dealerProduct.variant.productId,current)}
    for(const supplierProduct of supplierProducts){const current=productMap.get(supplierProduct.variant.productId)??{available:0,partnerAvailable:0,onRequest:false,low:0,leadDays:[],modes:new Set<string>()};current.onRequest=true;current.modes.add(supplierProduct.fulfilmentMode);for(const lead of supplierProduct.leadTimes)current.leadDays.push(lead.minimumDays,lead.maximumDays);productMap.set(supplierProduct.variant.productId,current)}
    return {
      pincode,
      serviceable: true,
      products: [...productMap.entries()].map(([id, stock]) => ({
        productId: id,
        availabilityStatus:
          stock.available > 0 && stock.available <= stock.low
              ? 'LOW_STOCK'
              : stock.available > 0 || stock.partnerAvailable > 0
                ? 'IN_STOCK'
                : stock.onRequest ? 'ENQUIRY' : 'OUT_OF_STOCK',
        serviceabilityStatus: 'SERVICEABLE',
        fulfilmentMode: stock.available > 0 && stock.modes.has('STOCKED') ? 'STOCKED' : stock.partnerAvailable > 0 ? 'PARTNER_STOCK' : 'ON_REQUEST',
        leadTimeLabel:
          stock.leadDays.length > 0
            ? `Estimated ${Math.min(...stock.leadDays)}-${Math.max(...stock.leadDays)} days`
            : 'Delivery confirmed with quotation',
      })),
    };
  }

  createUnit(input: UnitCreateDTO, role: UserRole): Promise<unknown> {
    requireRole(role, LOCATION_CONFIG_ROLES, 'Unit configuration');
    return this.prisma.client.unit.create({
      data: { ...input, code: input.code.toUpperCase() },
    });
  }

  createUnitConversion(input: UnitConversionCreateDTO, role: UserRole): Promise<unknown> {
    requireRole(role, LOCATION_CONFIG_ROLES, 'Unit configuration');
    return this.prisma.client.unitConversion.upsert({
      where: {
        fromUnitId_toUnitId: {
          fromUnitId: input.fromUnitId,
          toUnitId: input.toUnitId,
        },
      },
      create: input,
      update: { multiplier: input.multiplier },
      include: { fromUnit: true, toUnit: true },
    });
  }

  createWarehouse(input: WarehouseCreateDTO, role: UserRole): Promise<unknown> {
    requireRole(role, LOCATION_CONFIG_ROLES, 'Warehouse configuration');
    return this.prisma.client.$transaction(async (tx) => {
      const warehouse = await tx.warehouse.create({
        data: {
          code: input.code.toUpperCase(),
          name: input.name,
          address: input.address,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          locations: {
            create: { code: input.locationCode.toUpperCase(), name: input.locationName },
          },
        },
        include: { locations: true },
      });
      const fulfilmentLocation = await tx.fulfilmentLocation.create({
        data: {
          code: warehouse.code,
          name: warehouse.name,
          type: 'WAREHOUSE',
          mode: 'STOCKED',
          warehouseId: warehouse.id,
        },
      });
      return { warehouse, fulfilmentLocation };
    });
  }

  createWarehouseLocation(input: WarehouseLocationCreateDTO, role: UserRole): Promise<unknown> {
    requireRole(role, LOCATION_CONFIG_ROLES, 'Warehouse configuration');
    return this.prisma.client.warehouseLocation.create({
      data: { ...input, code: input.code.toUpperCase() },
    });
  }

  createServiceArea(input: ServiceAreaCreateDTO, role: UserRole): Promise<unknown> {
    requireRole(role, LOCATION_CONFIG_ROLES, 'Service-area configuration');
    return this.prisma.client.serviceArea.create({
      data: {
        code: input.code.toUpperCase(),
        name: input.name,
        city: input.city,
        state: input.state,
        pincodes: { create: [...new Set(input.pincodes)].map((value) => ({ pincode: value })) },
      },
      include: { pincodes: true },
    });
  }

  async addPincodes(input: PincodeCoverageCreateDTO, role: UserRole): Promise<unknown> {
    requireRole(role, LOCATION_CONFIG_ROLES, 'Service-area configuration');
    const serviceArea = await this.prisma.client.serviceArea.findUnique({ where: { id: input.serviceAreaId } });
    if (!serviceArea) throw new NotFoundException('Service area not found.');
    await this.prisma.client.pincodeCoverage.createMany({
      data: [...new Set(input.pincodes)].map((value) => ({ serviceAreaId: input.serviceAreaId, pincode: value })),
      skipDuplicates: true,
    });
    return this.prisma.client.serviceArea.findUnique({ where: { id: input.serviceAreaId }, include: { pincodes: true } });
  }

  linkServiceArea(input: FulfilmentServiceAreaDTO, role: UserRole): Promise<unknown> {
    requireRole(role, LOCATION_CONFIG_ROLES, 'Service-area configuration');
    return this.prisma.client.fulfilmentServiceArea.upsert({
      where: { fulfilmentLocationId_serviceAreaId: { fulfilmentLocationId: input.fulfilmentLocationId, serviceAreaId: input.serviceAreaId } },
      create: input,
      update: { deliveryCharge: input.deliveryCharge, minimumOrderValue: input.minimumOrderValue, estimatedLeadDays: input.estimatedLeadDays, active: true },
      include: { fulfilmentLocation: true, serviceArea: true },
    });
  }

  async adjustBalance(input: InventoryBalanceAdjustmentDTO, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, STOCK_WRITE_ROLES, 'Stock adjustment');
    return withSerializableRetry(() =>
      this.prisma.client.$transaction(async (tx) => {
        const variant = await tx.productVariant.findUnique({ where: { id: input.variantId } });
        if (!variant) throw new NotFoundException('Product variant not found.');
        const location = await tx.fulfilmentLocation.findUnique({ where: { id: input.fulfilmentLocationId } });
        if (!location) throw new NotFoundException('Fulfilment location not found.');
        let balance = await tx.inventoryBalance.findUnique({
          where: { variantId_fulfilmentLocationId: { variantId: input.variantId, fulfilmentLocationId: input.fulfilmentLocationId } },
        });
        if (!balance) {
          balance = await tx.inventoryBalance.create({
            data: {
              variantId: input.variantId,
              fulfilmentLocationId: input.fulfilmentLocationId,
              warehouseLocationId: input.warehouseLocationId,
              lowStockThreshold: input.lowStockThreshold ?? variant.lowStockThreshold,
            },
          });
        }
        const before = balanceSnapshot(balance);
        const after = {
          physicalQuantity: balance.physicalQuantity + input.physicalDelta,
          reservedQuantity: balance.reservedQuantity + input.reservedDelta,
          blockedQuantity: balance.blockedQuantity + input.blockedDelta,
          damagedQuantity: balance.damagedQuantity + input.damagedDelta,
          quarantineQuantity: balance.quarantineQuantity + input.quarantineDelta,
          inTransitQuantity: balance.inTransitQuantity + input.inTransitDelta,
        };
        assertValidBalance(after);
        const updated = await tx.inventoryBalance.update({
          where: { id: balance.id },
          data: {
            ...after,
            warehouseLocationId: input.warehouseLocationId ?? balance.warehouseLocationId,
            lowStockThreshold: input.lowStockThreshold ?? balance.lowStockThreshold,
          },
        });
        const ledger = await tx.inventoryLedgerEntry.create({
          data: {
            balanceId: balance.id,
            type: input.type,
            physicalDelta: input.physicalDelta,
            reservedDelta: input.reservedDelta,
            blockedDelta: input.blockedDelta,
            damagedDelta: input.damagedDelta,
            quarantineDelta: input.quarantineDelta,
            inTransitDelta: input.inTransitDelta,
            before,
            after,
            reason: input.reason,
            reference: input.reference,
            actorId,
          },
        });
        await this.syncVariantSummary(tx, input.variantId);
        return { balance: { ...updated, availableQuantity: availableQuantity(updated) }, ledger };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }),
    );
  }

  async createReservation(input: InventoryReservationCreateDTO, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, STOCK_WRITE_ROLES, 'Inventory reservation');
    return withSerializableRetry(() => this.prisma.client.$transaction(async (tx) => {
      const balance = await tx.inventoryBalance.findUnique({
        where: { variantId_fulfilmentLocationId: { variantId: input.variantId, fulfilmentLocationId: input.fulfilmentLocationId } },
      });
      if (!balance) throw new NotFoundException('Inventory balance not found.');
      if (availableQuantity(balance) < input.quantity) throw new ConflictException('Not enough available stock for this reservation.');
      const before = balanceSnapshot(balance);
      const updated = await tx.inventoryBalance.update({ where: { id: balance.id }, data: { reservedQuantity: { increment: input.quantity } } });
      const reservation = await tx.inventoryReservation.create({ data: input });
      await tx.inventoryLedgerEntry.create({
        data: { balanceId: balance.id, type: InventoryLedgerType.RESERVATION, reservedDelta: input.quantity, before, after: balanceSnapshot(updated), reason: input.notes || 'Inventory reservation created', reference: input.reference, actorId },
      });
      await this.syncVariantSummary(tx, input.variantId);
      return reservation;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  async releaseReservation(id: string, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, STOCK_WRITE_ROLES, 'Inventory reservation');
    return withSerializableRetry(() => this.prisma.client.$transaction(async (tx) => {
      const reservation = await tx.inventoryReservation.findUnique({ where: { id } });
      if (!reservation) throw new NotFoundException('Reservation not found.');
      if (reservation.status !== InventoryReservationStatus.ACTIVE) throw new ConflictException('Only active reservations can be released.');
      const balance = await tx.inventoryBalance.findUniqueOrThrow({
        where: { variantId_fulfilmentLocationId: { variantId: reservation.variantId, fulfilmentLocationId: reservation.fulfilmentLocationId } },
      });
      if (balance.reservedQuantity < reservation.quantity) throw new ConflictException('Reservation balance is inconsistent.');
      const updated = await tx.inventoryBalance.update({ where: { id: balance.id }, data: { reservedQuantity: { decrement: reservation.quantity } } });
      await tx.inventoryLedgerEntry.create({ data: { balanceId: balance.id, type: InventoryLedgerType.RESERVATION_RELEASE, reservedDelta: -reservation.quantity, before: balanceSnapshot(balance), after: balanceSnapshot(updated), reason: 'Reservation released', reference: reservation.reference, actorId } });
      await this.syncVariantSummary(tx, reservation.variantId);
      return tx.inventoryReservation.update({ where: { id }, data: { status: InventoryReservationStatus.RELEASED } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  async createTransfer(input: StockTransferCreateDTO, role: UserRole): Promise<unknown> {
    requireRole(role, STOCK_WRITE_ROLES, 'Stock transfer');
    if (new Set(input.items.map((item) => item.variantId)).size !== input.items.length) throw new BadRequestException('Each variant can appear only once in a transfer.');
    return this.prisma.client.stockTransfer.create({
      data: { reference: input.reference, originLocationId: input.originLocationId, destinationLocationId: input.destinationLocationId, notes: input.notes, items: { create: input.items } },
      include: { items: true, originLocation: true, destinationLocation: true },
    });
  }

  async transitionTransfer(id: string, input: StockTransferStatusDTO, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, STOCK_WRITE_ROLES, 'Stock transfer');
    return withSerializableRetry(() => this.prisma.client.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({ where: { id }, include: { items: true } });
      if (!transfer) throw new NotFoundException('Stock transfer not found.');
      if (input.status === StockTransferStatus.IN_TRANSIT) {
        if (transfer.status !== StockTransferStatus.DRAFT) throw new ConflictException('Only draft transfers can be dispatched.');
        for (const item of transfer.items) await this.dispatchTransferItem(tx, transfer, item, actorId);
        return tx.stockTransfer.update({ where: { id }, data: { status: StockTransferStatus.IN_TRANSIT, dispatchedAt: new Date() } });
      }
      if (input.status === StockTransferStatus.RECEIVED) {
        if (transfer.status !== StockTransferStatus.IN_TRANSIT) throw new ConflictException('Only in-transit transfers can be received.');
        for (const item of transfer.items) await this.receiveTransferItem(tx, transfer, item, actorId);
        return tx.stockTransfer.update({ where: { id }, data: { status: StockTransferStatus.RECEIVED, receivedAt: new Date(), items: { updateMany: transfer.items.map((item) => ({ where: { id: item.id }, data: { receivedQuantity: item.quantity } })) } } });
      }
      if (input.status === StockTransferStatus.CANCELLED && transfer.status === StockTransferStatus.DRAFT) return tx.stockTransfer.update({ where: { id }, data: { status: StockTransferStatus.CANCELLED } });
      throw new ConflictException('This transfer transition is not allowed.');
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  async createStockCount(input: StockCountCreateDTO, role: UserRole): Promise<unknown> {
    requireRole(role, STOCK_WRITE_ROLES, 'Stock count');
    if (new Set(input.items.map((item) => item.variantId)).size !== input.items.length) throw new BadRequestException('Each variant can appear only once in a count.');
    const balances = await this.prisma.client.inventoryBalance.findMany({ where: { fulfilmentLocationId: input.fulfilmentLocationId, variantId: { in: input.items.map((item) => item.variantId) } } });
    const byVariant = new Map(balances.map((balance) => [balance.variantId, balance]));
    return this.prisma.client.stockCount.create({
      data: { reference: input.reference, fulfilmentLocationId: input.fulfilmentLocationId, notes: input.notes, items: { create: input.items.map((item) => ({ variantId: item.variantId, countedQuantity: item.countedQuantity, expectedQuantity: byVariant.get(item.variantId)?.physicalQuantity ?? 0 })) } },
      include: { items: true },
    });
  }

  async transitionStockCount(id: string, input: StockCountStatusDTO, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, STOCK_WRITE_ROLES, 'Stock count');
    return withSerializableRetry(() => this.prisma.client.$transaction(async (tx) => {
      const count = await tx.stockCount.findUnique({ where: { id }, include: { items: true } });
      if (!count) throw new NotFoundException('Stock count not found.');
      if (input.status === StockCountStatus.SUBMITTED && count.status === StockCountStatus.DRAFT) return tx.stockCount.update({ where: { id }, data: { status: StockCountStatus.SUBMITTED, countedAt: new Date() } });
      if (input.status === StockCountStatus.CANCELLED && (count.status === StockCountStatus.DRAFT || count.status === StockCountStatus.SUBMITTED)) return tx.stockCount.update({ where: { id }, data: { status: StockCountStatus.CANCELLED } });
      if (input.status !== StockCountStatus.APPROVED || count.status !== StockCountStatus.SUBMITTED) throw new ConflictException('This stock-count transition is not allowed.');
      for (const item of count.items) {
        const balance = await tx.inventoryBalance.findUnique({ where: { variantId_fulfilmentLocationId: { variantId: item.variantId, fulfilmentLocationId: count.fulfilmentLocationId } } });
        if (!balance) throw new NotFoundException('A counted inventory balance was not found.');
        const physicalDelta = item.countedQuantity - balance.physicalQuantity;
        const after = { ...balanceSnapshot(balance), physicalQuantity: item.countedQuantity };
        assertValidBalance(after);
        const updated = await tx.inventoryBalance.update({ where: { id: balance.id }, data: { physicalQuantity: item.countedQuantity } });
        await tx.inventoryLedgerEntry.create({ data: { balanceId: balance.id, type: InventoryLedgerType.COUNT_CORRECTION, physicalDelta, before: balanceSnapshot(balance), after: balanceSnapshot(updated), reason: 'Approved stock count', reference: count.reference, actorId } });
        await this.syncVariantSummary(tx, item.variantId);
      }
      return tx.stockCount.update({ where: { id }, data: { status: StockCountStatus.APPROVED, approvedAt: new Date() } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  createSupplierProduct(input: SupplierProductCreateDTO, role: UserRole): Promise<unknown> {
    requireRole(role, SUPPLIER_WRITE_ROLES, 'Supplier-product configuration');
    const validFrom = input.validFrom ?? new Date();
    return this.prisma.client.supplierProduct.upsert({
      where: { supplierId_variantId: { supplierId: input.supplierId, variantId: input.variantId } },
      create: {
        supplierId: input.supplierId,
        variantId: input.variantId,
        supplierSku: input.supplierSku,
        fulfilmentMode: input.fulfilmentMode,
        prices: input.price === undefined ? undefined : { create: { price: input.price, minimumQuantity: input.minimumQuantity, validFrom, validUntil: input.validUntil } },
        leadTimes: input.minimumDays === undefined ? undefined : { create: { minimumDays: input.minimumDays, maximumDays: input.maximumDays ?? input.minimumDays, serviceAreaId: input.serviceAreaId } },
      },
      update: {
        supplierSku: input.supplierSku,
        fulfilmentMode: input.fulfilmentMode,
        active: true,
        prices: input.price === undefined ? undefined : { create: { price: input.price, minimumQuantity: input.minimumQuantity, validFrom, validUntil: input.validUntil } },
        leadTimes: input.minimumDays === undefined ? undefined : { create: { minimumDays: input.minimumDays, maximumDays: input.maximumDays ?? input.minimumDays, serviceAreaId: input.serviceAreaId } },
      },
      include: { supplier: true, variant: { include: { product: true } }, prices: true, leadTimes: true },
    });
  }

  createDealer(input: DealerCreateDTO, role: UserRole): Promise<unknown> {
    requireRole(role, SUPPLIER_WRITE_ROLES, 'Dealer configuration');
    return this.prisma.client.$transaction(async (tx) => {
      const dealer = await tx.dealer.create({ data: { ...input, code: input.code.toUpperCase() } });
      const fulfilmentLocation = await tx.fulfilmentLocation.create({ data: { code: dealer.code, name: dealer.name, type: 'DEALER_PARTNER', mode: 'PARTNER_STOCK', dealerId: dealer.id } });
      return { dealer, fulfilmentLocation };
    });
  }

  createDealerProduct(input: DealerProductCreateDTO, role: UserRole): Promise<unknown> {
    requireRole(role, SUPPLIER_WRITE_ROLES, 'Dealer configuration');
    return this.prisma.client.dealerProduct.upsert({
      where: { dealerId_variantId: { dealerId: input.dealerId, variantId: input.variantId } },
      create: { ...input, confirmedAt: new Date() },
      update: { ...input, confirmedAt: new Date(), active: true },
    });
  }

  createDealerServiceArea(input: DealerServiceAreaCreateDTO, role: UserRole): Promise<unknown> {
    requireRole(role, SUPPLIER_WRITE_ROLES, 'Dealer configuration');
    return this.prisma.client.dealerServiceArea.upsert({
      where: { dealerId_serviceAreaId: { dealerId: input.dealerId, serviceAreaId: input.serviceAreaId } },
      create: input,
      update: { ...input, active: true },
    });
  }

  createCarrier(input: CarrierCreateDTO, role: UserRole): Promise<unknown> {
    requireRole(role, LOCATION_CONFIG_ROLES, 'Carrier configuration');
    return this.prisma.client.carrier.create({ data: { ...input, code: input.code.toUpperCase() } });
  }

  createCarrierServiceArea(input: CarrierServiceAreaCreateDTO, role: UserRole): Promise<unknown> {
    requireRole(role, LOCATION_CONFIG_ROLES, 'Carrier configuration');
    return this.prisma.client.carrierServiceArea.upsert({
      where: { carrierId_serviceAreaId: { carrierId: input.carrierId, serviceAreaId: input.serviceAreaId } },
      create: input,
      update: { ...input, active: true },
    });
  }

  private async syncVariantSummary(tx: Prisma.TransactionClient, variantId: string) {
    const totals = await tx.inventoryBalance.aggregate({
      where: { variantId },
      _sum: { physicalQuantity: true, reservedQuantity: true },
    });
    await tx.productVariant.update({
      where: { id: variantId },
      data: {
        stockQuantity: totals._sum.physicalQuantity ?? 0,
        reservedQuantity: totals._sum.reservedQuantity ?? 0,
        stockTracked: true,
      },
    });
  }

  private async dispatchTransferItem(
    tx: Prisma.TransactionClient,
    transfer: { reference: string; originLocationId: string },
    item: { variantId: string; quantity: number },
    actorId: string,
  ) {
    const balance = await tx.inventoryBalance.findUnique({ where: { variantId_fulfilmentLocationId: { variantId: item.variantId, fulfilmentLocationId: transfer.originLocationId } } });
    if (!balance || availableQuantity(balance) < item.quantity) throw new ConflictException('Transfer quantity exceeds available origin stock.');
    const updated = await tx.inventoryBalance.update({ where: { id: balance.id }, data: { physicalQuantity: { decrement: item.quantity }, inTransitQuantity: { increment: item.quantity } } });
    await tx.inventoryLedgerEntry.create({ data: { balanceId: balance.id, type: InventoryLedgerType.TRANSFER_OUT, physicalDelta: -item.quantity, inTransitDelta: item.quantity, before: balanceSnapshot(balance), after: balanceSnapshot(updated), reason: 'Stock transfer dispatched', reference: transfer.reference, actorId } });
    await this.syncVariantSummary(tx, item.variantId);
  }

  private async receiveTransferItem(
    tx: Prisma.TransactionClient,
    transfer: { reference: string; originLocationId: string; destinationLocationId: string },
    item: { variantId: string; quantity: number },
    actorId: string,
  ) {
    const origin = await tx.inventoryBalance.findUniqueOrThrow({ where: { variantId_fulfilmentLocationId: { variantId: item.variantId, fulfilmentLocationId: transfer.originLocationId } } });
    if (origin.inTransitQuantity < item.quantity) throw new ConflictException('In-transit quantity is inconsistent.');
    const originUpdated = await tx.inventoryBalance.update({ where: { id: origin.id }, data: { inTransitQuantity: { decrement: item.quantity } } });
    await tx.inventoryLedgerEntry.create({ data: { balanceId: origin.id, type: InventoryLedgerType.TRANSFER_OUT, inTransitDelta: -item.quantity, before: balanceSnapshot(origin), after: balanceSnapshot(originUpdated), reason: 'Stock transfer received at destination', reference: transfer.reference, actorId } });
    let destination = await tx.inventoryBalance.findUnique({ where: { variantId_fulfilmentLocationId: { variantId: item.variantId, fulfilmentLocationId: transfer.destinationLocationId } } });
    if (!destination) destination = await tx.inventoryBalance.create({ data: { variantId: item.variantId, fulfilmentLocationId: transfer.destinationLocationId } });
    const destinationUpdated = await tx.inventoryBalance.update({ where: { id: destination.id }, data: { physicalQuantity: { increment: item.quantity } } });
    await tx.inventoryLedgerEntry.create({ data: { balanceId: destination.id, type: InventoryLedgerType.TRANSFER_IN, physicalDelta: item.quantity, before: balanceSnapshot(destination), after: balanceSnapshot(destinationUpdated), reason: 'Stock transfer received', reference: transfer.reference, actorId } });
    await this.syncVariantSummary(tx, item.variantId);
  }
}
