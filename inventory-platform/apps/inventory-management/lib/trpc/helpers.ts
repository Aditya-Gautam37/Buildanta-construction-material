import type { InventoryProduct } from '@/lib/products';

export function formatUpdatedAt(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'recently';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function toInventoryProduct(input: {
  id: string;
  name: string;
  brand: string;
  categories?: Array<{ name: string }>;
  keySpecifications?: string[];
  stage?: string[];
  room?: string[];
  variants?: Array<{
    sku: string;
    price: number | string;
    supplier?: { name: string } | null;
  }>;
  reviews?: Array<{ rating: number }>;
  updatedAt: string;
}): InventoryProduct {
  const firstVariant = input.variants?.[0];
  const supplier = firstVariant?.supplier?.name ?? 'Not assigned';
  const price = firstVariant ? Number.parseFloat(String(firstVariant.price)) : 0;
  const safePrice = Number.isFinite(price) ? price : 0;
  const reviews = input.reviews?.length ?? 0;
  const rating = reviews
    ? Number(((input.reviews ?? []).reduce((sum, review) => sum + review.rating, 0) / reviews).toFixed(1))
    : 0;

  return {
    id: input.id,
    name: input.name,
    sku: firstVariant?.sku ?? input.id.slice(0, 8).toUpperCase(),
    brand: input.brand,
    category: input.categories?.[0]?.name ?? 'Uncategorized',
    supplier,
    price: safePrice,
    rating,
    reviews,
    updatedAt: formatUpdatedAt(input.updatedAt),
  };
}
