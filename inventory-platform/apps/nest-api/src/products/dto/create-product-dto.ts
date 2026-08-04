import type { ProductStatus } from '@workspace/db';

export class CreateProductDTO {
    name!: string;
    brandId?: string;
    brand?: string;
    description?: string;
    keySpecifications?: string[];
    sellingPrice?: number;
    costPrice?: number;
    dummyPrice?: number;
    bulkPrice?: number;
    gstPercent?: number;
    unit?: string;
    minimumOrderQuantity?: number;
    deliveryInfo?: string;
    returnEligible?: boolean | null;
    status?: ProductStatus;
    categoryIds?: string[];
    stageIds?: string[];
    roomIds?: string[];

    // Backward-compatible fields currently used by the dashboard.
    category?: string;
    sku?: string;
    price?: number;

    createDefaultVariant?: boolean;
    defaultVariant?: {
        supplierId: string;
        sku: string;
        price?: number;
        attributes?: Record<string, unknown>;
        imageUrls?: string[];
        unit?: string;
        minimumOrderQuantity?: number;
        stockQuantity?: number;
        lowStockThreshold?: number;
    };
}
