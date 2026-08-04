import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@workspace/db';
import { CalculatorsService } from './calculators.service';

describe('CalculatorsService public contract', () => {
  const service = new CalculatorsService({} as never, {} as never, {} as never);

  it('removes private inventory, supplier, cost and audit fields from public estimates', () => {
    const payload = (service as any).toPublicEstimate({
      reference: 'EST-TEST',
      definition: { name: 'Test calculator', slug: 'test', disclaimer: 'Safe public disclaimer', unpublishedConfiguration: { secret: true } },
      calculatorVersion: { version: 3, formulaKey: 'private-key' },
      deliveryPincode: '208001', qualityTier: 'STANDARD', inputs: { lengthM: 1 }, results: {}, assumptions: [],
      subtotal: 100, gstTotal: 18, deliveryTotal: null, valueHigh: 118, priceValidUntil: null,
      expiresAt: new Date(Date.now() + 60_000), status: 'ACTIVE', quotation: null,
      exactWarehouseStock: 999, supplierContacts: ['private'], auditEvents: ['private'],
      items: [{
        id: 'item', outputKey: 'cement', description: 'Cement', rawQuantity: 1, wastageQuantity: 0.05, purchaseQuantity: 2,
        unitCode: 'bag', packageSize: 1, availabilityLabel: 'Request confirmation', leadTimeLabel: null, unitPrice: 400,
        gstPercent: 18, lineTotal: 944, costPrice: 100, supplier: { email: 'private@example.test' }, exactStock: 999,
        product: { id: 'product', name: 'Public product', brand: { name: 'Public brand' }, images: [] },
        variant: { id: 'variant', sku: 'PUBLIC-SKU', unit: 'bag', attributes: {} },
      }],
    });
    const serialized = JSON.stringify(payload);
    expect(serialized).toContain('Public product');
    expect(serialized).not.toContain('costPrice');
    expect(serialized).not.toContain('supplierContacts');
    expect(serialized).not.toContain('exactWarehouseStock');
    expect(serialized).not.toContain('auditEvents');
    expect(serialized).not.toContain('private@example.test');
    expect(serialized).not.toContain('formulaKey');
    expect(serialized).not.toContain('unpublishedConfiguration');
  });

  it('rejects unrelated staff roles from the calculator operations overview', async () => {
    await expect(service.adminOverview(UserRole.WAREHOUSE_MANAGER)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
