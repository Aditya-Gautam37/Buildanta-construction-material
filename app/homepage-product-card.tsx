import type { StoreProduct } from "./live-catalog";
import { ProductCard } from "./product-card";

export function HomepageProductCard({ product, badge }: { product: StoreProduct; badge?: string | null }) {
  return <ProductCard product={product} badge={badge} pricePrefix="From" homepage />;
}
