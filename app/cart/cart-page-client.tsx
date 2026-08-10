"use client";

import { useState } from "react";
import { CartProvider, useCart, type CartLine } from "../cart-context";
import { availabilityStatusLabel } from "../live-catalog";
import { ConvertToQuoteForm } from "./convert-to-quote-form";
import styles from "./cart.module.css";

function LineRow({ line, busy, onUpdate, onRemove }: { line: CartLine; busy: boolean; onUpdate: (quantity: number) => void; onRemove: () => void }) {
  return <article className={line.eligible ? styles.line : `${styles.line} ${styles.blocked}`}>
    <div className={styles.lineInfo}>
      <strong>{line.productName}</strong>
      <span>{line.sku} / {line.unit} · {availabilityStatusLabel(line.availability)}</span>
      {line.requiresQuote && <span className={styles.lineTag}>Requires a bulk quote</span>}
      {line.issues.length > 0 && <ul className={styles.lineIssues}>{line.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
    </div>
    <div className={styles.lineActions}>
      <div className={styles.price}>{line.livePrice != null ? `₹${(line.livePrice * line.quantity).toLocaleString("en-IN")}` : "Price on request"}</div>
      {line.priceChanged && <span className={styles.priceStale}>Price updated since added</span>}
      <div className={styles.stepper}>
        <button type="button" onClick={() => onUpdate(line.quantity - 1)} disabled={busy || line.quantity <= 1} aria-label="Decrease quantity">-</button>
        <span>{line.quantity}</span>
        <button type="button" onClick={() => onUpdate(line.quantity + 1)} disabled={busy} aria-label="Increase quantity">+</button>
      </div>
      <button type="button" className={styles.remove} onClick={onRemove} disabled={busy}>Remove</button>
    </div>
  </article>;
}

function CartPageInner() {
  const { summary, loading, error, notice, dismissNotice, updateItem, removeItem, clear } = useCart();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  async function handleUpdate(itemId: string, quantity: number) {
    if (quantity < 1) return;
    setBusyId(itemId);
    await updateItem(itemId, quantity);
    setBusyId(null);
  }

  async function handleRemove(itemId: string) {
    setBusyId(itemId);
    await removeItem(itemId);
    setBusyId(null);
  }

  if (loading) return <div className={styles.empty}>Loading your cart...</div>;

  if (summary.lineCount === 0) {
    return <div className={styles.empty}>
      <p>Your cart is empty.</p>
      <a className="button navy" href="/categories">Browse products</a>
    </div>;
  }

  if (converting) {
    return <ConvertToQuoteForm onCancel={() => setConverting(false)} />;
  }

  const hasEligibleLine = summary.lines.some((line) => line.eligible);

  return <div className={styles.layout}>
    <div className={styles.lines}>
      {error && <p className={styles.formError} role="alert">{error}</p>}
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
          <button type="button" onClick={dismissNotice} aria-label="Dismiss message">×</button>
        </p>
      )}
      {summary.lines.map((line) => (
        <LineRow
          key={line.itemId}
          line={line}
          busy={busyId === line.itemId}
          onUpdate={(quantity) => handleUpdate(line.itemId, quantity)}
          onRemove={() => handleRemove(line.itemId)}
        />
      ))}
    </div>
    <aside className={styles.summary}>
      <h2>Order summary</h2>
      <div className={styles.summaryRow}><span>Items</span><strong>{summary.itemCount}</strong></div>
      {summary.requiresQuoteCount > 0 && <div className={styles.summaryRow}><span>Lines needing a quote</span><strong>{summary.requiresQuoteCount}</strong></div>}
      <div className={styles.summaryTotal}><span>Subtotal</span><span>{"₹"}{summary.subtotal.toLocaleString("en-IN")}</span></div>
      <p className={styles.summaryNote}>Pay cash on delivery. Final GST, freight and availability are confirmed on your order.</p>
      <a className={styles.checkoutButton} href={hasEligibleLine ? "/checkout" : undefined} aria-disabled={!hasEligibleLine}>Proceed to checkout →</a>
      <button type="button" className={styles.convertButton} disabled={!hasEligibleLine} onClick={() => setConverting(true)}>Or request a bulk quote</button>
      <button type="button" className={styles.clearButton} onClick={() => void clear()}>Clear cart</button>
    </aside>
  </div>;
}

export function CartPageClient() {
  return <CartProvider><CartPageInner /></CartProvider>;
}
