"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type CartLine = {
  itemId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPriceSnapshot: number | null;
  lineSubtotal: number;
  availability: string;
  eligible: boolean;
  requiresQuote: boolean;
};
type CartSummary = { cartId: string | null; lines: CartLine[]; itemCount: number; subtotal: number };

type Contact = { name: string; email: string; phone: string };
type Address = { line1: string; line2: string; city: string; state: string; pincode: string; landmark: string };
type Delivery = "STANDARD" | "EXPRESS";

const DELIVERY_OPTIONS: Array<{ id: Delivery; title: string; detail: string; charge: number }> = [
  { id: "STANDARD", title: "Standard delivery", detail: "2–4 working days, PIN-confirmed", charge: 0 },
  { id: "EXPRESS", title: "Priority delivery", detail: "Next working day where serviceable", charge: 400 },
];

const STEPS = ["Contact", "Delivery address", "Delivery method", "Review & place order"] as const;

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function CheckoutClient() {
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [step, setStep] = useState(0);
  const [contact, setContact] = useState<Contact>({ name: "", email: "", phone: "" });
  const [address, setAddress] = useState<Address>({ line1: "", line2: "", city: "", state: "", pincode: "", landmark: "" });
  const [delivery, setDelivery] = useState<Delivery>("STANDARD");
  const [serviceable, setServiceable] = useState<"idle" | "checking" | "yes" | "no">("idle");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  useEffect(() => {
    fetch("/api/cart", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: CartSummary) => setSummary(data))
      .catch(() => setError("We could not load your cart. Please try again."));
  }, []);

  const buyable = useMemo(() => (summary?.lines ?? []).filter((line) => line.eligible), [summary]);
  const deliveryCharge = DELIVERY_OPTIONS.find((option) => option.id === delivery)?.charge ?? 0;
  const goodsTotal = summary?.subtotal ?? 0;
  const grandTotal = goodsTotal + deliveryCharge;

  const checkPin = useCallback(async (pincode: string) => {
    if (!/^\d{6}$/.test(pincode)) { setServiceable("idle"); return; }
    setServiceable("checking");
    try {
      const response = await fetch(`/api/serviceability?pincode=${pincode}`, { cache: "no-store" });
      const result = await response.json() as { serviceable?: boolean };
      setServiceable(result.serviceable ? "yes" : "no");
    } catch {
      setServiceable("idle");
    }
  }, []);

  function next() { setError(""); setStep((current) => Math.min(STEPS.length - 1, current + 1)); }
  function back() { setError(""); setStep((current) => Math.max(0, current - 1)); }

  function validateStep() {
    if (step === 0) {
      if (!contact.name.trim() || !/^\S+@\S+$/.test(contact.email) || contact.phone.trim().length < 7) {
        setError("Enter your name, a valid email and phone number."); return false;
      }
    }
    if (step === 1) {
      if (!address.line1.trim() || !address.city.trim() || !address.state.trim() || !/^\d{6}$/.test(address.pincode)) {
        setError("Enter the full delivery address and a 6-digit PIN code."); return false;
      }
      if (serviceable === "no") { setError("We do not deliver to this PIN code yet. Try another, or request a quote."); return false; }
    }
    return true;
  }

  function advance() { if (validateStep()) next(); }

  async function placeOrder() {
    setPlacing(true);
    setError("");
    try {
      const deliveryLabel = DELIVERY_OPTIONS.find((option) => option.id === delivery)?.title ?? "Standard delivery";
      const addressText = [address.line1, address.line2, address.landmark && `Landmark: ${address.landmark}`, `${address.city}, ${address.state} - ${address.pincode}`]
        .filter(Boolean).join(", ");
      // Routed through the existing, tested cart pipeline. The full delivery
      // address and COD choice ride in the notes so nothing is lost until the
      // dedicated order endpoint exists.
      const notes = `CASH ON DELIVERY ORDER. ${deliveryLabel} (${money(deliveryCharge)}). Deliver to: ${addressText}.`;
      const payload = {
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        deliveryPincode: address.pincode,
        projectType: "Residential construction",
        customerNotes: notes,
      };
      const response = await fetch("/api/cart/convert-to-quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { reference?: string; error?: string };
      if (!response.ok || !result.reference) throw new Error(result.error ?? "We could not place your order.");
      setReference(result.reference);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not place your order.");
    } finally {
      setPlacing(false);
    }
  }

  if (reference) {
    return <section className="checkout-confirm">
      <div className="checkout-confirm-mark" aria-hidden="true">✓</div>
      <p>ORDER PLACED</p>
      <h1>Thank you, {contact.name.split(" ")[0] || "there"}.</h1>
      <p className="checkout-confirm-lead">Your cash-on-delivery order is in. We will confirm stock and call to arrange delivery.</p>
      <div className="checkout-confirm-ref"><span>Order reference</span><strong>{reference}</strong></div>
      <dl className="checkout-confirm-facts">
        <div><dt>Pay</dt><dd>{money(grandTotal)} cash on delivery</dd></div>
        <div><dt>Deliver to</dt><dd>{address.line1}, {address.city} - {address.pincode}</dd></div>
        <div><dt>Contact</dt><dd>{contact.phone}</dd></div>
      </dl>
      <div className="checkout-confirm-actions">
        <a className="button orange" href="/account">Track your order →</a>
        <a href="/categories">Continue shopping</a>
      </div>
    </section>;
  }

  if (!summary) return <div className="checkout-loading">Loading your cart…</div>;

  if (buyable.length === 0) {
    return <section className="checkout-empty">
      <h1>Nothing to check out</h1>
      <p>Your cart has no items ready for direct purchase.</p>
      <a className="button orange" href="/categories">Browse products</a>
    </section>;
  }

  return <div className="checkout-layout">
    <section className="checkout-main">
      <nav className="checkout-steps" aria-label="Checkout progress">
        {STEPS.map((label, index) => (
          <span key={label} className={index === step ? "active" : index < step ? "done" : ""}>
            <b>{index < step ? "✓" : index + 1}</b>{label}
          </span>
        ))}
      </nav>

      {error && <p className="checkout-error" role="alert">{error}</p>}

      {step === 0 && <div className="checkout-card">
        <h2>Your details</h2>
        <p className="checkout-hint">No account needed — you can check out as a guest.</p>
        <label>Full name<input value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} placeholder="Your full name" autoFocus /></label>
        <div className="checkout-grid">
          <label>Email<input type="email" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} placeholder="you@example.com" /></label>
          <label>Phone<input inputMode="tel" value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} placeholder="+91 98765 43210" /></label>
        </div>
        <div className="checkout-actions"><a href="/cart">← Back to cart</a><button type="button" onClick={advance}>Continue</button></div>
      </div>}

      {step === 1 && <div className="checkout-card">
        <h2>Delivery address</h2>
        <label>Address line 1<input value={address.line1} onChange={(event) => setAddress({ ...address, line1: event.target.value })} placeholder="House / shop no., street" autoFocus /></label>
        <label>Address line 2 <small>optional</small><input value={address.line2} onChange={(event) => setAddress({ ...address, line2: event.target.value })} placeholder="Area, colony" /></label>
        <div className="checkout-grid">
          <label>City<input value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} placeholder="Kanpur" /></label>
          <label>State<input value={address.state} onChange={(event) => setAddress({ ...address, state: event.target.value })} placeholder="Uttar Pradesh" /></label>
        </div>
        <div className="checkout-grid">
          <label>PIN code<input inputMode="numeric" maxLength={6} value={address.pincode} onChange={(event) => { const value = event.target.value.replace(/\D/g, ""); setAddress({ ...address, pincode: value }); void checkPin(value); }} placeholder="208001" /></label>
          <label>Landmark <small>optional</small><input value={address.landmark} onChange={(event) => setAddress({ ...address, landmark: event.target.value })} placeholder="Near…" /></label>
        </div>
        {serviceable === "checking" && <p className="checkout-pin checking">Checking delivery to this PIN…</p>}
        {serviceable === "yes" && <p className="checkout-pin yes">✓ We deliver to {address.pincode}.</p>}
        {serviceable === "no" && <p className="checkout-pin no">We do not deliver to {address.pincode} yet.</p>}
        <div className="checkout-actions"><button type="button" className="secondary" onClick={back}>← Back</button><button type="button" onClick={advance}>Continue</button></div>
      </div>}

      {step === 2 && <div className="checkout-card">
        <h2>Delivery method</h2>
        <div className="checkout-delivery">
          {DELIVERY_OPTIONS.map((option) => (
            <button type="button" key={option.id} className={delivery === option.id ? "selected" : ""} onClick={() => setDelivery(option.id)}>
              <span className="checkout-radio" aria-hidden="true" />
              <span><strong>{option.title}</strong><small>{option.detail}</small></span>
              <b>{option.charge === 0 ? "Free" : money(option.charge)}</b>
            </button>
          ))}
        </div>
        <div className="checkout-actions"><button type="button" className="secondary" onClick={back}>← Back</button><button type="button" onClick={advance}>Continue</button></div>
      </div>}

      {step === 3 && <div className="checkout-card">
        <h2>Review &amp; place order</h2>
        <div className="checkout-review">
          <div><span>Deliver to</span><p>{contact.name}, {contact.phone}<br />{[address.line1, address.line2, `${address.city}, ${address.state} - ${address.pincode}`].filter(Boolean).join(", ")}</p><button type="button" onClick={() => setStep(1)}>Edit</button></div>
          <div><span>Delivery</span><p>{DELIVERY_OPTIONS.find((option) => option.id === delivery)?.title}</p><button type="button" onClick={() => setStep(2)}>Edit</button></div>
          <div><span>Payment</span><p>Cash on delivery</p></div>
        </div>
        <div className="checkout-actions"><button type="button" className="secondary" onClick={back}>← Back</button><button type="button" className="checkout-place" onClick={() => void placeOrder()} disabled={placing}>{placing ? "Placing order…" : `Place order · ${money(grandTotal)}`}</button></div>
      </div>}
    </section>

    <aside className="checkout-summary">
      <h2>Order summary</h2>
      <ul>{buyable.map((line) => (
        <li key={line.itemId}><span>{line.quantity} × {line.productName}<small>{line.sku}</small></span><b>{money(line.lineSubtotal)}</b></li>
      ))}</ul>
      <dl>
        <div><dt>Items ({summary.itemCount})</dt><dd>{money(goodsTotal)}</dd></div>
        <div><dt>Delivery</dt><dd>{deliveryCharge === 0 ? "Free" : money(deliveryCharge)}</dd></div>
        <div className="checkout-summary-total"><dt>Pay on delivery</dt><dd>{money(grandTotal)}</dd></div>
      </dl>
      <p className="checkout-summary-note">Cash on delivery. Final GST and freight confirmed on your order.</p>
    </aside>
  </div>;
}
