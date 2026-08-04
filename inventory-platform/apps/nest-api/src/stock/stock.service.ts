import { Injectable, NotFoundException } from '@nestjs/common';
import { InventoryLedgerType, StockTransactionType, type UserRole } from '@workspace/db';
import { requireRole, STOCK_WRITE_ROLES } from '../auth/roles';
import { PrismaService } from '../database/prisma.service';
import { InventoryLocationsService } from '../inventory-locations/inventory-locations.service';
import type { StockAdjustmentDTO } from './dto/stock-adjustment-dto';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService, private readonly locationInventory: InventoryLocationsService) {}

  async list(): Promise<unknown> {
    const [variants, recentTransactions] = await Promise.all([
      this.prisma.client.productVariant.findMany({
        include: { product: { include: { brand: true } }, supplier: true },
        orderBy: [{ product: { name: 'asc' } }, { sku: 'asc' }],
      }),
      this.prisma.client.stockTransaction.findMany({
        include: {
          variant: { include: { product: true, supplier: true } },
          actor: { select: { email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);
    return { variants, recentTransactions };
  }

  async adjust(input: StockAdjustmentDTO, actorId: string, role: UserRole): Promise<unknown> {
    requireRole(role, STOCK_WRITE_ROLES, 'Stock adjustment');
    const balance = await this.prisma.client.inventoryBalance.findFirst({
      where: { variantId: input.variantId },
      orderBy: { createdAt: 'asc' },
    });
    if (!balance) throw new NotFoundException('Assign this variant to a fulfilment location before adjusting stock.');
    const type = input.type === StockTransactionType.DAMAGED
      ? InventoryLedgerType.DAMAGE
      : input.type === StockTransactionType.CUSTOMER_RETURN
        ? InventoryLedgerType.RETURN
        : input.type === StockTransactionType.RESERVED
          ? InventoryLedgerType.RESERVATION
          : input.type === StockTransactionType.RESERVATION_RELEASED
            ? InventoryLedgerType.RESERVATION_RELEASE
            : InventoryLedgerType.ADJUSTMENT;
    return this.locationInventory.adjustBalance({
      variantId: input.variantId,
      fulfilmentLocationId: balance.fulfilmentLocationId,
      physicalDelta: input.stockDelta,
      reservedDelta: input.reservedDelta,
      blockedDelta: 0,
      damagedDelta: 0,
      quarantineDelta: 0,
      inTransitDelta: 0,
      type,
      reason: input.reason,
      reference: input.reference,
    }, actorId, role);
  }
}
