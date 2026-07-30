"use client";

import { useMemo, useState } from "react";
import { categories, products, rooms, stages } from "./data";

type Mode = "stage" | "room" | "category";

export function ProductBrowser({ mode, initial = "", query = "" }: { mode: Mode; initial?: string; query?: string }) {
  const options = mode === "stage" ? stages.map(([, name]) => name) : mode === "room" ? rooms.map((room) => room.name) : categories.map((category) => category.name);
  const [selection, setSelection] = useState(initial || options[0]);
  const [term, setTerm] = useState(query);
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [inStock, setInStock] = useState(false);

  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase();
    const result = products.filter((product) => {
      const selected = mode === "stage" ? product.stage === selection : mode === "room" ? product.room.includes(selection) : product.category === selection;
      const searched = !needle || `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase().includes(needle);
      return selected && searched && (!inStock || product.stock > 0);
    });
    return result.sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : b.stock - a.stock);
  }, [mode, selection, term, sort, inStock]);

  return (
    <div className="browser-layout">
      <button className="filter-trigger" onClick={() => setFiltersOpen(!filtersOpen)}>☷ Filters & browse options</button>
      <aside className={`browser-sidebar ${filtersOpen ? "open" : ""}`}>
        <div className="sidebar-title"><strong>{mode === "stage" ? "Construction Stages" : mode === "room" ? "Rooms" : "Categories"}</strong><button onClick={() => setFiltersOpen(false)}>×</button></div>
        {options.map((option) => <button className={selection === option ? "selected" : ""} onClick={() => { setSelection(option); setFiltersOpen(false); }} key={option}>{option}<span>›</span></button>)}
        <label className="stock-check"><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /> Show in-stock only</label>
      </aside>
      <section className="results-panel">
        <div className="results-heading"><div><p>{mode === "stage" ? "Construction stage" : mode === "room" ? "Designed for" : "Product category"}</p><h1>{selection}</h1></div><span>{visible.length} products</span></div>
        <div className="results-toolbar"><label><span>⌕</span><input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search products and brands..." /></label><select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products"><option value="featured">Sort: Featured</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option></select></div>
        {visible.length ? <div className="products-grid">{visible.map((product) => <ProductCard key={product.slug} product={product} />)}</div> : <div className="empty-panel"><span>⌕</span><h2>No products found</h2><p>Try another category or search term.</p><button onClick={() => { setTerm(""); setInStock(false); }}>Clear filters</button></div>}
      </section>
    </div>
  );
}

export function ProductCard({ product }: { product: (typeof products)[number] }) {
  return <article className="product-card">
    <a className={`product-visual ${product.tone}`} href={`/products/${product.slug}`}><span className="product-brand">{product.brand}</span><b>{product.category.split(" ")[0]}</b><i>{product.stock > 20 ? "In stock" : "Limited stock"}</i></a>
    <div className="product-body"><p>{product.brand} · {product.unit}</p><a href={`/products/${product.slug}`}><h2>{product.name}</h2></a><p className="product-description">{product.description}</p><div><span>From <strong>₹{product.price.toLocaleString("en-IN")}</strong></span><a className="small-quote" href={`/bulk-quotes?product=${encodeURIComponent(product.name)}`}>Get quote</a></div></div>
  </article>;
}
