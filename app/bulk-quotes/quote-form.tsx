"use client";

import { FormEvent, useState } from "react";

export function QuoteForm({ product = "" }: { product?: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/quotes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { reference?: string; error?: string };
      if (!response.ok || !data.reference) throw new Error(data.error || "Unable to submit this quote.");
      setReference(data.reference);
      setStatus("sent");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit this quote.");
      setStatus("error");
    }
  }

  if (status === "sent") return <div className="form-success" role="status"><span>✓</span><h2>Request received</h2><p>Your quote reference is <strong>{reference}</strong>. Our team will review your requirements and contact you within one business day.</p><a className="button navy" href="/categories">Continue browsing</a></div>;

  return <form className="workflow-form" onSubmit={submit}>
    <div className="field-grid"><label>Full name<input name="name" placeholder="Your full name" required /></label><label>Work email<input name="email" type="email" placeholder="you@company.com" required /></label></div>
    <div className="field-grid"><label>Phone number<input name="phone" inputMode="tel" placeholder="+91 98765 43210" required /></label><label>Company / project<input name="company" placeholder="Company or project name" required /></label></div>
    <label>Products or materials needed<textarea name="requirement" defaultValue={product} placeholder="Example: 500 bags of PPC cement, 12 mm TMT bars..." rows={4} required /></label>
    <div className="field-grid"><label>Estimated quantity<input name="quantity" type="number" min="1" defaultValue={1} required /></label><label>Delivery pincode<input name="deliveryPincode" inputMode="numeric" pattern="[0-9]{6}" placeholder="560001" required /></label></div>
    <div className="field-grid"><label>Required by<input name="requiredBy" type="date" /></label><label>Project type<select name="projectType"><option>Residential construction</option><option>Commercial project</option><option>Renovation</option><option>Dealer / reseller</option></select></label></div>
    <label>Additional details<textarea name="notes" placeholder="Preferred brands, delivery schedule, or special specifications..." rows={3} /></label>
    {status === "error" && <p className="form-error" role="alert">{message}</p>}
    <button className="button navy wide" disabled={status === "sending"}>{status === "sending" ? "Submitting…" : "Submit Quote Request"}<span>→</span></button>
    <small>By submitting, you agree that Buildanta may contact you about this requirement.</small>
  </form>;
}
