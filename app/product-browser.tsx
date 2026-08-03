"use client";

import { useMemo, useState } from "react";
import { availabilityLabel, type StoreProduct } from "./live-catalog";

type Mode = "stage" | "room" | "category";

const stageDescriptions: Record<string, string> = {
  "Foundation & Structure": "Cement, reinforcement steel and structural materials for the load-bearing core of the project.",
  "Walls & Masonry": "Blocks, bricks, mortar and related materials for internal and external wall construction.",
  "Bathroom & Plumbing": "Sanitaryware, faucets and wet-area products selected for bathroom installation.",
  "Electrical & Wiring": "Wires, switches and lighting products for concealed services and final electrical fit-out.",
  "Plastering & Waterproofing": "Protection systems and finishing materials for terraces, bathrooms and exposed walls.",
  "Flooring & Tiling": "Floor and wall finishes for living spaces, kitchens, bathrooms and outdoor areas.",
  "False Ceiling": "Boards, channels and finishing materials for suspended ceilings and lightweight partitions.",
  "Paint & Finishing": "Primers, interior coatings and exterior finishes for final surface preparation.",
  "Doors, Windows, Railings & Glass": "Door, window and hardware systems for secure, weather-ready openings.",
};

function matches(product: StoreProduct, mode: Mode, option: string) {
  if (mode === "stage") return product.stages.includes(option);
  if (mode === "room") return product.rooms.includes(option);
  return product.categories.includes(option);
}

export function ProductBrowser({ mode, products, options, initial = "", query = "" }: { mode: Mode; products: StoreProduct[]; options: string[]; initial?: string; query?: string }) {
  const validInitial = options.includes(initial) ? initial : options[0] || "";
  const [selection, setSelection] = useState(validInitial);
  const [term, setTerm] = useState(query);
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const counts = useMemo(() => new Map(options.map((option) => [option, products.filter((product) => matches(product, mode, option)).length])), [mode, options, products]);
  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase();
    const result = products.filter((product) => {
      const searched = !needle || `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase().includes(needle);
      return matches(product, mode, selection) && searched;
    });
    return result.sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : b.updatedAt.localeCompare(a.updatedAt));
  }, [mode, products, selection, term, sort]);
  const selectionIndex = Math.max(0, options.indexOf(selection));
  const description = mode === "stage" ? stageDescriptions[selection] : mode === "room" ? `Materials currently mapped to ${selection} from the live Inventory catalogue.` : `Published products filed under ${selection}.`;

  return <div className="browser-layout">
    <button className="filter-trigger" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen}>Browse {mode === "stage" ? "construction stages" : mode === "room" ? "rooms" : "categories"}</button>
    <aside className={`browser-sidebar ${filtersOpen ? "open" : ""}`}>
      <div className="sidebar-title"><div><small>PROJECT NAVIGATOR</small><strong>{mode === "stage" ? "Construction stages" : mode === "room" ? "Rooms" : "Categories"}</strong></div><button onClick={() => setFiltersOpen(false)} aria-label="Close filters">Close</button></div>
      {options.map((option, index) => <button className={selection === option ? "selected" : ""} onClick={() => { setSelection(option); setTerm(""); setFiltersOpen(false); }} key={option}>
        <span className="option-number">{String(index + 1).padStart(2, "0")}</span><span className="option-copy"><strong>{option}</strong><small>{counts.get(option) || 0} published products</small></span><b aria-hidden="true">{">"}</b>
      </button>)}
    </aside>
    <section className="results-panel">
      <div className="stage-context">
        <div className="stage-context-number"><small>{mode === "stage" ? "BUILD STAGE" : "CATALOGUE VIEW"}</small><strong>{String(selectionIndex + 1).padStart(2, "0")}</strong></div>
        <div><p>{mode === "stage" ? "Materials for this phase" : mode === "room" ? "Products for this room" : "Product category"}</p><h1>{selection || "Construction materials"}</h1><span>{description}</span></div>
        <ul><li>Inventory connected</li><li>Real product photography</li><li>Project quotes available</li></ul>
      </div>
      <div className="results-toolbar"><label><span aria-hidden="true">Search</span><input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search products and brands..." /></label><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products"><option value="featured">Recently updated</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option></select></div>
      <div className="results-summary"><strong>{visible.length} products</strong><span>Pricing is indicative. Final price, GST and transport are confirmed in your quotation.</span></div>
      {visible.length ? <div className="products-grid">{visible.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-panel"><span aria-hidden="true">0</span><h2>No matching products</h2><p>Clear the search or choose another construction stage.</p><button onClick={() => setTerm("")}>Clear search</button></div>}
    </section>
  </div>;
}

export function ProductCard({ product }: { product: StoreProduct }) {
  return <article className="product-card"><a className={`product-visual ${product.image ? "has-image" : ""}`} href={`/products/${product.slug}`}><span className="product-brand">{product.brand}</span>{product.image ? <img src={product.image} alt={product.imageAlt} loading="lazy" /> : <b>{product.category.split(" ")[0]}</b>}<i>{availabilityLabel(product)}</i></a><div className="product-body"><p>{product.brand} / {product.unit}</p><a href={`/products/${product.slug}`}><h2>{product.name}</h2></a><p className="product-description">{product.description}</p><div><span>{product.price > 0 ? <>Indicative <strong>{"\u20B9"}{product.price.toLocaleString("en-IN")}</strong></> : <strong>Request latest price</strong>}</span><a className="small-quote" href={`/bulk-quotes?product=${encodeURIComponent(product.name)}`}>Get quote</a></div></div></article>;
}
