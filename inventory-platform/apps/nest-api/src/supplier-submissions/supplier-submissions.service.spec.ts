import { BadRequestException } from '@nestjs/common';
import { SupplierSubmissionsService } from './supplier-submissions.service';

describe('SupplierSubmissionsService', () => {
  const create = jest.fn();
  const service = new SupplierSubmissionsService({ client: { supplierSubmission: { create } } } as never);

  beforeEach(() => create.mockReset().mockResolvedValue({ id: 'submission-1' }));

  it('stores validated supplier metadata in the shared database', async () => {
    const result = await service.create({ reference: 'LP-260801-DEMO01', contactName: 'Demo Supplier', email: 'supplier@example.com', phone: '9999999999', company: 'Buildanta Supply', productName: 'Cement', brand: 'Buildanta Pro', category: 'Cement', unit: 'bag', price: 385, stock: 100, description: 'Demo listing', imageUrl: 'https://example.com/cement.png' });
    expect(result).toEqual({ reference: 'LP-260801-DEMO01' });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ stock: 100, productName: 'Cement' }) }));
  });

  it('rejects an invalid listing reference', async () => {
    await expect(service.create({ reference: 'bad' })).rejects.toBeInstanceOf(BadRequestException);
  });
});
