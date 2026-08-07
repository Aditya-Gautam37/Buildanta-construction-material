"use client";

import { FormEvent, useMemo, useState } from "react";
import type { StoreProduct } from "./live-catalog";
import { recommendProducts, type FinderAnswers, type FinderAvailability, type FinderQuality } from "./product-recommender";
import styles from "./guided-product-finder.module.css";

type FinderMode = "room" | "category";
type GuidedProductFinderProps = {
  mode: FinderMode;
  selection: string;
  products: StoreProduct[];
  options?: string[];
  categoryGroups?: Record<string, string[]>;
};

const QUANTITY_CHOICES = [1, 5, 10, 25];
const QUALITY_CHOICES: Array<{ value: FinderQuality; title: string; detail: string; mark: string }> = [
  { value: "ECONOMY", title: "Economy", detail: "Reliable at the lowest suitable price", mark: "₹" },
  { value: "STANDARD", title: "Standard", detail: "The best balance of price and quality", mark: "✓" },
  { value: "PREMIUM", title: "Premium", detail: "Higher-end brands and finishes", mark: "◆" },
];

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function productMatches(product: StoreProduct, mode: FinderMode, scope: string, categoryGroups?: Record<string, string[]>) {
  if (mode === "room") return product.rooms.includes(scope);
  const accepted = categoryGroups?.[scope] ?? [scope];
  return accepted.some((category) => product.categories.includes(category));
}

export function GuidedProductFinder({ mode, selection, products, options = [selection], categoryGroups }: GuidedProductFinderProps) {
  const [scope, setScope] = useState(selection || options[0] || "");
  const [step, setStep] = useState(0);
  const [quality, setQuality] = useState<FinderQuality>("STANDARD");
  const [preferredBrand, setPreferredBrand] = useState("all");
  const [maxUnitPrice, setMaxUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [customQuantity, setCustomQuantity] = useState(false);
  const [availability, setAvailability] = useState<FinderAvailability>("ANY");
  const [submitted, setSubmitted] = useState<FinderAnswers | null>(null);

  const scopedProducts = useMemo(
    () => products.filter((product) => productMatches(product, mode, scope, categoryGroups)),
    [categoryGroups, mode, products, scope],
  );
  const brands = useMemo(() => [...new Set(scopedProducts.map((product) => product.brand))].sort(), [scopedProducts]);
  const result = useMemo(() => submitted ? recommendProducts(scopedProducts, submitted) : null, [scopedProducts, submitted]);
  const steps = options.length > 1 ? ["Choose", "Quantity", "Quality", "Match"] : ["Quantity", "Quality", "Match"];
  const stepOffset = options.length > 1 ? 0 : 1;
  const activeKind = step + stepOffset;

  function chooseScope(value: string) {
    setScope(value);
    setPreferredBrand("all");
    setSubmitted(null);
    setStep(1);
  }

  function chooseQuantity(value: number) {
    setQuantity(String(value));
    setCustomQuantity(false);
    setStep(options.length > 1 ? 2 : 1);
  }

  function chooseQuality(value: FinderQuality) {
    setQuality(value);
    setStep(options.length > 1 ? 3 : 2);
  }

  function findProducts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted({ quality, preferredBrand, maxUnitPrice: Number(maxUnitPrice) || 0, quantity: Number(quantity) || 1, availability });
    requestAnimationFrame(() => document.getElementById(`finder-results-${mode}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  function startAgain() {
    setSubmitted(null);
    setStep(0);
  }

  return <section className={styles.finder} aria-labelledby={`guided-finder-${mode}`}>
    <header className={styles.hero}>
      <div><span>QUICK PRODUCT FINDER</span><h3 id={`guided-finder-${mode}`}>Find the right product in under a minute.</h3></div>
      <a href="#product-results">I know what I want</a>
    </header>

    {!result && <form className={styles.wizard} onSubmit={findProducts}>
      <div className={styles.progress} aria-label={`Step ${step + 1} of ${steps.length}`}>
        <strong>{step + 1}<small>/{steps.length}</small></strong>
        <div>{steps.map((label, index) => <span className={index <= step ? styles.progressActive : ""} key={label}><i />{label}</span>)}</div>
      </div>

      <div className={styles.question}>
        {activeKind === 0 && <fieldset>
          <legend>What are you shopping for?</legend>
          <div className={styles.scopeGrid}>{options.map((option) => <button type="button" onClick={() => chooseScope(option)} key={option}><span>{option.slice(0, 1)}</span><strong>{option}</strong><small>{products.filter((product) => productMatches(product, mode, option, categoryGroups)).length} products</small><b aria-hidden="true">→</b></button>)}</div>
        </fieldset>}

        {activeKind === 1 && <fieldset>
          <legend>How many do you need?</legend>
          <p className={styles.context}>{scope}</p>
          <div className={styles.quantityGrid}>{QUANTITY_CHOICES.map((value) => <button type="button" onClick={() => chooseQuantity(value)} key={value}><strong>{value}</strong><small>{value === 1 ? "unit / pack" : "units / packs"}</small></button>)}<button type="button" className={styles.customChoice} onClick={() => setCustomQuantity(true)}><strong>Other</strong><small>Enter a quantity</small></button></div>
          {customQuantity && <div className={styles.customQuantity}><label htmlFor={`finder-quantity-${mode}`}>Quantity</label><input id={`finder-quantity-${mode}`} aria-label="Approximate quantity needed" type="number" min="1" max="100000" value={quantity} onChange={(event) => setQuantity(event.target.value)} autoFocus /><button type="button" onClick={() => setStep(options.length > 1 ? 2 : 1)}>Continue →</button></div>}
        </fieldset>}

        {activeKind === 2 && <fieldset>
          <legend>Choose your quality level</legend>
          <p className={styles.context}>{quantity} {Number(quantity) === 1 ? "unit" : "units"} for {scope}</p>
          <div className={styles.qualityGrid}>{QUALITY_CHOICES.map((option) => <button type="button" onClick={() => chooseQuality(option.value)} key={option.value}><i>{option.mark}</i><strong>{option.title}</strong><small>{option.detail}</small><b aria-hidden="true">→</b></button>)}</div>
        </fieldset>}

        {activeKind === 3 && <fieldset>
          <legend>One last preference</legend>
          <p className={styles.context}>{quality.toLowerCase()} products for {scope}</p>
          <div className={styles.refineGrid}>
            <label><span>Brand</span><select value={preferredBrand} onChange={(event) => setPreferredBrand(event.target.value)}><option value="all">Any trusted brand</option>{brands.map((brand) => <option value={brand} key={brand}>{brand}</option>)}</select></label>
            <label><span>Availability</span><select value={availability} onChange={(event) => setAvailability(event.target.value as FinderAvailability)}><option value="ANY">Show all</option><option value="AVAILABLE_NOW">Available now first</option></select></label>
            <label><span>Maximum unit price <small>optional</small></span><div className={styles.rupeeInput}><i>₹</i><input type="number" min="0" value={maxUnitPrice} onChange={(event) => setMaxUnitPrice(event.target.value)} placeholder="No limit" /></div></label>
          </div>
          <button className={styles.submit} disabled={!scopedProducts.length}>Show my matches <span aria-hidden="true">→</span></button>
        </fieldset>}
      </div>

      <div className={styles.wizardFooter}><button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>← Back</button><small>Selection moves to the next question automatically</small></div>
    </form>}

    {result && <div className={styles.results} id={`finder-results-${mode}`}>
      <div className={styles.resultsHeading}><div><span>YOUR BEST MATCHES</span><h3>{result.recommendations.length ? `${result.recommendations.length} products selected for you` : "No mapped products yet"}</h3><p>{scope} · {quality.toLowerCase()} · {quantity} {Number(quantity) === 1 ? "unit" : "units"}</p></div><button type="button" onClick={startAgain}>Start again</button></div>
      {result.recommendations.length ? <div className={styles.resultGrid}>{result.recommendations.map(({ product, purchaseQuantity, indicativeTotal, reasons }, index) => <article className={styles.product} key={product.id}>
        <div className={styles.productTop}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{product.brand}</small><a href={`/products/${product.slug}`}>{product.name}</a></div></div>
        <div className={styles.reasons}>{reasons.map((reason) => <span key={reason}>{reason}</span>)}</div>
        <dl><div><dt>Rate</dt><dd>{product.price > 0 ? `${money(product.price)} / ${product.unit}` : "Request price"}</dd></div><div><dt>You need</dt><dd>{purchaseQuantity} {product.unit}</dd></div><div><dt>Product total</dt><dd>{indicativeTotal == null ? "Quotation required" : money(indicativeTotal)}</dd></div></dl>
        <div className={styles.actions}><a href={`/products/${product.slug}`}>View product</a><a href={`/bulk-quotes?product=${encodeURIComponent(product.name)}&quantity=${purchaseQuantity}`}>Get exact quote</a></div>
      </article>)}</div> : <div className={styles.noProducts}><b>No published products are mapped to {scope}.</b><a href="/bulk-quotes">Ask Buildanta for help</a></div>}
      <p className={styles.disclaimer}>Indicative recommendation. Final suitability, price, GST and delivery are confirmed in your quotation.</p>
    </div>}
  </section>;
}
