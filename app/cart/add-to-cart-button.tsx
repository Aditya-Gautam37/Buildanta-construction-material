"use client";

import { useState } from "react";
import styles from "./add-to-cart-button.module.css";

export function AddToCartButton({ variantId, minimumOrderQuantity = 1 }: { variantId: string; minimumOrderQuantity?: number }) {
  const [quantity, setQuantity] = useState(minimumOrderQuantity);
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">("idle");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");

  async function add() {
    setStatus("adding");
    setMessage("");
    setNotice("");
    try {
      const response = await fetch("/api/cart/items", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ variantId, quantity }) });
      const data = await response.json().catch(() => ({})) as {
        error?: string;
        message?: string | string[];
        adjustment?: { adjustedQuantity: number; message: string } | null;
      };
      if (!response.ok) {
        const responseMessage = Array.isArray(data.message) ? data.message.join(" ") : data.message;
        throw new Error(data.error || responseMessage || "Unable to add this product to your cart.");
      }
      // The server decides the final quantity; reflect its correction rather than
      // leaving the stepper showing a number that was not actually added.
      if (data.adjustment) {
        setNotice(data.adjustment.message);
        setQuantity(data.adjustment.adjustedQuantity);
      }
      setStatus("added");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add this product to your cart.");
      setStatus("error");
    }
  }

  return <div className={styles.wrap}>
    <div className={styles.stepper}>
      <button type="button" onClick={() => setQuantity((value) => Math.max(minimumOrderQuantity, value - 1))} disabled={status === "adding"} aria-label="Decrease quantity">-</button>
      <span>{quantity}</span>
      <button type="button" onClick={() => setQuantity((value) => value + 1)} disabled={status === "adding"} aria-label="Increase quantity">+</button>
    </div>
    <button type="button" className={styles.addButton} onClick={add} disabled={status === "adding"}>
      {status === "adding" ? "Adding..." : status === "added" ? "Added" : "Add to cart"}
    </button>
    {status === "added" && <a className={styles.cartLink} href="/cart">View cart →</a>}
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    {status === "error" && <p className={styles.error} role="alert">{message}</p>}
  </div>;
}
