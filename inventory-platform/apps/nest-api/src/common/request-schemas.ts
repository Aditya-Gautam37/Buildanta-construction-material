import { z } from "zod";
import {
  FulfilmentMode,
  InventoryLedgerType,
  ProductStatus,
  QuotationApprovalStatus,
  QuotationStatus,
  StockCountStatus,
  StockTransactionType,
  StockTransferStatus,
  VariantStatus,
} from "@workspace/db";

const id = z.string().trim().min(1);
const optionalText = z.string().trim().max(10_000).optional();
const optionalUrl = z.string().trim().url().optional();
const price = z.number().finite().nonnegative();
const imageUrls = z.array(z.string().url()).max(20);

export const hierarchyCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  parentId: id.optional(),
  slug: z.string().trim().min(1).max(180).optional(),
}).strict();

export const hierarchyUpdateSchema = hierarchyCreateSchema.partial().strict();

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  parentId: id.nullable().optional(),
  slug: z.string().trim().min(1).max(220).optional(),
  description: optionalText,
  imageUrl: optionalUrl,
  icon: z.string().trim().max(80).optional(),
  sortOrder: z.number().int().min(0).max(100_000).optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  seoTitle: z.string().trim().max(160).optional(),
  seoDescription: z.string().trim().max(500).optional(),
}).strict();

export const categoryUpdateSchema = categoryCreateSchema.partial().strict();

export const supplierCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  contactInfo: z.string().trim().max(500).optional(),
  email: z.string().trim().email().optional(),
  address: z.string().trim().max(1_000).optional(),
}).strict();
export const supplierUpdateSchema = supplierCreateSchema.partial().strict();

export const brandCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(200),
  logo: optionalUrl,
  description: optionalText,
  website: optionalUrl,
}).strict();
export const brandUpdateSchema = brandCreateSchema.partial().strict();

const variantFields = {
  productId: id,
  supplierId: id,
  sku: z.string().trim().min(1).max(160),
  price: price.optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  imageUrls: imageUrls.optional(),
  unit: z.string().trim().min(1).max(80).optional(),
  minimumOrderQuantity: z.number().int().min(1).optional(),
  stockQuantity: z.number().int().nonnegative().optional(),
  reservedQuantity: z.number().int().nonnegative().optional(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  status: z.nativeEnum(VariantStatus).optional(),
};
export const variantCreateSchema = z.object(variantFields).strict();
export const variantUpdateSchema = z.object(variantFields).partial().strict();

const productFields = {
  name: z.string().trim().min(1).max(300),
  brandId: id.optional(),
  brand: z.string().trim().min(1).optional(),
  description: optionalText,
  keySpecifications: z.array(z.string().trim().min(1).max(500)).max(100).optional(),
  sellingPrice: price.optional(),
  costPrice: price.optional(),
  dummyPrice: price.optional(),
  bulkPrice: price.optional(),
  gstPercent: z.number().finite().min(0).max(100).optional(),
  unit: z.string().trim().min(1).max(80).optional(),
  minimumOrderQuantity: z.number().int().min(1).optional(),
  deliveryInfo: z.string().trim().max(500).optional(),
  returnEligible: z.boolean().nullable().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  categoryIds: z.array(id).max(100).optional(),
  stageIds: z.array(id).max(100).optional(),
  roomIds: z.array(id).max(100).optional(),
  category: z.string().trim().optional(),
  sku: z.string().trim().max(160).optional(),
  price: price.optional(),
  createDefaultVariant: z.boolean().optional(),
  defaultVariant: z.object({
    supplierId: id,
    sku: z.string().trim().min(1).max(160),
    price: price.optional(),
    attributes: z.record(z.string(), z.unknown()).optional(),
    imageUrls: imageUrls.optional(),
    unit: z.string().trim().min(1).max(80).optional(),
    minimumOrderQuantity: z.number().int().min(1).optional(),
    stockQuantity: z.number().int().nonnegative().optional(),
    lowStockThreshold: z.number().int().nonnegative().optional(),
  }).strict().optional(),
};
export const productCreateSchema = z.object(productFields).strict();
export const productUpdateSchema = z.object(productFields).partial().strict();
export const productImagesUpdateSchema = z.object({
  images: z.array(z.object({
    id: id.optional(),
    src: z.string().trim().url(),
    alt: z.string().trim().min(1).max(300),
    sortOrder: z.number().int().min(0).max(1000),
    primary: z.boolean(),
    variantId: id.nullable().optional(),
  }).strict()).max(20),
}).strict();

export const stockAdjustmentSchema = z.object({
  variantId: id,
  stockDelta: z.number().int().min(-1_000_000).max(1_000_000).default(0),
  reservedDelta: z.number().int().min(-1_000_000).max(1_000_000).default(0),
  type: z.nativeEnum(StockTransactionType),
  reason: z.string().trim().min(3).max(500),
  reference: z.string().trim().max(160).optional(),
}).strict().refine((input) => input.stockDelta !== 0 || input.reservedDelta !== 0, {
  message: "Enter a stock or reservation change.",
});

const code = z.string().trim().min(2).max(80).regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/);
const pincode = z.string().trim().regex(/^\d{6}$/);
const nonnegativeMoney = z.number().finite().nonnegative();

export const unitCreateSchema = z.object({
  code,
  name: z.string().trim().min(2).max(120),
  symbol: z.string().trim().min(1).max(24),
  dimension: z.string().trim().max(80).optional(),
}).strict();

export const unitConversionCreateSchema = z.object({
  fromUnitId: id,
  toUnitId: id,
  multiplier: z.number().finite().positive().max(1_000_000_000),
}).strict().refine((input) => input.fromUnitId !== input.toUnitId, {
  message: "Conversion units must be different.",
});

export const warehouseCreateSchema = z.object({
  code,
  name: z.string().trim().min(2).max(200),
  address: z.string().trim().max(1_000).optional(),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120),
  pincode,
  locationCode: code.default("MAIN"),
  locationName: z.string().trim().min(2).max(160).default("Main storage"),
}).strict();

export const warehouseLocationCreateSchema = z.object({
  warehouseId: id,
  code,
  name: z.string().trim().min(2).max(160),
  zone: z.string().trim().max(120).optional(),
}).strict();

export const serviceAreaCreateSchema = z.object({
  code,
  name: z.string().trim().min(2).max(200),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120),
  pincodes: z.array(pincode).min(1).max(500),
}).strict();

export const pincodeCoverageCreateSchema = z.object({
  serviceAreaId: id,
  pincodes: z.array(pincode).min(1).max(500),
}).strict();

export const fulfilmentServiceAreaSchema = z.object({
  fulfilmentLocationId: id,
  serviceAreaId: id,
  deliveryCharge: nonnegativeMoney.optional(),
  minimumOrderValue: nonnegativeMoney.optional(),
  estimatedLeadDays: z.number().int().min(0).max(365).default(2),
}).strict();

export const inventoryBalanceAdjustmentSchema = z.object({
  variantId: id,
  fulfilmentLocationId: id,
  warehouseLocationId: id.optional(),
  physicalDelta: z.number().int().min(-1_000_000).max(1_000_000).default(0),
  reservedDelta: z.number().int().min(-1_000_000).max(1_000_000).default(0),
  blockedDelta: z.number().int().min(-1_000_000).max(1_000_000).default(0),
  damagedDelta: z.number().int().min(-1_000_000).max(1_000_000).default(0),
  quarantineDelta: z.number().int().min(-1_000_000).max(1_000_000).default(0),
  inTransitDelta: z.number().int().min(-1_000_000).max(1_000_000).default(0),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  type: z.nativeEnum(InventoryLedgerType).default(InventoryLedgerType.ADJUSTMENT),
  reason: z.string().trim().min(3).max(500),
  reference: z.string().trim().max(160).optional(),
}).strict().refine((input) => [input.physicalDelta, input.reservedDelta, input.blockedDelta, input.damagedDelta, input.quarantineDelta, input.inTransitDelta].some((value) => value !== 0) || input.lowStockThreshold !== undefined, {
  message: "Enter at least one inventory change.",
});

export const inventoryReservationCreateSchema = z.object({
  reference: z.string().trim().min(3).max(160),
  variantId: id,
  fulfilmentLocationId: id,
  quantity: z.number().int().positive().max(1_000_000),
  expiresAt: z.coerce.date().optional(),
  notes: z.string().trim().max(500).optional(),
}).strict();

export const stockTransferCreateSchema = z.object({
  reference: z.string().trim().min(3).max(160),
  originLocationId: id,
  destinationLocationId: id,
  notes: z.string().trim().max(500).optional(),
  items: z.array(z.object({ variantId: id, quantity: z.number().int().positive().max(1_000_000) }).strict()).min(1).max(200),
}).strict().refine((input) => input.originLocationId !== input.destinationLocationId, { message: "Transfer locations must be different." });

export const stockTransferStatusSchema = z.object({
  status: z.nativeEnum(StockTransferStatus),
}).strict().refine((input) => input.status === StockTransferStatus.IN_TRANSIT || input.status === StockTransferStatus.RECEIVED || input.status === StockTransferStatus.CANCELLED, {
  message: "Unsupported transfer transition.",
});

export const stockCountCreateSchema = z.object({
  reference: z.string().trim().min(3).max(160),
  fulfilmentLocationId: id,
  notes: z.string().trim().max(500).optional(),
  items: z.array(z.object({
    variantId: id,
    countedQuantity: z.number().int().nonnegative().max(1_000_000),
  }).strict()).min(1).max(500),
}).strict();

export const stockCountStatusSchema = z.object({
  status: z.nativeEnum(StockCountStatus),
}).strict().refine((input) => input.status === StockCountStatus.SUBMITTED || input.status === StockCountStatus.APPROVED || input.status === StockCountStatus.CANCELLED, {
  message: "Unsupported count transition.",
});

export const supplierProductCreateSchema = z.object({
  supplierId: id,
  variantId: id,
  supplierSku: z.string().trim().max(160).optional(),
  fulfilmentMode: z.nativeEnum(FulfilmentMode).default(FulfilmentMode.ON_REQUEST),
  price: nonnegativeMoney.optional(),
  minimumQuantity: z.number().int().min(1).default(1),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
  minimumDays: z.number().int().min(0).max(365).optional(),
  maximumDays: z.number().int().min(0).max(365).optional(),
  serviceAreaId: id.optional(),
}).strict().refine((input) => input.maximumDays === undefined || input.minimumDays === undefined || input.maximumDays >= input.minimumDays, { message: "Maximum lead time must be at least the minimum." });

export const dealerCreateSchema = z.object({
  code,
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(7).max(30).optional(),
  address: z.string().trim().max(1_000).optional(),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120),
  pincode,
}).strict();

export const dealerProductCreateSchema = z.object({
  dealerId: id,
  variantId: id,
  price: nonnegativeMoney.optional(),
  reportedQuantity: z.number().int().nonnegative().optional(),
  leadTimeDays: z.number().int().min(0).max(365).default(2),
}).strict();

export const dealerServiceAreaCreateSchema = z.object({
  dealerId: id,
  serviceAreaId: id,
  deliveryCharge: nonnegativeMoney.optional(),
  minimumOrderValue: nonnegativeMoney.optional(),
  estimatedLeadDays: z.number().int().min(0).max(365).default(2),
}).strict();

export const carrierCreateSchema = z.object({
  code,
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(7).max(30).optional(),
}).strict();

export const carrierServiceAreaCreateSchema = z.object({
  carrierId: id,
  serviceAreaId: id,
  baseCharge: nonnegativeMoney.optional(),
  perKmCharge: nonnegativeMoney.optional(),
}).strict();

const quotationLineInputSchema = z.object({
  productId: id.optional(),
  variantId: id.optional(),
  description: z.string().trim().min(2).max(500),
  quantity: z.coerce.number().finite().positive().max(1_000_000),
  unitCode: z.string().trim().min(1).max(40).default("unit"),
  notes: z.string().trim().max(1_000).optional(),
}).strict();

export const quotationCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(7).max(30),
  company: z.string().trim().max(200).optional(),
  deliveryPincode: pincode,
  requiredBy: z.coerce.date().optional(),
  projectType: z.string().trim().max(160).optional(),
  customerNotes: z.string().trim().max(5_000).optional(),
  sourceEstimateReference: z.string().trim().min(8).max(160).optional(),
  items: z.array(quotationLineInputSchema).min(1).max(20),
}).strict();

export const legacyQuoteRequestCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(7).max(30),
  company: z.string().trim().min(1).max(200),
  requirement: z.string().trim().min(2).max(5_000),
  quantity: z.coerce.number().int().positive().max(1_000_000),
  deliveryPincode: pincode,
  requiredBy: z.string().trim().max(40).optional(),
  projectType: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(5_000).optional(),
}).strict();

export const quotationPublicCreateSchema = z.union([quotationCreateSchema, legacyQuoteRequestCreateSchema]);

export const quotationRevisionCreateSchema = z.object({
  validUntil: z.coerce.date(),
  freightTotal: nonnegativeMoney.default(0),
  discountTotal: nonnegativeMoney.default(0),
  marginTotal: nonnegativeMoney.optional(),
  customerNotes: z.string().trim().max(5_000).optional(),
  internalNotes: z.string().trim().max(5_000).optional(),
  items: z.array(z.object({
    quotationItemId: id,
    variantId: id,
    fulfilmentLocationId: id,
    supplierProductId: id.optional(),
    dealerProductId: id.optional(),
    description: z.string().trim().min(2).max(500),
    quantity: z.number().finite().positive().max(1_000_000),
    unitCode: z.string().trim().min(1).max(40),
    unitPrice: nonnegativeMoney,
    gstPercent: z.number().finite().min(0).max(100).default(0),
    discountAmount: nonnegativeMoney.default(0),
    estimatedLeadDays: z.number().int().min(0).max(365).optional(),
    isAlternative: z.boolean().default(false),
  }).strict()).min(1).max(200),
}).strict();

export const quotationStatusUpdateSchema = z.object({
  status: z.nativeEnum(QuotationStatus),
  reason: z.string().trim().min(3).max(1_000),
}).strict().refine((input) => input.status === QuotationStatus.REVIEWING || input.status === QuotationStatus.REJECTED || input.status === QuotationStatus.CLOSED, {
  message: "Use the dedicated send or acceptance workflow for this status.",
});

export const quotationApprovalDecisionSchema = z.object({
  status: z.nativeEnum(QuotationApprovalStatus),
  reason: z.string().trim().min(3).max(1_000),
}).strict().refine((input) => input.status !== QuotationApprovalStatus.PENDING, {
  message: "An approval decision must approve or reject.",
});

export const quotationAcceptSchema = z.object({
  reservationExpiresAt: z.coerce.date().optional(),
  paymentTerms: z.string().trim().max(500).optional(),
  reason: z.string().trim().min(3).max(1_000).default("Customer accepted quotation"),
}).strict();

export const salesOrderCancelSchema = z.object({
  reason: z.string().trim().min(3).max(1_000),
}).strict();
