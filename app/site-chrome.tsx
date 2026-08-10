"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { UiIcon } from "./ui-icon";
import { clearDeliveryPincode, DELIVERY_PIN_STORAGE_KEY, DELIVERY_PIN_UPDATED_EVENT } from "./delivery-location";
import { useCart } from "./cart-context";

type ChromeProps = {
  categories: { name: string; slug: string }[];
  brands: { name: string; slug: string }[];
  rooms: { name: string; slug: string }[];
  stages: { name: string; slug: string }[];
  inventoryHref: string;
  customerName?: string;
};

export function Header({ categories, rooms, stages, brands, customerName }: ChromeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [deliveryPincode, setDeliveryPincode] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const { summary: cartSummary, loading: cartLoading } = useCart();

  useEffect(() => {
    const syncStoredPincode = () => {
      const saved = window.localStorage.getItem(DELIVERY_PIN_STORAGE_KEY) || "";
      setDeliveryPincode(/^\d{6}$/.test(saved) ? saved : "");
    };
    const handleUpdatedPincode = (event: Event) => setDeliveryPincode((event as CustomEvent<string>).detail || "");
    const timer = window.setTimeout(syncStoredPincode, 0);
    window.addEventListener(DELIVERY_PIN_UPDATED_EVENT, handleUpdatedPincode);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(DELIVERY_PIN_UPDATED_EVENT, handleUpdatedPincode);
    };
  }, []);

  function resetDeliveryPincode() {
    clearDeliveryPincode();
    setDeliveryPincode("");
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    if (search.trim()) router.push(`/categories?q=${encodeURIComponent(search.trim())}`);
  }

  function navGroupClass(href: string) {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return active ? "nav-group nav-highlight" : "nav-group";
  }

  return (
    <header className="site-header">
      <div className="header-utility"><div><p><span /> Construction materials for every stage of your build</p><nav aria-label="Quick links">{deliveryPincode && <button className="header-location" onClick={resetDeliveryPincode} title="Change delivery PIN code"><b>Deliver to</b> {deliveryPincode}</button>}<a href="/bulk-quotes">Project quotations</a><a href="/professionals">Find professionals</a></nav></div></div>
      <div className="header-main">
        <a className="wordmark" href="/" aria-label="Buildanta home"><img src="/logo.png" alt="" /><span><strong>Buildanta</strong><small>Build better. Buy smarter.</small></span></a>
        <form className="header-search" onSubmit={submitSearch}>
          <label className="sr-only" htmlFor="global-search">Search products</label>
          <input id="global-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, brands, categories..." />
          <button aria-label="Search" type="submit"><UiIcon name="search" size={17} /><span className="sr-only">Search</span></button>
        </form>
        {deliveryPincode && <button className="header-location-mobile" onClick={resetDeliveryPincode} aria-label={`Change delivery PIN code ${deliveryPincode}`}><span>PIN</span>{deliveryPincode}</button>}
        <div className="account-links"><a className="header-cart" href="/cart" aria-label={`Cart with ${cartSummary.itemCount} items`}>Cart <span aria-hidden="true">{cartLoading ? "…" : cartSummary.itemCount}</span></a>{customerName ? <a className="signup-button" href="/account">My Account</a> : <><a href="/login">Customer Login</a><a className="signup-button" href="/signup">Sign Up</a></>}</div>
        <button className="menu-button" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><i /><i /><i /></button>
      </div>
      <div className="header-navigation">
        <nav className="desktop-nav" aria-label="Primary">
          <div className={`${navGroupClass("/categories")} categories-navigation`}><a href="/categories">All Categories <UiIcon name="chevron-down" size={14} /></a><div className="nav-dropdown">{categories.slice(0, 8).map((category) => <a href={`/categories/${category.slug}`} key={category.slug}>{category.name}</a>)}</div></div>
          <div className={navGroupClass("/by-stage")}><a href="/by-stage">Shop by Stage <UiIcon name="chevron-down" size={14} /></a><div className="nav-dropdown">{stages.slice(0, 8).map((stage) => <a href={`/by-stage/${stage.slug}`} key={stage.slug}>{stage.name}</a>)}</div></div>
          <div className={navGroupClass("/by-room")}><a href="/by-room">Shop by Room <UiIcon name="chevron-down" size={14} /></a><div className="nav-dropdown">{rooms.map((room) => <a href={`/by-room/${room.slug}`} key={room.slug}>{room.name}</a>)}</div></div>
          <div className={navGroupClass("/brands")}><a href="/brands">Shop by Brand <UiIcon name="chevron-down" size={14} /></a><div className="nav-dropdown">{brands.slice(0, 8).map((brand) => <a href={`/brands/${brand.slug}`} key={brand.slug}>{brand.name}</a>)}</div></div>
          <div className={navGroupClass("/calculators")}><a href="/calculators">Design & Calculators</a></div>
          <div className={navGroupClass("/more")}><a href="/more">More Services <UiIcon name="chevron-down" size={14} /></a><div className="nav-dropdown compact"><a href="/professionals">Find Professionals</a><a href="/bulk-quotes">Get Bulk Quotes</a><a href="/list-product">List your Products</a></div></div>
        </nav>
        <a className="header-quote" href="/bulk-quotes"><span>Need project pricing?</span><strong>Request a quote →</strong></a>
      </div>
      {menuOpen && <div className="mobile-drawer" onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setMenuOpen(false); }}>
        <form className="mobile-search" onSubmit={submitSearch}><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." /><button>Search</button></form>
        <a href="/cart">Cart ({cartSummary.itemCount})</a><a href="/by-stage">By Stage</a><a href="/by-room">By Room</a><a href="/categories">Categories</a><a href="/brands">Brands</a><a href="/calculators">Calculators</a><a href="/professionals">Find Professionals</a><a href="/bulk-quotes">Get Bulk Quotes</a><a href="/list-product">List your Products</a>
        <div>{customerName ? <a className="signup-button" href="/account">My Account</a> : <><a href="/login">Customer Login</a><a className="signup-button" href="/signup">Sign Up</a></>}</div>
      </div>}
    </header>
  );
}

export function Footer({ categories, rooms, stages, inventoryHref }: ChromeProps) {
  return (
    <footer className="site-footer">
      <section className="footer-cta"><div><p>PLANNING A BUILD OR RENOVATION?</p><h2>Turn your material list into one clear quotation.</h2></div><div><a className="button orange" href="/calculators">Calculate materials <span>-&gt;</span></a><a className="footer-cta-link" href="/categories">Browse the catalogue</a></div></section>
      <div className="footer-main">
        <div className="footer-brand"><a className="wordmark" href="/"><img src="/logo.png" alt="" /><strong>Buildanta</strong></a><p>Construction materials, professional discovery and quotation support in one connected platform.</p><span className="footer-live"><i /> Catalogue synchronized with Inventory</span><small>Serving project enquiries with delivery confirmation by PIN code.</small></div>
        <FooterColumn title="Shop materials" links={categories.slice(0, 6).map((item) => ({ label: item.name, href: `/categories/${item.slug}` }))} />
        <FooterColumn title="Plan your project" links={[{ label: "Complete material planner", href: "/calculators/complete-construction-material" }, ...stages.slice(0, 2).map((stage) => ({ label: stage.name, href: `/by-stage/${stage.slug}` })), ...rooms.slice(0, 2).map((room) => ({ label: room.name, href: `/by-room/${room.slug}` }))]} />
        <FooterColumn title="Buildanta services" links={[{ label: "Material Calculators", href: "/calculators" }, { label: "Get Bulk Quotes", href: "/bulk-quotes" }, { label: "Find Professionals", href: "/professionals" }, { label: "Customer Account", href: "/account" }]} />
        <div className="footer-column footer-staff"><span className="footer-title">For your team</span><p>Manage published products, images, stock, calculators and enquiries in the separate operations workspace.</p><a href={inventoryHref}>Open Inventory Management [new]</a></div>
      </div>
      <div className="footer-bottom"><p>(c) 2026 Buildanta Private Limited. All rights reserved.</p><p>Product pricing and delivery are confirmed in the final quotation.</p></div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return <div className="footer-column"><span className="footer-title">{title}</span>{links.map((link) => <a key={link.label} href={link.href}>{link.label}</a>)}</div>;
}
