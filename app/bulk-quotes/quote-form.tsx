"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import type { StoreProduct } from "../live-catalog";

type BasketItem = { key: string; productId: string; variantId: string; description: string; quantity: number; unitCode: string };
type Contact = { name: string; email: string; phone: string; company: string; deliveryPincode: string; requiredBy: string; projectType: string; customerNotes: string };

function makeItem(products: StoreProduct[], requestedProduct = ""): BasketItem {
  const product = products.find((item) => item.name.toLowerCase() === requestedProduct.toLowerCase()) ?? products[0];
  const variant = product?.variants[0];
  return { key: crypto.randomUUID(), productId: product?.id ?? "", variantId: variant?.id ?? "", description: product?.name ?? requestedProduct, quantity: product?.minimumOrderQuantity ?? 1, unitCode: variant?.unit ?? product?.unit ?? "unit" };
}

export function QuoteForm({ products, product = "" }: { products: StoreProduct[]; product?: string }) {
  const [status, setStatus] = useState<"idle" | "review" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const [items, setItems] = useState<BasketItem[]>(() => [makeItem(products, product)]);
  const [contact, setContact] = useState<Contact | null>(null);
  const submitting = useRef(false);
  const productMap = useMemo(() => new Map(products.map((item) => [item.id, item])), [products]);

  function updateItem(key: string, patch: Partial<BasketItem>) { setItems((current) => current.map((item) => item.key === key ? { ...item, ...patch } : item)); }
  function chooseProduct(key: string, productId: string) {
    const selected = productMap.get(productId);
    const variant = selected?.variants[0];
    updateItem(key, { productId, variantId: variant?.id ?? "", description: selected?.name ?? "", quantity: selected?.minimumOrderQuantity ?? 1, unitCode: variant?.unit ?? selected?.unit ?? "unit" });
  }
  function chooseVariant(key: string, productId: string, variantId: string) {
    const productEntry = productMap.get(productId);
    const variant = productEntry?.variants.find((item) => item.id === variantId);
    updateItem(key, { variantId, unitCode: variant?.unit ?? productEntry?.unit ?? "unit" });
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items.length || items.some((item) => !item.productId || !item.variantId || item.quantity <= 0)) { setStatus("error"); setMessage("Choose a valid product, variant and quantity for every line."); return; }
    const form = new FormData(event.currentTarget);
    setContact({
      name: String(form.get("name") ?? "").trim(), email: String(form.get("email") ?? "").trim(), phone: String(form.get("phone") ?? "").trim(), company: String(form.get("company") ?? "").trim(), deliveryPincode: String(form.get("deliveryPincode") ?? "").trim(), requiredBy: String(form.get("requiredBy") ?? "").trim(), projectType: String(form.get("projectType") ?? "").trim(), customerNotes: String(form.get("customerNotes") ?? "").trim(),
    });
    setStatus("review");
    setMessage("");
  }

  async function submit() {
    if (!contact || submitting.current) return;
    submitting.current = true;
    setStatus("sending");
    setMessage("");
    const payload = {
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      ...(contact.company ? { company: contact.company } : {}),
      deliveryPincode: contact.deliveryPincode,
      ...(contact.requiredBy ? { requiredBy: contact.requiredBy } : {}),
      ...(contact.projectType ? { projectType: contact.projectType } : {}),
      ...(contact.customerNotes ? { customerNotes: contact.customerNotes } : {}),
      items: items.map((item) => ({ productId: item.productId, variantId: item.variantId, description: item.description, quantity: item.quantity, unitCode: item.unitCode })),
    };
    try {
      const response = await fetch("/api/quotes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { reference?: string; error?: string; message?: string | string[] };
      const responseMessage = Array.isArray(data.message) ? data.message.join(" ") : data.message;
      if (!response.ok || !data.reference) throw new Error(data.error || responseMessage || "Unable to submit this quotation.");
      setReference(data.reference);
      setStatus("sent");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit this quotation.");
      setStatus("review");
    } finally {
      submitting.current = false;
    }
  }

  if (status === "sent") return <div className="form-success" role="status"><span>OK</span><h2>Quotation request received</h2><p>Your reference is <strong>{reference}</strong>. The complete multi-item request is now available to the Buildanta sales team for allocation and pricing.</p><a className="button navy" href="/categories">Continue browsing</a></div>;
  if (status === "review" || status === "sending") return <div className="quote-review" aria-live="polite"><p className="form-kicker">REVIEW BEFORE SUBMISSION</p><h3>{items.length} material line{items.length === 1 ? "" : "s"}</h3><div className="quote-review-lines">{items.map((item) => <article key={item.key}><strong>{item.description}</strong><span>{item.quantity} {item.unitCode}</span></article>)}</div><dl><div><dt>Contact</dt><dd>{contact?.name} / {contact?.email}</dd></div><div><dt>Delivery PIN</dt><dd>{contact?.deliveryPincode}</dd></div>{contact?.requiredBy && <div><dt>Required by</dt><dd>{contact.requiredBy}</dd></div>}</dl>{message && <p className="form-error" role="alert">{message}</p>}<div className="quote-review-actions"><button type="button" className="button account-outline" onClick={() => setStatus("idle")} disabled={status === "sending"}>Edit request</button><button type="button" className="button navy" onClick={submit} disabled={status === "sending"}>{status === "sending" ? "Submitting..." : "Submit quotation"}<span>-&gt;</span></button></div></div>;

  return <form className="workflow-form" onSubmit={review}>
    <div className="field-grid"><label>Full name<input name="name" placeholder="Your full name" required /></label><label>Work email<input name="email" type="email" placeholder="you@company.com" required /></label></div>
    <div className="field-grid"><label>Phone number<input name="phone" inputMode="tel" minLength={7} placeholder="+91 98765 43210" required /></label><label>Company / project<input name="company" placeholder="Company or project name" /></label></div>
    <div className="quote-basket-heading"><div><p className="form-kicker">MATERIAL BASKET</p><h3>Add every product required for this quotation</h3></div><button type="button" onClick={() => setItems((current) => [...current, makeItem(products)])}>+ Add product</button></div>
    <div className="quote-basket">{items.map((item, index) => { const selected = productMap.get(item.productId); return <fieldset key={item.key}><legend>Item {index + 1}</legend><div className="field-grid"><label>Product<select value={item.productId} onChange={(event) => chooseProduct(item.key, event.target.value)} required>{products.map((entry) => <option value={entry.id} key={entry.id}>{entry.name} / {entry.brand}</option>)}</select></label><label>Variant<select value={item.variantId} onChange={(event) => chooseVariant(item.key, item.productId, event.target.value)} required>{selected?.variants.map((variant) => <option value={variant.id} key={variant.id}>{variant.label} / {variant.sku}</option>)}</select></label></div><div className="field-grid"><label>Quantity<input type="number" min="0.001" step="0.001" value={item.quantity} onChange={(event) => updateItem(item.key, { quantity: Number(event.target.value) })} required /></label><label>Unit<input value={item.unitCode} readOnly /></label></div>{items.length > 1 && <button className="quote-remove" type="button" onClick={() => setItems((current) => current.filter((entry) => entry.key !== item.key))}>Remove item</button>}</fieldset>})}</div>
    <div className="field-grid"><label>Delivery pincode<input name="deliveryPincode" inputMode="numeric" pattern="[0-9]{6}" placeholder="208001" required /></label><label>Required by<input name="requiredBy" type="date" /></label></div>
    <div className="field-grid"><label>Project type<select name="projectType"><option>Residential construction</option><option>Commercial project</option><option>Renovation</option><option>Dealer / reseller</option></select></label><label>Project notes<input name="customerNotes" placeholder="Brands, schedule or specifications" /></label></div>
    {status === "error" && <p className="form-error" role="alert">{message}</p>}
    <button className="button navy wide">Review quotation summary<span>-&gt;</span></button>
    <small>Pricing, GST, freight and delivery are confirmed in the approved quotation revision.</small>
  </form>;
}
