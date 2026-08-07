import type { PurchaseMode, VariantStatus } from '@workspace/db';

export class UpdateProductVariantDTO {
  productId?: string;
  supplierId?: string;
  sku?: string;
  price?: number;
  attributes?: Record<string, unknown>;
  imageUrls?: string[];
  unit?: string;
  minimumOrderQuantity?: number;
  stockQuantity?: number;
  reservedQuantity?: number;
  lowStockThreshold?: number;
  status?: VariantStatus;
  purchaseMode?: PurchaseMode;
  maxDirectQuantity?: number | null;
  bulkQuoteThreshold?: number | null;
  quantityIncrement?: number;
  directCheckoutEnabled?: boolean;
  manualDeliveryPricingEnabled?: boolean;
}
