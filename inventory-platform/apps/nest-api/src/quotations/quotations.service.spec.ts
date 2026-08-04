import { ForbiddenException } from '@nestjs/common';
import { ProductStatus, QuotationStatus, UserRole, VariantStatus } from '@workspace/db';
import { QuotationsService } from './quotations.service';

describe('QuotationsService', () => {
  it('enforces the sales role before changing quotation state', async () => {
    const service = new QuotationsService({ client: {} } as never);
    await expect(service.updateStatus('quote-1', { status: QuotationStatus.REVIEWING, reason: 'Start review' }, 'user-1', UserRole.WAREHOUSE_MANAGER)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not allow sales staff to submit internal margin values', async () => {
    const service = new QuotationsService({ client: {} } as never);
    await expect(service.createRevision('quote-1', {
      validUntil: new Date(Date.now() + 86_400_000),
      freightTotal: 0,
      discountTotal: 0,
      marginTotal: 100,
      items: [],
    }, 'sales-1', UserRole.SALES)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns the existing customer booking instead of creating a duplicate sales order', async () => {
    const existingOrder = { id: 'order-1', reference: 'SO-EXISTING', items: [] };
    const tx = {
      quotation: { findUnique: jest.fn().mockResolvedValue({ id: 'quote-1', customerEmail: 'customer@example.com', status: QuotationStatus.ACCEPTED, salesOrder: { id: 'order-1' }, revisions: [] }) },
      salesOrder: { findUnique: jest.fn().mockResolvedValue(existingOrder) },
    };
    const client = { $transaction: jest.fn((callback: (value: typeof tx) => unknown) => callback(tx)) };
    const service = new QuotationsService({ client } as never);

    await expect(service.acceptForCustomer('quote-1', { reason: 'Customer booked complete BOQ' }, 'customer-1', 'Customer@Example.com')).resolves.toEqual(existingOrder);
    expect(tx.salesOrder.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'order-1' } }));
  });

  it('calculates a complete revision and creates a pending approval', async () => {
    const revisionCreate = jest.fn().mockResolvedValue({ id: 'revision-1', items: [], approvals: [{ id: 'approval-1' }] });
    const quotationUpdate = jest.fn().mockResolvedValue({ id: 'quote-1' });
    const tx = {
      quotation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'quote-1', status: QuotationStatus.SUBMITTED, currentRevisionNumber: 0, deliveryPincode: '208001',
          items: [{ id: 'item-1' }, { id: 'item-2' }],
        }),
        update: quotationUpdate,
      },
      pincodeCoverage: { findMany: jest.fn().mockResolvedValue([{ serviceAreaId: 'area-1' }]) },
      productVariant: { findMany: jest.fn().mockResolvedValue([
        { id: 'variant-1', status: VariantStatus.ACTIVE, product: { status: ProductStatus.PUBLISHED } },
        { id: 'variant-2', status: VariantStatus.ACTIVE, product: { status: ProductStatus.PUBLISHED } },
      ]) },
      fulfilmentLocation: { findMany: jest.fn().mockResolvedValue([
        { id: 'location-1', dealerId: null, serviceAreas: [{ serviceAreaId: 'area-1' }] },
      ]) },
      quotationRevision: { create: revisionCreate },
    };
    const client = { $transaction: jest.fn((callback: (value: typeof tx) => unknown) => callback(tx)) };
    const service = new QuotationsService({ client } as never);
    await service.createRevision('quote-1', {
      validUntil: new Date(Date.now() + 86_400_000), freightTotal: 20, discountTotal: 5,
      items: [
        { quotationItemId: 'item-1', variantId: 'variant-1', fulfilmentLocationId: 'location-1', description: 'Cement', quantity: 2, unitCode: 'bag', unitPrice: 100, gstPercent: 18, discountAmount: 10, estimatedLeadDays: 2, isAlternative: false },
        { quotationItemId: 'item-2', variantId: 'variant-2', fulfilmentLocationId: 'location-1', description: 'Steel', quantity: 1, unitCode: 'piece', unitPrice: 50, gstPercent: 18, discountAmount: 0, estimatedLeadDays: 2, isAlternative: false },
      ],
    }, 'sales-1', UserRole.SALES);
    expect(revisionCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ subtotal: 250, gstTotal: 43.2, discountTotal: 15, grandTotal: 298.2, approvals: { create: expect.objectContaining({ requestedById: 'sales-1' }) } }) }));
    expect(quotationUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: QuotationStatus.REVIEWING, currentRevisionNumber: 1 }) }));
  });
});
