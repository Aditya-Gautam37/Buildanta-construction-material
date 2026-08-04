import { ForbiddenException } from '@nestjs/common';
import { StockTransactionType, UserRole } from '@workspace/db';
import type { PrismaService } from '../database/prisma.service';
import type { InventoryLocationsService } from '../inventory-locations/inventory-locations.service';
import { StockService } from './stock.service';

describe('StockService', () => {
  it('routes legacy adjustments through the location-aware source of truth', async () => {
    const adjustBalance = jest.fn().mockResolvedValue({ balance: { id: 'balance-1' } });
    const service = new StockService({
      client: {
        inventoryBalance: { findFirst: jest.fn().mockResolvedValue({ id: 'balance-1', fulfilmentLocationId: 'location-1' }) },
      },
    } as unknown as PrismaService, { adjustBalance } as unknown as InventoryLocationsService);

    await service.adjust({
      variantId: 'v1', stockDelta: 3, reservedDelta: 0,
      type: StockTransactionType.CUSTOMER_SALE, reason: 'Test sale',
    }, 'user-1', UserRole.WAREHOUSE_MANAGER);

    expect(adjustBalance).toHaveBeenCalledWith(expect.objectContaining({
      variantId: 'v1',
      fulfilmentLocationId: 'location-1',
      physicalDelta: 3,
    }), 'user-1', UserRole.WAREHOUSE_MANAGER);
  });

  it('rejects stock adjustments from a role outside the warehouse group', async () => {
    const service = new StockService({} as unknown as PrismaService, {} as unknown as InventoryLocationsService);

    await expect(
      service.adjust({
        variantId: 'v1', stockDelta: 3, reservedDelta: 0,
        type: StockTransactionType.CUSTOMER_SALE, reason: 'Test sale',
      }, 'user-1', UserRole.SALES),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
