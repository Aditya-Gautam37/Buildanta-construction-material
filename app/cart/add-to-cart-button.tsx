"use client";

import { useState } from "react";
import { useOptionalCart, type CartActionResult } from "../cart-context";
import styles from "./add-to-cart-button.module.css";

type AddToCartButtonProps = {
  variantId: string;
  minimumOrderQuantity?: number;
  compact?: boolean;
  productName?: string;
};

export function AddToCartButton({ variantId, minimumOrderQuantity = 1, compact = false, productName }: AddToCartButtonProps) {
  const cart = useOptionalCart();
  const [quantity, setQuantity] = useState(compact ? 1 : minimumOrderQuantity);
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">("idle");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");

  async function addThroughExistingCart(): Promise<CartActionResult> {
    if (cart) return cart.addItem(variantId, quantity);

    // The storefront supplies the shared cart provider. This fallback keeps the
    // existing button independently usable in isolated tests and previews.
    const response = await fetch("/api/cart/items", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ variantId, quantity }) });
    const data = await response.json().catch(() => ({})) as {
      error?: string;
      message?: string | string[];
      adjustment?: CartActionResult["adjustment"];
    };
    if (!response.ok) {
      const responseMessage = Array.isArray(data.message) ? data.message.join(" ") : data.message;
      return { ok: false, adjustment: null, error: data.error || responseMessage || "Unable to add this product to your cart." };
    }
    return { ok: true, adjustment: data.adjustment ?? null };
  }

  async function add() {
    if (status === "adding") return;
    setStatus("adding");
    setMessage("");
    setNotice("");
    try {
      const result = await addThroughExistingCart();
      if (!result.ok) throw new Error(result.error || "Unable to add this product to your cart.");
      if (result.adjustment) {
        setNotice(result.adjustment.message);
        setQuantity(result.adjustment.adjustedQuantity);
      }
      setStatus("added");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add this product to your cart.");
      setStatus("error");
    }
  }

  const buttonLabel = status === "adding" ? "Adding..." : status === "added" ? "Added" : status === "error" ? "Retry" : "Add to cart";

  return <div className={`${styles.wrap} ${compact ? styles.compact : ""}`}>
    {!compact && <div className={styles.stepper}>
      <button type="button" onClick={() => setQuantity((value) => Math.max(minimumOrderQuantity, value - 1))} disabled={status === "adding"} aria-label="Decrease quantity">-</button>
      <span>{quantity}</span>
      <button type="button" onClick={() => setQuantity((value) => value + 1)} disabled={status === "adding"} aria-label="Increase quantity">+</button>
    </div>}
    <button type="button" className={styles.addButton} onClick={add} disabled={status === "adding" || (compact && status === "added")} aria-label={productName && status === "idle" ? `Add ${productName} to cart` : undefined}>
      {status === "added" && <span aria-hidden="true">✓ </span>}{buttonLabel}
    </button>
    {!compact && status === "added" && <a className={styles.cartLink} href="/cart">View cart →</a>}
    <span className="sr-only" aria-live="polite">{status === "added" ? `${productName || "Product"} added to cart.` : status === "adding" ? `Adding ${productName || "product"} to cart.` : ""}</span>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    {status === "error" && <p className={styles.error} role="alert">{message}</p>}
  </div>;
}
