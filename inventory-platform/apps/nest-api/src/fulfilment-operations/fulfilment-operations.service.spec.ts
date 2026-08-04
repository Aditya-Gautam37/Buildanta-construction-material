import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { GoodsReceiptStatus, PurchaseOrderStatus, UserRole } from '@workspace/db';
import { FulfilmentOperationsService } from './fulfilment-operations.service';

describe('FulfilmentOperationsService', () => {
  it('keeps procurement writes behind procurement roles', async () => {
    const service = new FulfilmentOperationsService({ client: {} } as never);
    await expect(service.createRequisition({ reason: 'Need project stock', items: [{ variantId: 'v1', targetLocationId: 'l1', quantity: 1, unitCode: 'bag' }] }, 'u1', UserRole.WAREHOUSE_MANAGER)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a goods receipt whose quality buckets do not equal received stock', async () => {
    const client = { purchaseOrder: { findUnique: jest.fn().mockResolvedValue({ id: 'po1', status: PurchaseOrderStatus.SENT, items: [{ id: 'poi1', variantId: 'v1', targetLocationId: 'l1', orderedQuantity: 10, receivedQuantity: 0 }] }) } };
    const service = new FulfilmentOperationsService({ client } as never);
    await expect(service.createGoodsReceipt({ purchaseOrderId: 'po1', fulfilmentLocationId: 'l1', receivedAt: new Date(), items: [{ purchaseOrderItemId: 'poi1', receivedQuantity: 10, acceptedQuantity: 8, rejectedQuantity: 1, damagedQuantity: 0 }] }, UserRole.WAREHOUSE_MANAGER)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('posts a goods receipt, its stock balance and ledger entry in one transaction', async () => {
    const tx = {
      goodsReceipt: { findUnique: jest.fn().mockResolvedValue({ id: 'gr1', reference: 'GRN-1', status: GoodsReceiptStatus.DRAFT, fulfilmentLocationId: 'l1', purchaseOrderId: 'po1', items: [{ variantId: 'v1', receivedQuantity: 10, damagedQuantity: 1, rejectedQuantity: 1, purchaseOrderItemId: 'poi1', purchaseOrderItem: {} }], purchaseOrder: { items: [] } }), update: jest.fn().mockResolvedValue({ id: 'gr1', status: GoodsReceiptStatus.POSTED }) },
      inventoryBalance: { upsert: jest.fn().mockResolvedValue({ id: 'b1', physicalQuantity: 5, reservedQuantity: 0, blockedQuantity: 0, damagedQuantity: 0, quarantineQuantity: 0, inTransitQuantity: 0 }), update: jest.fn().mockResolvedValue({ id: 'b1', physicalQuantity: 15, reservedQuantity: 0, blockedQuantity: 0, damagedQuantity: 1, quarantineQuantity: 1, inTransitQuantity: 0 }) },
      inventoryLedgerEntry: { create: jest.fn().mockResolvedValue({}) },
      purchaseOrderItem: { update: jest.fn().mockResolvedValue({}), findMany: jest.fn().mockResolvedValue([{ orderedQuantity: 10, receivedQuantity: 10 }]) },
      purchaseOrder: { update: jest.fn().mockResolvedValue({}) },
    };
    const client = { $transaction: jest.fn((callback: (value: typeof tx) => unknown) => callback(tx)) };
    const service = new FulfilmentOperationsService({ client } as never);
    await service.postGoodsReceipt('gr1', 'warehouse1', UserRole.WAREHOUSE_MANAGER);
    expect(tx.inventoryBalance.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ physicalQuantity: { increment: 10 }, damagedQuantity: { increment: 1 }, quarantineQuantity: { increment: 1 } }) }));
    expect(tx.inventoryLedgerEntry.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ reference: 'GRN-1', physicalDelta: 10 }) }));
    expect(tx.purchaseOrder.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: PurchaseOrderStatus.RECEIVED } }));
  });
});
