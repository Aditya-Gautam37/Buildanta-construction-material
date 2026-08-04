import type { ProductStatus } from '@workspace/db';

export class UpdateProductDto {
    name?: string;
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
    category?: string;
    sku?: string;
    price?: number;
}
