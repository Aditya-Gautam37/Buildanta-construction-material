import { SupplierSubmissionsService } from './supplier-submissions.service';

// Field validation (reference format, required fields, price/stock bounds,
// image URL) lives in the controller's ZodValidationPipe now — see
// request-schemas.spec.ts's "supplier submission" cases — so by the time
// input reaches this service it's already known-good.
describe('SupplierSubmissionsService', () => {
  const create = jest.fn();
  const service = new SupplierSubmissionsService({ client: { supplierSubmission: { create } } } as never);

  beforeEach(() => create.mockReset().mockResolvedValue({ id: 'submission-1' }));

  it('stores supplier metadata in the shared database with the email lowercased', async () => {
    const result = await service.create({ reference: 'LP-260801-DEMO01', contactName: 'Demo Supplier', email: 'Supplier@Example.com', phone: '9999999999', company: 'Buildanta Supply', productName: 'Cement', brand: 'Buildanta Pro', category: 'Cement', unit: 'bag', price: 385, stock: 100, description: 'Demo listing', imageUrl: 'https://example.com/cement.png' });
    expect(result).toEqual({ reference: 'LP-260801-DEMO01' });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ stock: 100, productName: 'Cement', email: 'supplier@example.com' }) }));
  });
});
