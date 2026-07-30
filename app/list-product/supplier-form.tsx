"use client";

import { FormEvent, useState } from "react";
import { categories } from "../data";

export function SupplierForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/suppliers", { method: "POST", body: form });
      const data = await response.json() as { reference?: string; error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to submit your listing.");
      setMessage(data.reference || "");
      setStatus("sent");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit your listing.");
      setStatus("error");
    }
  }

  if (status === "sent") return <div className="form-success"><span>✓</span><h2>Listing submitted</h2><p>Your reference is <strong>{message}</strong>. Our catalogue team will review the product and contact you before publication.</p><a className="button navy" href="/">Back to home</a></div>;

  return <form className="workflow-form" onSubmit={submit}>
    <div className="field-grid"><label>Contact name<input name="contactName" required /></label><label>Business email<input type="email" name="email" required /></label></div>
    <div className="field-grid"><label>Phone number<input name="phone" required /></label><label>Company name<input name="company" required /></label></div>
    <div className="field-grid"><label>Product name<input name="productName" required /></label><label>Brand<input name="brand" required /></label></div>
    <div className="field-grid"><label>Category<select name="category">{categories.map((category) => <option key={category.slug}>{category.name}</option>)}</select></label><label>Unit / pack size<input name="unit" placeholder="e.g. 50 kg bag" required /></label></div>
    <div className="field-grid"><label>Indicative price (₹)<input name="price" type="number" min="0" step="0.01" required /></label><label>Available stock<input name="stock" type="number" min="0" required /></label></div>
    <label>Product description<textarea name="description" rows={4} required /></label>
    <label>Product image <input className="file-input" name="image" type="file" accept="image/png,image/jpeg,image/webp" required /><small>PNG, JPG or WebP, maximum 5 MB. Stored in durable object storage.</small></label>
    <label className="consent"><input type="checkbox" required /> I confirm that the product information is accurate and I am authorised to submit it.</label>
    {status === "error" && <p className="form-error" role="alert">{message}</p>}
    <button className="button navy wide" disabled={status === "sending"}>{status === "sending" ? "Uploading…" : "Submit Product for Review"}<span>→</span></button>
  </form>;
}
