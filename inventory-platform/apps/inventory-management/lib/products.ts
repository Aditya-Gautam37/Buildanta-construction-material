import { z } from 'zod';

export const inventoryProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  brand: z.string(),
  category: z.string(),
  supplier: z.string(),
  price: z.number().nonnegative(),
  rating: z.number().min(0).max(5),
  reviews: z.number().int().nonnegative(),
  updatedAt: z.string(),
});

export type InventoryProduct = z.infer<typeof inventoryProductSchema>;