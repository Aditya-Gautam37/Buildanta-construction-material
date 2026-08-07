import { BadRequestException, Injectable } from '@nestjs/common';
import { MaterialEstimateStatus, Prisma, ProductStatus, QuotationStatus, VariantStatus } from '@workspace/db';
import type { z } from 'zod';
import type {
  legacyQuoteRequestCreateSchema,
  quotationCreateSchema,
  quotationPublicCreateSchema,
} from '../common/request-schemas';
import { PrismaService } from '../database/prisma.service';

type PublicQuotationInput = z.infer<typeof quotationPublicCreateSchema>;
type CanonicalQuotationInput = z.infer<typeof quotationCreateSchema>;
type LegacyQuotationInput = z.infer<typeof legacyQuoteRequestCreateSchema>;

function isCanonical(input: PublicQuotationInput): input is CanonicalQuotationInput {
  return 'items' in input;
}

function normalize(input: PublicQuotationInput): CanonicalQuotationInput {
  if (isCanonical(input)) {
    return { ...input, email: input.email.toLowerCase() };
  }
  const legacy = input as LegacyQuotationInput;
  const parsedRequiredBy = legacy.requiredBy ? new Date(legacy.requiredBy) : undefined;
  return {
    name: legacy.name,
    email: legacy.email.toLowerCase(),
    phone: legacy.phone,
    company: legacy.company,
    deliveryPincode: legacy.deliveryPincode,
    requiredBy: parsedRequiredBy && !Number.isNaN(parsedRequiredBy.valueOf()) ? parsedRequiredBy : undefined,
    projectType: legacy.projectType || undefined,
    customerNotes: legacy.notes || undefined,
    items: [{
      description: legacy.requirement,
      quantity: legacy.quantity,
      unitCode: 'unit',
    }],
  };
}

@Injectable()
export class QuoteRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(rawInput: PublicQuotationInput, tx?: Prisma.TransactionClient, extra?: { sourceCartId?: string }) {
    const db = tx ?? this.prisma.client;
    const input = normalize(rawInput);
    const existingEstimate = input.sourceEstimateReference ? await db.materialEstimate.findUnique({
      where: { reference: input.sourceEstimateReference },
      include: { quotation: { select: { reference: true } }, items: { select: { id: true } } },
    }) : null;
    if (input.sourceEstimateReference && !existingEstimate) throw new BadRequestException('The source material estimate was not found.');
    if (existingEstimate?.quotation) return { reference: existingEstimate.quotation.reference, itemCount: existingEstimate.items.length, existing: true };
    if (existingEstimate && (existingEstimate.status !== MaterialEstimateStatus.ACTIVE || existingEstimate.expiresAt.getTime() <= Date.now())) {
      throw new BadRequestException('The source material estimate has expired or is no longer active.');
    }
    const variantIds = input.items.flatMap((item) => item.variantId ? [item.variantId] : []);
    const productIds = input.items.flatMap((item) => item.productId ? [item.productId] : []);
    const variants = variantIds.length ? await db.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
      }) : [];
    const products = productIds.length ? await db.product.findMany({
        where: { id: { in: productIds } },
      }) : [];
    const variantMap = new Map(variants.map((variant) => [variant.id, variant]));
    const productMap = new Map(products.map((product) => [product.id, product]));
    const normalizedItems = input.items.map((item, index) => {
      const variant = item.variantId ? variantMap.get(item.variantId) : undefined;
      const product = variant?.product ?? (item.productId ? productMap.get(item.productId) : undefined);
      if (item.variantId && (!variant || variant.status !== VariantStatus.ACTIVE || variant.product.status !== ProductStatus.PUBLISHED)) {
        throw new BadRequestException(`Quotation item ${index + 1} is not an active published variant.`);
      }
      if (item.productId && (!product || product.status !== ProductStatus.PUBLISHED)) {
        throw new BadRequestException(`Quotation item ${index + 1} is not a published product.`);
      }
      if (variant && item.productId && variant.productId !== item.productId) {
        throw new BadRequestException(`Quotation item ${index + 1} has a mismatched product and variant.`);
      }
      return {
        productId: product?.id,
        variantId: variant?.id,
        description: product?.name ?? item.description,
        quantity: item.quantity,
        unitCode: variant?.unit ?? item.unitCode,
        customerNotes: item.notes,
        sortOrder: index,
      };
    });
    const reference = `BQ-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const compatibilityRequirement = normalizedItems.map((item) => `${item.description} x ${item.quantity} ${item.unitCode}`).join('; ');
    const run = async (trx: Prisma.TransactionClient) => {
      const source = await trx.quoteRequest.create({
        data: {
          reference,
          name: input.name,
          email: input.email,
          phone: input.phone,
          company: input.company || 'Customer project',
          requirement: compatibilityRequirement,
          quantity: Math.max(1, Math.ceil(normalizedItems.reduce((sum, item) => sum + item.quantity, 0))),
          deliveryPincode: input.deliveryPincode,
          requiredBy: input.requiredBy?.toISOString().slice(0, 10),
          projectType: input.projectType,
          notes: input.customerNotes,
        },
      });
      const quotation = await trx.quotation.create({
        data: {
          reference,
          sourceQuoteRequestId: source.id,
          sourceCartId: extra?.sourceCartId,
          customerName: input.name,
          customerEmail: input.email,
          customerPhone: input.phone,
          company: input.company,
          deliveryPincode: input.deliveryPincode,
          requiredBy: input.requiredBy,
          projectType: input.projectType,
          customerNotes: input.customerNotes,
          status: QuotationStatus.SUBMITTED,
          items: { create: normalizedItems },
          history: {
            create: {
              toStatus: QuotationStatus.SUBMITTED,
              reason: 'Customer submitted quotation request',
            },
          },
        },
      });
      if (existingEstimate) {
        const linked = await trx.materialEstimate.updateMany({
          where: { id: existingEstimate.id, quotationId: null, status: MaterialEstimateStatus.ACTIVE },
          data: { quotationId: quotation.id, status: MaterialEstimateStatus.CONVERTED },
        });
        if (linked.count !== 1) throw new BadRequestException('This estimate has already been converted to a quotation.');
      }
    };
    if (tx) {
      await run(tx);
    } else {
      await this.prisma.client.$transaction(run);
    }
    return { reference, itemCount: normalizedItems.length };
  }
}
