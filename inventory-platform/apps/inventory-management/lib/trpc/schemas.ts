import { z } from 'zod';
import { inventoryProductSchema } from '@/lib/products';

export const staffTokenInput = z.object({
  accessToken: z.string().trim().min(1),
});

export const createProductInput = z.object({
  name: z.string().trim().min(1),
  brand: z.string().trim().min(1).optional(),
  brandId: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  category: z.string().trim().optional(),
  categoryIds: z.array(z.string().trim().min(1)).optional(),
  stageIds: z.array(z.string().trim().min(1)).optional(),
  roomIds: z.array(z.string().trim().min(1)).optional(),
  sku: z.string().trim().optional(),
  price: z.number().nonnegative().optional(),
  createDefaultVariant: z.boolean().optional(),
  defaultVariant: z
    .object({
      supplierId: z.string().trim().min(1),
      sku: z.string().trim().min(1),
      price: z.number().nonnegative().optional(),
      attributes: z.record(z.string(), z.unknown()).optional(),
      imageUrls: z.array(z.string().trim().url()).optional(),
    })
    .optional(),
  accessToken: z.string().trim().min(1),
});

export const createProductResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string(),
});

export const updateProductInput = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1).optional(),
  brand: z.string().trim().min(1).optional(),
  brandId: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  categoryIds: z.array(z.string().trim().min(1)).optional(),
  stageIds: z.array(z.string().trim().min(1)).optional(),
  roomIds: z.array(z.string().trim().min(1)).optional(),
  price: z.number().nonnegative().optional(),
  accessToken: z.string().trim().min(1),
});

export const updateProductResponseSchema = z.object({
  id: z.string(),
}).passthrough();

export const createCategoryInput = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  parentId: z.string().trim().nullable().optional(),
  description: z.string().trim().optional(),
  imageUrl: z.string().trim().url().optional(),
  icon: z.string().trim().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional(),
  accessToken: z.string().trim().min(1),
});

export const createStageInput = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  parentId: z.string().trim().optional(),
  accessToken: z.string().trim().min(1),
});

export const createRoomInput = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  parentId: z.string().trim().optional(),
  accessToken: z.string().trim().min(1),
});

export const createSupplierInput = z.object({
  name: z.string().trim().min(1),
  contactInfo: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  address: z.string().trim().optional(),
  accessToken: z.string().trim().min(1),
});

export const createBrandInput = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  logo: z.string().trim().optional(),
  description: z.string().trim().optional(),
  website: z.string().trim().optional(),
  accessToken: z.string().trim().min(1),
});

export const updateCategoryInput = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1).optional(),
  slug: z.string().trim().optional(),
  parentId: z.string().trim().nullable().optional(),
  description: z.string().trim().optional(),
  imageUrl: z.string().trim().url().optional(),
  icon: z.string().trim().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional(),
  accessToken: z.string().trim().min(1),
});

export const updateStageInput = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  parentId: z.string().trim().optional(),
  accessToken: z.string().trim().min(1),
});

export const updateRoomInput = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  parentId: z.string().trim().optional(),
  accessToken: z.string().trim().min(1),
});

export const updateSupplierInput = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  contactInfo: z.string().trim().optional(),
  email: z.string().trim().email().optional(),
  address: z.string().trim().optional(),
  accessToken: z.string().trim().min(1),
});

export const updateBrandInput = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  logo: z.string().trim().optional(),
  description: z.string().trim().optional(),
  website: z.string().trim().optional(),
  accessToken: z.string().trim().min(1),
});

export const createProductVariantInput = z.object({
  productId: z.string().trim().min(1),
  supplierId: z.string().trim().min(1),
  sku: z.string().trim().min(1),
  price: z.number().nonnegative().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  imageUrls: z.array(z.string().trim().url()).optional(),
  accessToken: z.string().trim().min(1),
});

export const updateProductVariantInput = z.object({
  id: z.string().trim().min(1),
  productId: z.string().trim().min(1).optional(),
  supplierId: z.string().trim().min(1).optional(),
  sku: z.string().trim().min(1).optional(),
  price: z.number().nonnegative().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  imageUrls: z.array(z.string().trim().url()).optional(),
  accessToken: z.string().trim().min(1),
});

export const deleteCategoryInput = z.object({
  id: z.string().trim().min(1),
  accessToken: z.string().trim().min(1),
});

export const deleteStageInput = z.object({
  id: z.string().trim().min(1),
  accessToken: z.string().trim().min(1),
});

export const deleteRoomInput = z.object({
  id: z.string().trim().min(1),
  accessToken: z.string().trim().min(1),
});

export const deleteSupplierInput = z.object({
  id: z.string().trim().min(1),
  accessToken: z.string().trim().min(1),
});

export const deleteBrandInput = z.object({
  id: z.string().trim().min(1),
  accessToken: z.string().trim().min(1),
});

export const deleteProductInput = z.object({
  id: z.string().trim().min(1),
  accessToken: z.string().trim().min(1),
});

export const deleteCategoryResponseSchema = z.object({
  success: z.literal(true),
});

export const deleteStageResponseSchema = z.object({
  success: z.literal(true),
});

export const deleteRoomResponseSchema = z.object({
  success: z.literal(true),
});

export const deleteSupplierResponseSchema = z.object({
  success: z.literal(true),
});

export const deleteBrandResponseSchema = z.object({
  success: z.literal(true),
});

export const deleteProductResponseSchema = z.object({
  success: z.literal(true),
});

export const nestProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string(),
  keySpecifications: z.array(z.string()).default([]),
  stage: z.array(z.string()).default([]),
  room: z.array(z.string()).default([]),
  updatedAt: z.string(),
  categories: z.array(z.object({ name: z.string() })).default([]),
  reviews: z.array(z.object({ rating: z.number() })).default([]),
  variants: z
    .array(
      z.object({
        sku: z.string(),
        price: z.union([z.number(), z.string()]),
        supplier: z.object({ name: z.string() }).nullable().optional(),
      }),
    )
    .default([]),
});

export const nestProductListSchema = z.array(nestProductSchema);
export const nestCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  parentId: z.string().nullable(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  sortOrder: z.number().default(0),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  _count: z.object({ children: z.number(), products: z.number() }).optional(),
});
export const nestCategoryListSchema = z.array(nestCategorySchema);
export const nestStageSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  parentId: z.string().nullable(),
});
export const nestStageListSchema = z.array(nestStageSchema);
export const nestRoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  parentId: z.string().nullable(),
});
export const nestRoomListSchema = z.array(nestRoomSchema);
export const nestSupplierSchema = z.object({
  id: z.string(),
  name: z.string(),
  contactInfo: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});
export const nestSupplierListSchema = z.array(nestSupplierSchema);
export const nestBrandSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logo: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
});
export const nestBrandListSchema = z.array(nestBrandSchema);
export const nestProductVariantSchema = z
  .object({
    id: z.string(),
    productId: z.string(),
    supplierId: z.string(),
    sku: z.string(),
    price: z.union([z.number(), z.string(), z.null()]).optional(),
    attributes: z.unknown().optional(),
    product: z
      .object({
        id: z.string(),
        name: z.string(),
      })
      .optional(),
    supplier: z
      .object({
        id: z.string(),
        name: z.string(),
      })
      .optional(),
    images: z
      .array(
        z.object({
          id: z.string().optional(),
          src: z.string(),
          alt: z.string().optional(),
        }),
      )
      .optional(),
  })
  .passthrough();
export const nestProductVariantListSchema = z.array(nestProductVariantSchema);

export const inventoryProductsOutputSchema = z.array(inventoryProductSchema);
