import {
  CalculatorDefinitionStatus,
  CalculatorQualityTier,
  CalculatorType,
} from '@workspace/db';
import { z } from 'zod';

const id = z.string().trim().min(1).max(200);
const pincode = z.string().trim().regex(/^\d{6}$/);
const slug = z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const calculatorRunSchema = z.object({
  deliveryPincode: pincode,
  qualityTier: z.nativeEnum(CalculatorQualityTier).default(CalculatorQualityTier.STANDARD),
  sessionReference: z.string().trim().min(12).max(200).optional(),
  inputs: z.record(z.string(), z.unknown()),
}).strict();

export const calculatorSelectionSchema = z.object({
  items: z.array(z.object({
    estimateItemId: id,
    productId: id,
    variantId: id,
  }).strict()).min(1).max(50),
}).strict();

export const estimateQuotationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(7).max(30),
  company: z.string().trim().max(200).optional(),
  requiredBy: z.coerce.date().optional(),
  projectType: z.string().trim().max(160).optional(),
  customerNotes: z.string().trim().max(5_000).optional(),
}).strict();

export const calculatorDefinitionCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug,
  type: z.nativeEnum(CalculatorType),
  description: z.string().trim().min(10).max(5_000),
  instructions: z.string().trim().max(5_000).optional(),
  imageUrl: z.string().trim().url().optional(),
  icon: z.string().trim().max(80).optional(),
  disclaimer: z.string().trim().min(20).max(5_000),
  status: z.nativeEnum(CalculatorDefinitionStatus).default(CalculatorDefinitionStatus.DRAFT),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
}).strict();

export const calculatorDefinitionUpdateSchema = calculatorDefinitionCreateSchema.partial().strict();

export const calculatorVersionCreateSchema = z.object({
  formulaKey: z.string().trim().min(2).max(120),
  configuration: z.record(z.string(), z.unknown()),
  effectiveFrom: z.coerce.date().optional(),
  reason: z.string().trim().min(3).max(500),
}).strict();

export const calculatorMappingUpsertSchema = z.object({
  outputKey: z.string().trim().min(2).max(120).regex(/^[a-z0-9_]+$/),
  qualityTier: z.nativeEnum(CalculatorQualityTier).default(CalculatorQualityTier.STANDARD),
  categoryId: id.optional(),
  productId: id.optional(),
  variantId: id.optional(),
  expectedUnit: z.string().trim().min(1).max(40),
  conversionFactor: z.number().finite().positive().max(1_000_000).default(1),
  packageSize: z.number().finite().positive().max(1_000_000).optional(),
  priority: z.number().int().min(0).max(1_000).default(0),
  preferred: z.boolean().default(false),
  active: z.boolean().default(true),
}).strict().refine((input) => input.categoryId || input.productId || input.variantId, {
  message: 'Choose at least a category, product or variant mapping.',
});

export const calculatorPublishSchema = z.object({
  reason: z.string().trim().min(3).max(500),
}).strict();

export type CalculatorRunInput = z.infer<typeof calculatorRunSchema>;
export type CalculatorSelectionInput = z.infer<typeof calculatorSelectionSchema>;
export type EstimateQuotationInput = z.infer<typeof estimateQuotationSchema>;
export type CalculatorDefinitionCreateInput = z.infer<typeof calculatorDefinitionCreateSchema>;
export type CalculatorDefinitionUpdateInput = z.infer<typeof calculatorDefinitionUpdateSchema>;
export type CalculatorVersionCreateInput = z.infer<typeof calculatorVersionCreateSchema>;
export type CalculatorMappingUpsertInput = z.infer<typeof calculatorMappingUpsertSchema>;
export type CalculatorPublishInput = z.infer<typeof calculatorPublishSchema>;
