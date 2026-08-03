"use client";

import { useMemo, useState } from "react";
import { availabilityLabel, type StoreProduct } from "./live-catalog";

type Mode = "stage" | "room" | "category";

export function ProductBrowser({
  mode,
  products,
  options,
  initial = "",
  query = "",
}: {
  mode: Mode;
  products: StoreProduct[];
  options: string[];
  initial?: string;
  query?: string;
}) {
  const [selection, setSelection] = useState(initial || options[0] || "");
  const [term, setTerm] = useState(query);
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase();
    const result = products.filter((product) => {
      const selected =
        mode === "stage"
          ? product.stages.includes(selection)
          : mode === "room"
            ? product.rooms.includes(selection)
            : product.categories.includes(selection);
      const searched = !needle || `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase().includes(needle);
      return selected && searched;
    });
    return result.sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : b.updatedAt.localeCompare(a.updatedAt));
  }, [mode, products, selection, term, sort]);

  return (
    <div className="browser-layout">
      <button className="filter-trigger" onClick={() => setFiltersOpen(!filtersOpen)}>☷ Filters & browse options</button>
      <aside className={`browser-sidebar ${filtersOpen ? "open" : ""}`}>
        <div className="sidebar-title"><strong>{mode === "stage" ? "Construction Stages" : mode === "room" ? "Rooms" : "Categories"}</strong><button onClick={() => setFiltersOpen(false)}>×</button></div>
        {options.map((option) => <button className={selection === option ? "selected" : ""} onClick={() => { setSelection(option); setFiltersOpen(false); }} key={option}>{option}<span>›</span></button>)}
      </aside>
      <section className="results-panel">
        <div className="results-heading"><div><p>{mode === "stage" ? "Construction stage" : mode === "room" ? "Designed for" : "Product category"}</p><h1>{selection || "Construction materials"}</h1></div><span>{visible.length} products</span></div>
        <div className="results-toolbar"><label><span>⌕</span><input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search products and brands..." /></label><select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products"><option value="featured">Sort: Recently updated</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option></select></div>
        {visible.length ? <div className="products-grid">{visible.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-panel"><span>⌕</span><h2>No products found</h2><p>Try another category or search term.</p><button onClick={() => setTerm("")}>Clear search</button></div>}
      </section>
    </div>
  );
}

export function ProductCard({ product }: { product: StoreProduct }) {
  return <article className="product-card">
    <a className={`product-visual ${product.image ? "has-image" : ""}`} href={`/products/${product.slug}`}><span className="product-brand">{product.brand}</span>{product.image ? <img src={product.image} alt={product.imageAlt} loading="lazy" /> : <b>{product.category.split(" ")[0]}</b>}<i>{availabilityLabel(product)}</i></a>
    <div className="product-body"><p>{product.brand} · {product.unit}</p><a href={`/products/${product.slug}`}><h2>{product.name}</h2></a><p className="product-description">{product.description}</p><div><span>{product.price > 0 ? <>From <strong>₹{product.price.toLocaleString("en-IN")}</strong></> : <strong>Project pricing</strong>}</span><a className="small-quote" href={`/bulk-quotes?product=${encodeURIComponent(product.name)}`}>Get quote</a></div></div>
  </article>;
}
