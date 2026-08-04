import { z } from 'zod';

const id = z.string().trim().min(1).max(100);
const positiveInt = z.coerce.number().int().positive();
const money = z.coerce.number().min(0).max(1_000_000_000);
const optionalDate = z.coerce.date().optional();

export const requisitionCreateSchema = z.object({
  reason: z.string().trim().min(3).max(4000), requiredBy: optionalDate, internalNotes: z.string().trim().max(4000).optional(),
  items: z.array(z.object({ variantId: id, targetLocationId: id, quantity: positiveInt, unitCode: z.string().trim().min(1).max(30), notes: z.string().trim().max(500).optional() })).min(1).max(100),
});
export const decisionSchema = z.object({ approve: z.coerce.boolean(), reason: z.string().trim().min(2).max(1000) });
export const rfqCreateSchema = z.object({ responseDueAt: optionalDate, notes: z.string().trim().max(4000).optional() });
export const supplierResponseSchema = z.object({
  supplierId: id, validUntil: z.coerce.date(), freightTotal: money.default(0), notes: z.string().trim().max(4000).optional(),
  items: z.array(z.object({ supplierRfqItemId: id, offeredQuantity: positiveInt, unitCost: money, gstPercent: z.coerce.number().min(0).max(100).default(0), leadTimeDays: z.coerce.number().int().min(0).max(365) })).min(1).max(100),
});
export const purchaseOrderCreateSchema = z.object({ expectedAt: optionalDate, paymentTerms: z.string().trim().max(500).optional(), internalNotes: z.string().trim().max(4000).optional() });
export const goodsReceiptCreateSchema = z.object({
  purchaseOrderId: id, fulfilmentLocationId: id, receivedAt: z.coerce.date(), supplierDocument: z.string().trim().max(200).optional(), qualityNotes: z.string().trim().max(4000).optional(),
  items: z.array(z.object({ purchaseOrderItemId: id, receivedQuantity: positiveInt, acceptedQuantity: z.coerce.number().int().min(0), rejectedQuantity: z.coerce.number().int().min(0).default(0), damagedQuantity: z.coerce.number().int().min(0).default(0), batchNumber: z.string().trim().max(100).optional(), lotNumber: z.string().trim().max(100).optional(), expiresAt: optionalDate, inspectionNotes: z.string().trim().max(500).optional() })).min(1).max(100),
});
export const pickingCreateSchema = z.object({ salesOrderId: id, fulfilmentLocationId: id });
export const dispatchCreateSchema = z.object({
  salesOrderId: id, pickingListId: id.optional(), deliveryScheduleId: id.optional(), carrierId: id.optional(), vehicleNumber: z.string().trim().max(50).optional(), trackingReference: z.string().trim().max(100).optional(),
  items: z.array(z.object({ salesOrderItemId: id, quantity: positiveInt })).min(1).max(100),
});
export const proofOfDeliverySchema = z.object({ receivedBy: z.string().trim().min(2).max(150), receivedAt: z.coerce.date(), photoUrl: z.string().url().max(1000).optional(), signatureUrl: z.string().url().max(1000).optional(), notes: z.string().trim().max(1000).optional() });
export const returnCreateSchema = z.object({ salesOrderId: id, dispatchId: id.optional(), reason: z.string().trim().min(3).max(4000), customerNotes: z.string().trim().max(4000).optional(), items: z.array(z.object({ salesOrderItemId: id, requestedQuantity: positiveInt })).min(1).max(100) });
export const returnReceiveSchema = z.object({ items: z.array(z.object({ returnItemId: id, receivedQuantity: positiveInt })).min(1).max(100) });
export const returnInspectSchema = z.object({
  resolution: z.enum(['REPLACEMENT', 'CREDIT_NOTE', 'NONE']), creditAmount: money.optional(), notes: z.string().trim().max(1000).optional(),
  items: z.array(z.object({ returnItemId: id, decision: z.enum(['RESTOCK', 'DAMAGE', 'REJECT']), restockQuantity: z.coerce.number().int().min(0).default(0), damagedQuantity: z.coerce.number().int().min(0).default(0), rejectedQuantity: z.coerce.number().int().min(0).default(0) })).min(1).max(100),
});
export const supplierReturnCreateSchema = z.object({ supplierId: id, purchaseOrderId: id.optional(), goodsReceiptId: id.optional(), fulfilmentLocationId: id, reason: z.string().trim().min(3).max(4000), items: z.array(z.object({ purchaseOrderItemId: id.optional(), variantId: id, quantity: positiveInt, fromDamaged: z.coerce.boolean().default(false) })).min(1).max(100) });

export type RequisitionCreateInput = z.infer<typeof requisitionCreateSchema>;
export type DecisionInput = z.infer<typeof decisionSchema>;
export type RfqCreateInput = z.infer<typeof rfqCreateSchema>;
export type SupplierResponseInput = z.infer<typeof supplierResponseSchema>;
export type PurchaseOrderCreateInput = z.infer<typeof purchaseOrderCreateSchema>;
export type GoodsReceiptCreateInput = z.infer<typeof goodsReceiptCreateSchema>;
export type PickingCreateInput = z.infer<typeof pickingCreateSchema>;
export type DispatchCreateInput = z.infer<typeof dispatchCreateSchema>;
export type ProofOfDeliveryInput = z.infer<typeof proofOfDeliverySchema>;
export type ReturnCreateInput = z.infer<typeof returnCreateSchema>;
export type ReturnReceiveInput = z.infer<typeof returnReceiveSchema>;
export type ReturnInspectInput = z.infer<typeof returnInspectSchema>;
export type SupplierReturnCreateInput = z.infer<typeof supplierReturnCreateSchema>;
