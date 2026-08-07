"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { availabilityLabel, availabilityStatusLabel, type PublicAvailability, type StoreProduct } from "./live-catalog";
import { StageQuestionnaire } from "./by-stage/stage-questionnaire";
import { GuidedProductFinder } from "./guided-product-finder";

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
  "Kitchen & Wardrobes": "Cabinetry, countertops, wardrobe systems and hardware for fitted residential interiors.",
  Finishing: "Final accessories, sealants, touch-up work and snagging materials required before handover.",
};

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
      <form className={`location-filter-bar ${locationState}`} onSubmit={event=>{event.preventDefault();void checkLocation(pincode)}}><div><strong>Delivery PIN code</strong><span>{locationState==="serviceable"?"Showing products serviceable in your area.":locationState==="unsupported"?"This area is not serviceable yet. Products remain available for manual enquiry.":locationState==="error"?"Availability could not be confirmed. You can still request a quotation.":"Set your PIN code for location-aware products and delivery estimates."}</span></div><label><span className="sr-only">Delivery PIN code</span><input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pincode} onChange={event=>setPincode(event.target.value.replace(/\D/g,""))} placeholder="6-digit PIN"/></label><button disabled={locationState==="loading"}>{locationState==="loading"?"Checking...":"Apply"}</button></form>
      <div className="stage-context">
        <div className="stage-context-number"><small>{mode === "stage" ? "BUILD STAGE" : "CATALOGUE VIEW"}</small><strong>{String(selectionIndex + 1).padStart(2, "0")}</strong></div>
        <div><p>{mode === "stage" ? "Materials for this phase" : mode === "room" ? "Products for this room" : "Product category"}</p><h1>{selection || "Construction materials"}</h1><span>{description}</span></div>
        <ul><li>Inventory connected</li><li>Real product photography</li><li>Project quotes available</li></ul>
      </div>
      {mode === "stage" ? <StageQuestionnaire key={selection} stage={selection} products={scopedProducts} deliveryPincode={pincode} /> : <GuidedProductFinder key={`${mode}-${selection}`} mode={mode} selection={selection} products={scopedProducts} />}
      <div className="results-toolbar" id="product-results"><label><span aria-hidden="true">Search</span><input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search products and brands..." /></label><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products"><option value="featured">Recently updated</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option></select></div>
      <div className="advanced-filters"><label>Brand<select value={brand} onChange={event=>setBrand(event.target.value)}><option value="all">All brands</option>{brands.map(value=><option value={value} key={value}>{value}</option>)}</select></label><label>Availability<select value={availability} onChange={event=>setAvailability(event.target.value)}><option value="all">All availability</option><option value="IN_STOCK">Available</option><option value="LOW_STOCK">Limited</option><option value="ENQUIRY">On enquiry</option><option value="OUT_OF_STOCK">Request availability</option></select></label><label>Fulfilment<select value={fulfilmentMode} onChange={event=>setFulfilmentMode(event.target.value)}><option value="all">All fulfilment</option><option value="STOCKED">Buildanta stock</option><option value="PARTNER_STOCK">Partner stock</option><option value="ON_REQUEST">On request</option></select></label><label>Maximum indicative price<input type="number" min="0" value={maxPrice} onChange={event=>setMaxPrice(event.target.value)} placeholder="No limit"/></label></div>
      <div className="results-summary"><strong>{visible.length} products</strong><span>Pricing is indicative. Final price, GST and transport are confirmed in your quotation.</span></div>
      {visible.length ? <div className="products-grid">{visible.map((product) => <ProductCard key={product.id} product={product} location={locationProducts.get(product.id)} />)}</div> : <div className="empty-panel"><span aria-hidden="true">0</span><h2>No matching products</h2><p>{locationState==="serviceable"?"Try another category or request manual availability confirmation.":"Clear the filters or choose another catalogue section."}</p><button onClick={() => {setTerm("");setBrand("all");setAvailability("all");setFulfilmentMode("all");setMaxPrice("")}}>Clear filters</button></div>}
    </section>
  </div>;
}

export function ProductCard({ product,location }: { product: StoreProduct;location?:{availabilityStatus:PublicAvailability;leadTimeLabel:string;fulfilmentMode:string} }) {
  return <article className="product-card"><a className={`product-visual ${product.image ? "has-image" : ""}`} href={`/products/${product.slug}`}><span className="product-brand">{product.brand}</span>{product.image ? <img src={product.image} alt={product.imageAlt} loading="lazy" decoding="async" /> : <b>{product.category.split(" ")[0]}</b>}<i>{location?availabilityStatusLabel(location.availabilityStatus):availabilityLabel(product)}</i></a><div className="product-body"><p>{product.brand} / {product.unit}</p><a href={`/products/${product.slug}`}><h2>{product.name}</h2></a><p className="product-description">{product.description}</p>{location&&<small className="location-product-note">{location.fulfilmentMode==="PARTNER_STOCK"?"Available from partner":location.fulfilmentMode==="ON_REQUEST"?"Available on request":"Buildanta stock"}. {location.leadTimeLabel}.</small>}<div><span>{product.price > 0 ? <>Indicative <strong>{"\u20B9"}{product.price.toLocaleString("en-IN")}</strong></> : <strong>Request latest price</strong>}</span><a className="small-quote" href={`/bulk-quotes?product=${encodeURIComponent(product.name)}`}>Get quote</a></div></div></article>;
}
