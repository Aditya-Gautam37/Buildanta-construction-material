import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type SupplierSubmissionInput = {
  reference?: unknown; contactName?: unknown; email?: unknown; phone?: unknown; company?: unknown;
  productName?: unknown; brand?: unknown; category?: unknown; unit?: unknown; price?: unknown;
  stock?: unknown; description?: unknown; imageUrl?: unknown;
};

function text(value: unknown) { return typeof value === 'string' ? value.trim() : ''; }

@Injectable()
export class SupplierSubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: SupplierSubmissionInput) {
    const reference = text(input.reference);
    const contactName = text(input.contactName);
    const email = text(input.email).toLowerCase();
    const phone = text(input.phone);
    const company = text(input.company);
    const productName = text(input.productName);
    const brand = text(input.brand);
    const category = text(input.category);
    const unit = text(input.unit);
    const description = text(input.description);
    const imageUrl = text(input.imageUrl);
    const price = Number(input.price);
    const stock = Number(input.stock);
    if (!/^LP-\d{6}-[A-Z0-9]{6}$/.test(reference)) throw new BadRequestException('Invalid listing reference.');
    if (!contactName || !phone || !company || !productName || !brand || !category || !unit || !description || !imageUrl) throw new BadRequestException('Complete all required supplier and product details.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('Enter a valid business email.');
    if (!Number.isFinite(price) || price < 0 || !Number.isSafeInteger(stock) || stock < 0) throw new BadRequestException('Enter a valid price and stock quantity.');
    await this.prisma.client.supplierSubmission.create({ data: { reference, contactName, email, phone, company, productName, brand, category, unit, price, stock, description, imageUrl } });
    return { reference };
  }
}
