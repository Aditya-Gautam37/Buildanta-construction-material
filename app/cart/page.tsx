import { CartPageClient } from "./cart-page-client";
import { RelatedProductsPanel } from "./related-products-panel";
import { getCatalogSnapshot } from "../live-catalog";
import type { RelatedCandidate } from "./related-products";
import styles from "./cart.module.css";

export default async function CartPage() {
  const { products } = await getCatalogSnapshot();

  // Slimmed before it crosses to the browser: the suggestion logic needs these
  // fields and nothing else, and the cart page should not ship the catalogue.
  const catalogue: RelatedCandidate[] = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    categoryIds: product.categoryIds,
    stages: product.stages,
    rooms: product.rooms,
    price: product.price,
    unit: product.unit,
    image: product.image,
    imageAlt: product.imageAlt,
    availability: product.availability,
  }));

  return <main className={styles.page}>
    <div className={styles.header}>
      <p>YOUR CART</p>
      <h1>Review your materials</h1>
    </div>
    <CartPageClient />
    <RelatedProductsPanel catalogue={catalogue} />
  </main>;
}
