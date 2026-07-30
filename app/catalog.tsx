"use client";

import { FormEvent, useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  description: string;
  tone: string;
  mark: string;
};

const products: Product[] = [
  { id: 1, name: "UltraTech PPC Cement", category: "Cement", unit: "50 kg bag", price: 390, stock: 842, description: "Reliable strength for masonry, plastering and general construction.", tone: "sand", mark: "UT" },
  { id: 2, name: "TMT Fe 550 Steel Bar", category: "Steel", unit: "12 mm · 12 m", price: 735, stock: 216, description: "High-strength, earthquake-resistant reinforcement steel.", tone: "steel", mark: "550" },
  { id: 3, name: "AAC Lightweight Block", category: "Blocks", unit: "4 × 8 × 24 in", price: 92, stock: 1280, description: "Thermal-efficient blocks for faster, lighter wall construction.", tone: "stone", mark: "AAC" },
  { id: 4, name: "Premium River Sand", category: "Aggregates", unit: "1 metric tonne", price: 1850, stock: 58, description: "Washed, graded sand suitable for concrete and plaster.", tone: "ochre", mark: "M" },
  { id: 5, name: "Exterior Weather Coat", category: "Finishes", unit: "20 L bucket", price: 4280, stock: 34, description: "UV-resistant exterior finish with a seven-year life.", tone: "sage", mark: "7Y" },
  { id: 6, name: "Structural Plywood BWP", category: "Boards", unit: "18 mm · 8 × 4 ft", price: 3620, stock: 76, description: "Boiling-water-proof plywood for demanding interior work.", tone: "wood", mark: "BWP" },
];

const categories = ["All materials", ...new Set(products.map((product) => product.category))];

export function Catalog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All materials");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reference, setReference] = useState("");

  const visibleProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) =>
      (category === "All materials" || product.category === category) &&
      (!term || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(term))
    );
  }, [query, category]);

  function openQuote(product?: Product) {
    setSelectedProduct(product ?? null);
    setSubmitted(false);
    setSubmitError("");
    setQuoteOpen(true);
  }

  async function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requirement: form.get("product"),
          quantity: Number(form.get("quantity")),
          deliveryPincode: form.get("pincode"),
          email: form.get("email"),
          company: form.get("company"),
        }),
      });
      const result = await response.json() as { reference?: string; error?: string };
      if (!response.ok || !result.reference) throw new Error(result.error ?? "We couldn’t submit your request.");
      setReference(result.reference);
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "We couldn’t submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#" aria-label="Buildanta home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>Buildanta</span>
        </a>
        <nav aria-label="Primary navigation">
          <a className="active" href="#materials">Materials</a>
          <a href="#how-it-works">How it works</a>
          <a href="#support">Support</a>
        </nav>
        <button className="header-quote" onClick={() => openQuote()}>Request a quote <span>↗</span></button>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Materials that move projects forward</p>
          <h1 id="hero-title">Build better.<br /><em>Source smarter.</em></h1>
          <p className="hero-lede">Verified construction materials, transparent availability, and one dependable quote—so your team can keep building.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#materials">Browse materials <span>↓</span></a>
            <button className="text-button" onClick={() => openQuote()}>Talk to our team <span>→</span></button>
          </div>
        </div>
        <div className="hero-visual" aria-label="Buildanta supply overview">
          <div className="blueprint-grid" />
          <div className="structure">
            <span className="beam beam-one" /><span className="beam beam-two" />
            <span className="block block-one" /><span className="block block-two" /><span className="block block-three" />
          </div>
          <div className="availability-card">
            <div><span className="live-dot" /> Live availability</div>
            <strong>2,506</strong>
            <small>units ready to dispatch</small>
          </div>
          <p className="visual-label">Supply intelligence / 01</p>
        </div>
      </section>

      <section className="trust-strip" aria-label="Service highlights">
        <p><b>120+</b><span>verified products</span></p>
        <p><b>24h</b><span>average quote time</span></p>
        <p><b>100%</b><span>quality checked</span></p>
        <p><b>On-site</b><span>delivery support</span></p>
      </section>

      <section className="catalog-section" id="materials" aria-labelledby="materials-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span /> Sourced for serious builds</p>
            <h2 id="materials-title">Materials you can<br />build a reputation on.</h2>
          </div>
          <p>Every product is supplier-verified and tracked for availability. Need volume pricing? Add it to a quote.</p>
        </div>

        <div className="catalog-toolbar">
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <span className="sr-only">Search materials</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search materials, grades, uses…" />
          </label>
          <div className="filters" aria-label="Filter by category">
            {categories.map((item) => (
              <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>
            ))}
          </div>
        </div>

        {visibleProducts.length ? (
          <div className="product-grid">
            {visibleProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className={`product-art ${product.tone}`}>
                  <span className="product-mark">{product.mark}</span>
                  <span className="stock"><i /> {product.stock > 100 ? "In stock" : "Limited stock"}</span>
                </div>
                <div className="product-info">
                  <p className="product-category">{product.category} <span>·</span> {product.unit}</p>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="product-footer">
                    <p>From <strong>₹{product.price.toLocaleString("en-IN")}</strong><small> / {product.unit}</small></p>
                    <button aria-label={`Add ${product.name} to quote`} onClick={() => openQuote(product)}>+</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span>⌕</span><h3>No materials found</h3><p>Try another search or clear your category filter.</p>
            <button onClick={() => { setQuery(""); setCategory("All materials"); }}>Clear filters</button>
          </div>
        )}
      </section>

      <section className="process-section" id="how-it-works">
        <p className="eyebrow light"><span /> From requirement to site</p>
        <div className="process-title"><h2>A simpler way to<br />source at scale.</h2><p>One request, one accountable team, and clear updates from quote to delivery.</p></div>
        <ol>
          <li><b>01</b><div><h3>Build your requirement</h3><p>Browse live inventory or tell us exactly what your project needs.</p></div></li>
          <li><b>02</b><div><h3>Review one clear quote</h3><p>We verify stock, logistics and volume pricing before we respond.</p></div></li>
          <li><b>03</b><div><h3>Track it to your site</h3><p>Your delivery coordinator keeps the hand-off visible and on schedule.</p></div></li>
        </ol>
      </section>

      <footer id="support">
        <div><a className="brand footer-brand" href="#"><span className="brand-mark"><i /><i /><i /></span><span>Buildanta</span></a><p>Better materials. Better building.</p></div>
        <button className="primary-button inverse" onClick={() => openQuote()}>Start a quote <span>↗</span></button>
        <small>© 2026 Buildanta Pvt. Ltd. · Bengaluru, India</small>
      </footer>

      {quoteOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setQuoteOpen(false)}>
          <section className="quote-modal" role="dialog" aria-modal="true" aria-labelledby="quote-title">
            <button className="modal-close" onClick={() => setQuoteOpen(false)} aria-label="Close quote form">×</button>
            {submitted ? (
              <div className="success-state" role="status">
                <span>✓</span><p className="eyebrow"><i /> Request received</p>
                <h2>We’ll build your quote.</h2>
                <p>Your reference is <strong>{reference}</strong>. Our supply team will respond within one business day.</p>
                <button className="primary-button" onClick={() => setQuoteOpen(false)}>Back to materials</button>
              </div>
            ) : (
              <>
                <p className="eyebrow"><span /> Project requirement</p>
                <h2 id="quote-title">Request a quote.</h2>
                <p className="modal-intro">Tell us what you need. We’ll confirm availability, pricing and delivery.</p>
                <form onSubmit={submitQuote}>
                  <label>Product or requirement<input name="product" defaultValue={selectedProduct?.name ?? ""} placeholder="e.g. 500 bags of PPC cement" required /></label>
                  <div className="form-row">
                    <label>Quantity<input name="quantity" type="number" min="1" placeholder="500" required /></label>
                    <label>Delivery pincode<input name="pincode" inputMode="numeric" pattern="[0-9]{6}" placeholder="560001" required /></label>
                  </div>
                  <label>Work email<input name="email" type="email" placeholder="you@company.com" required /></label>
                  <label>Company<input name="company" placeholder="Company name" required /></label>
                  {submitError && <p className="form-error" role="alert">{submitError}</p>}
                  <button className="primary-button" type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit requirement"} <span>→</span></button>
                  <small>By submitting, you agree to be contacted about this request.</small>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
