"use client";

import { useRef, useState } from "react";
import { useCart } from "../cart-context";
import styles from "./cart.module.css";

export function ConvertToQuoteForm({ onCancel }: { onCancel: () => void }) {
  const { refresh } = useCart();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const idempotencyKey = useRef(crypto.randomUUID());
  const submitting = useRef(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setStatus("sending");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      company: String(form.get("company") ?? "").trim() || undefined,
      deliveryPincode: String(form.get("deliveryPincode") ?? "").trim(),
      requiredBy: String(form.get("requiredBy") ?? "").trim() || undefined,
      projectType: String(form.get("projectType") ?? "").trim() || undefined,
      customerNotes: String(form.get("customerNotes") ?? "").trim() || undefined,
      idempotencyKey: idempotencyKey.current,
    };
    try {
      const response = await fetch("/api/cart/convert-to-quote", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { reference?: string; error?: string; message?: string | string[] };
      const responseMessage = Array.isArray(data.message) ? data.message.join(" ") : data.message;
      if (!response.ok || !data.reference) throw new Error(data.error || responseMessage || "Unable to convert your cart to a quotation.");
      setReference(data.reference);
      setStatus("sent");
      void refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to convert your cart to a quotation.");
      setStatus("error");
    } finally {
      submitting.current = false;
    }
  }

  if (status === "sent") {
    return <div className={styles.success} role="status">
      <h2>Quotation request received</h2>
      <p>Your reference is <strong>{reference}</strong>. Your cart has been converted to a bulk quotation for the Buildanta sales team.</p>
    </div>;
  }

  return <form className="workflow-form" onSubmit={submit}>
    <div className="field-grid"><label>Full name<input name="name" placeholder="Your full name" required /></label><label>Work email<input name="email" type="email" placeholder="you@company.com" required /></label></div>
    <div className="field-grid"><label>Phone number<input name="phone" inputMode="tel" minLength={7} placeholder="+91 98765 43210" required /></label><label>Company / project<input name="company" placeholder="Company or project name" /></label></div>
    <div className="field-grid"><label>Delivery pincode<input name="deliveryPincode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="208001" required /></label><label>Required by<input name="requiredBy" type="date" /></label></div>
    <div className="field-grid"><label>Project type<select name="projectType"><option>Residential construction</option><option>Commercial project</option><option>Renovation</option><option>Dealer / reseller</option></select></label><label>Project notes<input name="customerNotes" placeholder="Brands, schedule or specifications" /></label></div>
    {status === "error" && <p className={styles.formError} role="alert">{message}</p>}
    <div className="quote-review-actions">
      <button type="button" className="button account-outline" onClick={onCancel} disabled={status === "sending"}>Back to cart</button>
      <button type="submit" className="button navy" disabled={status === "sending"}>{status === "sending" ? "Submitting..." : "Submit quotation"}<span>-&gt;</span></button>
    </div>
  </form>;
}
