"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { availabilityLabel, availabilityStatusLabel, type PublicAvailability, type StoreProduct } from "./live-catalog";
import { StageQuestionnaire } from "./by-stage/stage-questionnaire";
import { GuidedProductFinder } from "./guided-product-finder";

type Mode = "stage" | "room" | "category";

function matches(product: StoreProduct, mode: Mode, option: string, categoryGroups?: Record<string, string[]>) {
  if (mode === "stage") return product.stages.includes(option);
  if (mode === "room") return product.rooms.includes(option);
  const acceptedCategories = categoryGroups?.[option] ?? [option];
  return acceptedCategories.some((category) => product.categories.includes(category));
}

export function ProductBrowser({ mode, products, options, initial = "", query = "", categoryGroups }: { mode: Mode; products: StoreProduct[]; options: string[]; initial?: string; query?: string; categoryGroups?: Record<string, string[]> }) {
  const validInitial = options.includes(initial) ? initial : options[0] || "";
  const [selection, setSelection] = useState(validInitial);
  const [term, setTerm] = useState(query);
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [finderOpen, setFinderOpen] = useState(false);
  const [brand,setBrand]=useState("all");
  const [availability,setAvailability]=useState("all");
  const [fulfilmentMode,setFulfilmentMode]=useState("all");
  const [maxPrice,setMaxPrice]=useState("");
  const [pincode,setPincode]=useState("");
  const [locationState,setLocationState]=useState<"idle"|"loading"|"serviceable"|"unsupported"|"error">("idle");
  const [locationProducts,setLocationProducts]=useState(new Map<string,{availabilityStatus:PublicAvailability;leadTimeLabel:string;fulfilmentMode:string}>());
  const brands=useMemo(()=>[...new Set(products.map(product=>product.brand))].sort(),[products]);
  const checkLocation=useCallback(async(value:string)=>{if(!/^\d{6}$/.test(value)){setLocationState("error");return}setLocationState("loading");try{const response=await fetch(`/api/serviceability?pincode=${encodeURIComponent(value)}`,{cache:"no-store"});const result=await response.json() as {serviceable?:boolean;products?:{productId:string;availabilityStatus:PublicAvailability;leadTimeLabel:string;fulfilmentMode:string}[]};if(!response.ok)throw new Error();window.localStorage.setItem("buildanta-delivery-pincode",value);if(!result.serviceable){setLocationProducts(new Map());setLocationState("unsupported");return}setLocationProducts(new Map((result.products||[]).map(product=>[product.productId,product])));setLocationState("serviceable")}catch{setLocationState("error")}},[])
  useEffect(()=>{const saved=window.localStorage.getItem("buildanta-delivery-pincode")||"";if(!/^\d{6}$/.test(saved))return;const timer=window.setTimeout(()=>{setPincode(saved);void checkLocation(saved)},0);return()=>window.clearTimeout(timer)},[checkLocation])
  const counts = useMemo(() => new Map(options.map((option) => [option, products.filter((product) => matches(product, mode, option, categoryGroups)).length])), [categoryGroups, mode, options, products]);
  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase();
    const result = products.filter((product) => {
      const searched = !needle || `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase().includes(needle);
      const local=locationProducts.get(product.id);
      const locationMatch=locationState!=="serviceable"||Boolean(local);
      const availabilityMatch=availability==="all"||(local?.availabilityStatus||product.availability)===availability;
      const modeMatch=fulfilmentMode==="all"||local?.fulfilmentMode===fulfilmentMode;
      const brandMatch=brand==="all"||product.brand===brand;
      const priceLimit=Number(maxPrice);const priceMatch=!maxPrice||product.price<=priceLimit;
      return matches(product, mode, selection, categoryGroups) && searched && locationMatch && availabilityMatch && modeMatch && brandMatch && priceMatch;
    });
    return result.sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : b.updatedAt.localeCompare(a.updatedAt));
  }, [mode, products, selection, term, sort,locationProducts,locationState,availability,fulfilmentMode,brand,maxPrice,categoryGroups]);
  const scopedProducts = useMemo(() => products.filter((product) => matches(product, mode, selection, categoryGroups)), [categoryGroups, mode, products, selection]);
  const selectionIndex = Math.max(0, options.indexOf(selection));
  const description = mode === "stage" ? `Shop verified materials for ${selection}. Compare live products now or use the buying assistant for a tailored list.` : mode === "room" ? `Shop products selected for ${selection}. Compare prices, brands and availability in one place.` : "Compare live products, prices and brands from the Buildanta catalogue.";
  const heroProduct = scopedProducts.find((product) => product.image);
  const pricedProducts = scopedProducts.filter((product) => product.price > 0);
  const startingPrice = pricedProducts.length ? Math.min(...pricedProducts.map((product) => product.price)) : 0;
  const browseLabel = mode === "stage" ? "construction stage" : mode === "room" ? "room" : "category";

  function chooseSelection(option: string) {
    setSelection(option);
    setTerm("");
    setFinderOpen(false);
  }

  return <div className="browser-layout commerce-browser">
    <nav className="commerce-paths" aria-label={`Shop by ${browseLabel}`}>
      <div><span>SHOP BY {browseLabel.toUpperCase()}</span><strong>Choose where you want to shop</strong></div>
      <div className="commerce-path-scroll">{options.map((option, index) => <button className={selection === option ? "selected" : ""} onClick={() => chooseSelection(option)} aria-pressed={selection === option} key={option}>
        <span>{String(index + 1).padStart(2, "0")}</span><strong>{option}</strong><small>{counts.get(option) || 0} products</small>
      </button>)}</div>
    </nav>
    <section className="results-panel">
      <section className="commerce-hero">
        <div className="commerce-hero-copy"><p>BUILDANTA MATERIAL STORE · {String(selectionIndex + 1).padStart(2, "0")}</p><h1>{selection || "Construction materials"}</h1><span>{description}</span><div className="commerce-hero-actions"><button onClick={() => document.getElementById("product-results")?.scrollIntoView({ behavior: "smooth" })}>Shop {scopedProducts.length} products <b>→</b></button><button className="secondary" onClick={() => setFinderOpen(true)}>Help me choose</button></div><dl><div><dt>Products</dt><dd>{scopedProducts.length}</dd></div><div><dt>Starting at</dt><dd>{startingPrice ? `₹${startingPrice.toLocaleString("en-IN")}` : "Get quote"}</dd></div><div><dt>Delivery</dt><dd>{locationState === "serviceable" ? `To ${pincode}` : "Check PIN"}</dd></div></dl></div>
        <div className="commerce-hero-visual">{heroProduct?.image ? <img src={heroProduct.image} alt={heroProduct.imageAlt || `${selection} construction material`} decoding="async" fetchPriority="high" /> : <img src="/images/buildanta-v2/foundation-planning-v2.webp" alt={`${selection} construction materials`} decoding="async" fetchPriority="high" />}<span>Live catalogue</span><small>{heroProduct?.brand || "Buildanta verified materials"}</small></div>
      </section>

      <div className="commerce-assurance commerce-browser-assurance"><span><i>✓</i><strong>Verified catalogue</strong><small>Products managed in Inventory</small></span><span><i>₹</i><strong>Transparent pricing</strong><small>Indicative rates shown upfront</small></span><span><i>◎</i><strong>Location checked</strong><small>Availability for your PIN code</small></span><span><i>↗</i><strong>Bulk quotations</strong><small>Project pricing when you need it</small></span></div>

      <form className={`location-filter-bar commerce-location ${locationState}`} onSubmit={event=>{event.preventDefault();void checkLocation(pincode)}}><div><strong>Delivering to</strong><span>{locationState==="serviceable"?`${pincode} · Products available in your area`:locationState==="unsupported"?"Area not yet serviceable · Manual quotation available":locationState==="error"?"Enter a valid 6-digit PIN code":"Check product availability and delivery"}</span></div><label><span className="sr-only">Delivery PIN code</span><input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pincode} onChange={event=>setPincode(event.target.value.replace(/\D/g,""))} placeholder="Enter PIN code"/></label><button disabled={locationState==="loading"}>{locationState==="loading"?"Checking...":"Check"}</button></form>

      {finderOpen && <section className="commerce-finder-shell"><div className="commerce-finder-title"><div><span>PERSONAL SHOPPING ASSISTANT</span><strong>{mode === "stage" ? `Build my ${selection} material list` : `Find the right products for ${selection}`}</strong></div><button onClick={() => setFinderOpen(false)} aria-label="Close product finder">Close ×</button></div>{mode === "stage" ? <StageQuestionnaire key={selection} stage={selection} products={scopedProducts} deliveryPincode={pincode} /> : <GuidedProductFinder key={`${mode}-${selection}`} mode={mode} selection={selection} products={scopedProducts} />}</section>}

      <section className="commerce-products" id="product-results">
        <div className="commerce-products-heading"><div><span>SHOP LIVE PRODUCTS</span><h2>{selection}</h2><p>{visible.length} products ready to compare</p></div><button className="commerce-filter-button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen}>Filters {filtersOpen ? "×" : "+"}</button></div>
        <div className="results-toolbar"><label><span aria-hidden="true">Search</span><input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search products and brands..." /></label><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products"><option value="featured">Featured products</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option></select></div>
        {filtersOpen && <div className="advanced-filters"><label>Brand<select value={brand} onChange={event=>setBrand(event.target.value)}><option value="all">All brands</option>{brands.map(value=><option value={value} key={value}>{value}</option>)}</select></label><label>Availability<select value={availability} onChange={event=>setAvailability(event.target.value)}><option value="all">All availability</option><option value="IN_STOCK">Available</option><option value="LOW_STOCK">Limited</option><option value="ENQUIRY">On enquiry</option><option value="OUT_OF_STOCK">Request availability</option></select></label><label>Fulfilment<select value={fulfilmentMode} onChange={event=>setFulfilmentMode(event.target.value)}><option value="all">All fulfilment</option><option value="STOCKED">Buildanta stock</option><option value="PARTNER_STOCK">Partner stock</option><option value="ON_REQUEST">On request</option></select></label><label>Maximum indicative price<input type="number" min="0" value={maxPrice} onChange={event=>setMaxPrice(event.target.value)} placeholder="No limit"/></label></div>}
        {visible.length ? <div className="products-grid">{visible.map((product) => <ProductCard key={product.id} product={product} location={locationProducts.get(product.id)} />)}</div> : <div className="empty-panel"><span aria-hidden="true">0</span><h2>No matching products</h2><p>{locationState==="serviceable"?"Try another category or request manual availability confirmation.":"Clear the filters or choose another catalogue section."}</p><button onClick={() => {setTerm("");setBrand("all");setAvailability("all");setFulfilmentMode("all");setMaxPrice("")}}>Clear filters</button></div>}
      </section>
    </section>
  </div>;
}

export function ProductCard({ product,location }: { product: StoreProduct;location?:{availabilityStatus:PublicAvailability;leadTimeLabel:string;fulfilmentMode:string} }) {
  return <article className="product-card"><a className={`product-visual ${product.image ? "has-image" : ""}`} href={`/products/${product.slug}`}><span className="product-brand">{product.brand}</span>{product.image ? <img src={product.image} alt={product.imageAlt} loading="lazy" decoding="async" /> : <b>{product.category.split(" ")[0]}</b>}<i>{location?availabilityStatusLabel(location.availabilityStatus):availabilityLabel(product)}</i></a><div className="product-body"><p>{product.brand} / {product.unit}</p><a href={`/products/${product.slug}`}><h2>{product.name}</h2></a><p className="product-description">{product.description}</p>{location&&<small className="location-product-note">{location.fulfilmentMode==="PARTNER_STOCK"?"Available from partner":location.fulfilmentMode==="ON_REQUEST"?"Available on request":"Buildanta stock"}. {location.leadTimeLabel}.</small>}<div><span>{product.price > 0 ? <>Indicative <strong>{"\u20B9"}{product.price.toLocaleString("en-IN")}</strong></> : <strong>Request latest price</strong>}</span><a className="small-quote" href={`/bulk-quotes?product=${encodeURIComponent(product.name)}`}>Get quote</a></div></div></article>;
}
