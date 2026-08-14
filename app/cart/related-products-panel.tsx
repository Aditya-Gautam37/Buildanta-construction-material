"use client";

import { useMemo } from "react";
import { useOptionalCart } from "../cart-context";
import { relatedForCart, type RelatedCandidate } from "./related-products";
import styles from "./related.module.css";

const money = (value: number) => `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/**
 * Suggestions under the cart.
 *
 * Renders nothing when the cart is empty or nothing genuinely relates — an
 * empty rail is better than a padded one, and the reason shown under each
 * product has to be true, because it is the only thing that makes a suggestion
 * feel like help rather than an advert.
 */
export function RelatedProductsPanel({
  catalogue,
  curated,
}: {
  catalogue: RelatedCandidate[];
  curated?: Record<string, string[]>;
}) {
  const cart = useOptionalCart();
  const lines = cart?.summary.lines ?? [];

  const suggestions = useMemo(
    () => relatedForCart(lines.map((line) => ({ productId: line.productId, productName: line.productName })), catalogue, { curated }),
    [lines, catalogue, curated],
  );

  if (suggestions.length === 0) return null;

  return (
    <section className={styles.panel} aria-labelledby="related-heading">
      <div className={styles.head}>
        <h2 id="related-heading">You may also need</h2>
        <p>Based on what is already in your cart.</p>
      </div>

      <ul className={styles.grid}>
        {suggestions.map(({ product, reason }) => (
          <li key={product.id}>
            <a className={styles.card} href={`/products/${product.slug}`}>
              <span className={styles.thumb}>
                {product.image ? <img src={product.image} alt={product.imageAlt} loading="lazy" /> : <i aria-hidden="true" />}
              </span>
              <span className={styles.body}>
                <strong>{product.name}</strong>
                <small className={styles.reason}>{reason}</small>
                <span className={styles.price}>
                  {money(product.price)} <em>/ {product.unit}</em>
                </span>
                {product.availability === "OUT_OF_STOCK" && <small className={styles.gone}>Currently unavailable</small>}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
