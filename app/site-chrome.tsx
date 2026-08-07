"use client";

import { FormEvent, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type ChromeProps = {
  categories: { name: string; slug: string }[];
  rooms: string[];
  stages: string[];
  inventoryHref: string;
  customerName?: string;
};

export function Header({ categories, rooms, stages, customerName }: ChromeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();

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
      <div className="header-utility"><div><p><span /> Construction materials for every stage of your build</p><nav aria-label="Quick links"><a href="/bulk-quotes">Project quotations</a><a href="/professionals">Find professionals</a></nav></div></div>
      <div className="header-main">
        <a className="wordmark" href="/" aria-label="Buildanta home"><img src="/logo.png" alt="" /><span><strong>Buildanta</strong><small>Build better. Buy smarter.</small></span></a>
        <form className="header-search" onSubmit={submitSearch}>
          <label className="sr-only" htmlFor="global-search">Search products</label>
          <input id="global-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, brands, categories..." />
          <button aria-label="Search" type="submit">Search</button>
        </form>
        <div className="account-links">{customerName ? <a className="signup-button" href="/account">My Account</a> : <><a href="/login">Customer Login</a><a className="signup-button" href="/signup">Sign Up</a></>}</div>
        <button className="menu-button" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><i /><i /><i /></button>
      </div>
      <div className="header-navigation">
        <nav className="desktop-nav" aria-label="Primary">
          <div className={navGroupClass("/by-stage")}><a href="/by-stage">Shop by Stage <span>⌄</span></a><div className="nav-dropdown">{stages.slice(0, 8).map((name) => <a href={`/by-stage?stage=${encodeURIComponent(name)}`} key={name}>{name}</a>)}</div></div>
          <div className={navGroupClass("/by-room")}><a href="/by-room">Shop by Room <span>⌄</span></a><div className="nav-dropdown">{rooms.map((name) => <a href={`/by-room?room=${encodeURIComponent(name)}`} key={name}>{name}</a>)}</div></div>
          <div className={navGroupClass("/categories")}><a href="/categories">All Categories <span>⌄</span></a><div className="nav-dropdown">{categories.slice(0, 8).map((category) => <a href={`/categories/${category.slug}`} key={category.slug}>{category.name}</a>)}</div></div>
          <div className={navGroupClass("/calculators")}><a href="/calculators">Design & Calculators</a></div>
          <div className={navGroupClass("/more")}><a href="/more">More Services <span>⌄</span></a><div className="nav-dropdown compact"><a href="/professionals">Find Professionals</a><a href="/bulk-quotes">Get Bulk Quotes</a><a href="/list-product">List your Products</a></div></div>
        </nav>
        <a className="header-quote" href="/bulk-quotes"><span>Need project pricing?</span><strong>Request a quote →</strong></a>
      </div>
      {menuOpen && <div className="mobile-drawer" onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setMenuOpen(false); }}>
        <form className="mobile-search" onSubmit={submitSearch}><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." /><button>Search</button></form>
        <a href="/by-stage">By Stage</a><a href="/by-room">By Room</a><a href="/categories">Categories</a><a href="/calculators">Calculators</a><a href="/professionals">Find Professionals</a><a href="/bulk-quotes">Get Bulk Quotes</a><a href="/list-product">List your Products</a>
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
        <FooterColumn title="Plan your project" links={[{ label: "Complete material planner", href: "/calculators/complete-construction-material" }, ...stages.slice(0, 2).map((name) => ({ label: name, href: `/by-stage?stage=${encodeURIComponent(name)}` })), ...rooms.slice(0, 2).map((name) => ({ label: name, href: `/by-room?room=${encodeURIComponent(name)}` }))]} />
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
