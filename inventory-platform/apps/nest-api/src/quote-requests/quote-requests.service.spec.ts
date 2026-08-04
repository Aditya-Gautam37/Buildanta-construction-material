import { BadRequestException } from '@nestjs/common';
import { ProductStatus, VariantStatus } from '@workspace/db';
import { QuoteRequestsService } from './quote-requests.service';

describe('QuoteRequestsService', () => {
  const quoteRequestCreate = jest.fn().mockResolvedValue({ id: 'source-1' });
  const quotationCreate = jest.fn().mockResolvedValue({ id: 'quotation-1' });
  const productVariantFindMany = jest.fn();
  const productFindMany = jest.fn();
  const transaction = jest.fn((callback: (client: unknown) => unknown) => callback({
    quoteRequest: { create: quoteRequestCreate },
    quotation: { create: quotationCreate },
  }));
  const service = new QuoteRequestsService({ client: {
    productVariant: { findMany: productVariantFindMany },
    product: { findMany: productFindMany },
    $transaction: transaction,
  } } as never);

  beforeEach(() => {
    jest.clearAllMocks();
    quoteRequestCreate.mockResolvedValue({ id: 'source-1' });
    productFindMany.mockResolvedValue([]);
    productVariantFindMany.mockResolvedValue([{ id: 'variant-1', productId: 'product-1', unit: 'bag', status: VariantStatus.ACTIVE, product: { id: 'product-1', name: 'PPC Cement', status: ProductStatus.PUBLISHED } }]);
  });

  it('stores a canonical multi-item quotation and compatibility request atomically', async () => {
    const result = await service.create({
      name: 'Aditi Builder', email: 'Builder@Example.com', phone: '9999999999', company: 'Demo Build', deliveryPincode: '208016',
      items: [{ productId: 'product-1', variantId: 'variant-1', description: 'Cement', quantity: 10, unitCode: 'bag' }],
    });
    expect(result.reference).toMatch(/^BQ-\d{6}-[A-Z0-9]{6}$/);
    expect(result.itemCount).toBe(1);
    expect(quoteRequestCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ email: 'builder@example.com', quantity: 10 }) }));
    expect(quotationCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ customerEmail: 'builder@example.com', items: { create: expect.any(Array) } }) }));
  });

  it('keeps the legacy single-line public payload compatible', async () => {
    const result = await service.create({ name: 'Aditi Builder', email: 'builder@example.com', phone: '9999999999', company: 'Demo Build', requirement: 'Cement', quantity: 10, deliveryPincode: '208016' });
    expect(result.itemCount).toBe(1);
    expect(quotationCreate).toHaveBeenCalled();
  });

  it('rejects mismatched product and variant identifiers', async () => {
    await expect(service.create({ name: 'Aditi Builder', email: 'builder@example.com', phone: '9999999999', deliveryPincode: '208016', items: [{ productId: 'other-product', variantId: 'variant-1', description: 'Cement', quantity: 1, unitCode: 'bag' }] })).rejects.toBeInstanceOf(BadRequestException);
  });
});
