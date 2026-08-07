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
  const [quality, setQuality] = useState<FinderQuality>("STANDARD");
  const [preferredBrand, setPreferredBrand] = useState("all");
  const [maxUnitPrice, setMaxUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [availability, setAvailability] = useState<FinderAvailability>("ANY");
  const [submitted, setSubmitted] = useState<FinderAnswers | null>(null);

  const scopedProducts = useMemo(
    () => products.filter((product) => productMatches(product, mode, scope, categoryGroups)),
    [categoryGroups, mode, products, scope],
  );
  const brands = useMemo(() => [...new Set(scopedProducts.map((product) => product.brand))].sort(), [scopedProducts]);
  const result = useMemo(() => submitted ? recommendProducts(scopedProducts, submitted) : null, [scopedProducts, submitted]);
  const scopeLabel = mode === "room" ? "room" : "category";

  function updateScope(value: string) {
    setScope(value);
    setPreferredBrand("all");
    setSubmitted(null);
  }

  function findProducts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted({ quality, preferredBrand, maxUnitPrice: Number(maxUnitPrice) || 0, quantity: Number(quantity) || 1, availability });
    requestAnimationFrame(() => document.getElementById(`finder-results-${mode}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  return <section className={styles.finder} aria-labelledby={`guided-finder-${mode}`}>
    <div className={styles.hero}>
      <div><span>PRODUCT MATCHER (OPTIONAL)</span><h3 id={`guided-finder-${mode}`}>Not sure which product to choose?</h3><p>Answer these simple questions first. Buildanta will compare the products available for {scope || `this ${scopeLabel}`} and show the closest choices. This matches products to your preferences — it does not calculate material quantities. Need quantities instead? Use <a href="/calculators">Material Calculators</a>.</p></div>
      <div className={styles.heroActions}>
        <div className={styles.steps} aria-label="Three-step product finder"><span><b>1</b> Your need</span><span><b>2</b> Preferences</span><span><b>3</b> Best matches</span></div>
        <a className={styles.skipLink} href="#product-results">Skip to products ↓</a>
      </div>
    </div>

    <form className={styles.form} onSubmit={findProducts}>
      <div className={styles.questionBlock}>
        <span className={styles.stepLabel}>STEP 1 · TELL US WHERE</span>
        <label className={styles.label} htmlFor={`finder-scope-${mode}`}>Which {scopeLabel} are you shopping for?</label>
        {options.length > 1 ? <select id={`finder-scope-${mode}`} value={scope} onChange={(event) => updateScope(event.target.value)}>{options.map((option) => <option value={option} key={option}>{option}</option>)}</select> : <div className={styles.fixedChoice}><b>{scope}</b><small>{scopedProducts.length} live products available to compare</small></div>}
        <label className={styles.compactLabel} htmlFor={`finder-quantity-${mode}`}>Approximate quantity needed</label>
        <div className={styles.inputWithUnit}><input id={`finder-quantity-${mode}`} type="number" min="1" max="100000" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /><span>units / packs</span></div>
      </div>

      <fieldset className={styles.questionBlock}>
        <legend><span className={styles.stepLabel}>STEP 2 · CHOOSE PRICE & QUALITY</span>What level do you prefer?</legend>
        <div className={styles.choiceGrid}>
          {(["ECONOMY", "STANDARD", "PREMIUM"] as FinderQuality[]).map((value) => <label className={quality === value ? styles.selectedChoice : ""} key={value}><input type="radio" name={`quality-${mode}`} value={value} checked={quality === value} onChange={() => setQuality(value)} /><b>{value === "ECONOMY" ? "Economy" : value === "STANDARD" ? "Standard" : "Premium"}</b><small>{value === "ECONOMY" ? "Lowest suitable price" : value === "STANDARD" ? "Balanced value" : "Higher-end range"}</small></label>)}
        </div>
      </fieldset>

      <div className={styles.questionBlock}>
        <span className={styles.stepLabel}>STEP 3 · REFINE THE MATCH</span>
        <div className={styles.refineGrid}>
          <label><span>Preferred brand</span><select value={preferredBrand} onChange={(event) => setPreferredBrand(event.target.value)}><option value="all">Any trusted brand</option>{brands.map((brand) => <option value={brand} key={brand}>{brand}</option>)}</select></label>
          <label><span>Maximum price per unit <small>(optional)</small></span><div className={styles.rupeeInput}><i>₹</i><input type="number" min="0" value={maxUnitPrice} onChange={(event) => setMaxUnitPrice(event.target.value)} placeholder="No limit" /></div></label>
          <label><span>Availability preference</span><select value={availability} onChange={(event) => setAvailability(event.target.value as FinderAvailability)}><option value="ANY">Show all options</option><option value="AVAILABLE_NOW">Available now first</option></select></label>
        </div>
        <button className={styles.submit} disabled={!scopedProducts.length}>Show my best product matches <span aria-hidden="true">→</span></button>
      </div>
    </form>

    {result ? <div className={styles.results} id={`finder-results-${mode}`}>
      <div className={styles.resultsHeading}><div><span>YOUR RECOMMENDATIONS</span><h3>{result.recommendations.length ? `Best matches for ${scope}` : "No mapped products yet"}</h3><p>{result.relaxed ? "No product matched every preference, so we have shown the closest available alternatives." : "Ranked using your quality, brand, budget, quantity and availability choices."}</p></div><button type="button" onClick={() => setSubmitted(null)}>Change answers</button></div>
      {result.recommendations.length ? <div className={styles.resultGrid}>{result.recommendations.map(({ product, purchaseQuantity, indicativeTotal, reasons }, index) => <article className={styles.product} key={product.id}>
        <div className={styles.productTop}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{product.brand}</small><a href={`/products/${product.slug}`}>{product.name}</a></div></div>
        <div className={styles.reasons}>{reasons.map((reason) => <span key={reason}>{reason}</span>)}</div>
        <dl><div><dt>Indicative rate</dt><dd>{product.price > 0 ? `${money(product.price)} / ${product.unit}` : "Request price"}</dd></div><div><dt>Purchase quantity</dt><dd>{purchaseQuantity} {product.unit}</dd></div><div><dt>Estimated product total</dt><dd>{indicativeTotal == null ? "Quotation required" : money(indicativeTotal)}</dd></div></dl>
        <div className={styles.actions}><a href={`/products/${product.slug}`}>View details</a><a href={`/bulk-quotes?product=${encodeURIComponent(product.name)}&quantity=${purchaseQuantity}`}>Get exact quote</a></div>
      </article>)}</div> : <div className={styles.noProducts}><b>No published products are mapped to {scope}.</b><p>Choose another {scopeLabel}, or request a manual quotation and our team will help.</p><a href="/bulk-quotes">Request help</a></div>}
      <p className={styles.disclaimer}>Recommendations and totals are indicative. Final suitability, GST, transport and quantity are confirmed during quotation.</p>
    </div> : <div className={styles.ready}><span>{scopedProducts.length}</span><div><b>products ready to compare</b><p>Your recommendations will appear here after you answer the questions above. No login is required.</p></div></div>}
  </section>;
}
