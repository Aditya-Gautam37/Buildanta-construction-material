import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@workspace/db';
import type { PrismaService } from '../database/prisma.service';
import { availableQuantity, InventoryLocationsService } from './inventory-locations.service';

describe('InventoryLocationsService role checks', () => {
  it('rejects a stock-balance adjustment from a role outside the warehouse group', async () => {
    const service = new InventoryLocationsService({ client: {} } as unknown as PrismaService);

    await expect(
      service.adjustBalance(
        { variantId: 'v1', fulfilmentLocationId: 'loc-1', physicalDelta: 1, reservedDelta: 0, blockedDelta: 0, damagedDelta: 0, quarantineDelta: 0, inTransitDelta: 0, type: 'ADJUSTMENT', reason: 'test' } as never,
        'user-1',
        UserRole.SALES,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects warehouse configuration from a role outside the location-config group', () => {
    const service = new InventoryLocationsService({ client: {} } as unknown as PrismaService);

    expect(() =>
      service.createWarehouse(
        { code: 'wh1', name: 'Warehouse 1', locationCode: 'loc1', locationName: 'Main' } as never,
        UserRole.PROCUREMENT,
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects dealer configuration from a role outside the supplier group', () => {
    const service = new InventoryLocationsService({ client: {} } as unknown as PrismaService);

    expect(() =>
      service.createDealer({ code: 'd1', name: 'Dealer 1' } as never, UserRole.WAREHOUSE_MANAGER),
    ).toThrow(ForbiddenException);
  });
});

describe('InventoryLocationsService', () => {
  it('calculates sellable stock after every unavailable bucket', () => {
    expect(availableQuantity({
      physicalQuantity: 100,
      reservedQuantity: 10,
      blockedQuantity: 5,
      damagedQuantity: 3,
      quarantineQuantity: 2,
      inTransitQuantity: 20,
    })).toBe(80);
  });

  it('returns a public PIN-code result without exact balances or location details', async () => {
    const service = new InventoryLocationsService({
      client: {
        pincodeCoverage: {
          findMany: jest.fn().mockResolvedValue([{ serviceAreaId: 'area-1' }]),
        },
        inventoryBalance: {
          findMany: jest.fn().mockResolvedValue([{
            physicalQuantity: 50,
            reservedQuantity: 10,
            blockedQuantity: 5,
            damagedQuantity: 0,
            quarantineQuantity: 0,
            lowStockThreshold: 5,
            variant: { productId: 'product-1' },
            fulfilmentLocation: { warehouse: { id: 'warehouse-1' }, dealer: null, serviceAreas: [{ estimatedLeadDays: 2 }] },
          }]),
        },
        dealerProduct: { findMany: jest.fn().mockResolvedValue([]) },
        supplierProduct: { findMany: jest.fn().mockResolvedValue([]) },
      },
    } as unknown as PrismaService);

    const result = await service.publicAvailability('208001') as Record<string, unknown>;
    const json = JSON.stringify(result);

    expect(result.serviceable).toBe(true);
    expect(json).toContain('IN_STOCK');
    expect(json).toContain('STOCKED');
    expect(json).not.toContain('physicalQuantity');
    expect(json).not.toContain('reservedQuantity');
    expect(json).not.toContain('fulfilmentLocation');
  });

  it('returns not serviceable when a PIN code has no active coverage', async () => {
    const service = new InventoryLocationsService({
      client: {
        pincodeCoverage: { findMany: jest.fn().mockResolvedValue([]) },
      },
    } as unknown as PrismaService);

    await expect(service.publicAvailability('999999')).resolves.toEqual({
      pincode: '999999',
      serviceable: false,
      products: [],
    });
  });
});
