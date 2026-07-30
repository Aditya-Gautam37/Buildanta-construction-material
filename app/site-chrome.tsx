"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { categories, rooms, stages } from "./data";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    if (search.trim()) router.push(`/categories?q=${encodeURIComponent(search.trim())}`);
  }

  return (
    <header className="site-header">
      <a className="wordmark" href="/" aria-label="Buildanta home">
        <img src="/logo.png" alt="" /><strong>Buildanta</strong>
      </a>
      <nav className="desktop-nav" aria-label="Primary">
        <div className="nav-group"><a href="/by-stage">By Stage <span>⌄</span></a><div className="nav-dropdown">{stages.slice(0, 6).map(([, name]) => <a href={`/by-stage?stage=${encodeURIComponent(name)}`} key={name}>{name}</a>)}</div></div>
        <div className="nav-group"><a href="/by-room">By Room <span>⌄</span></a><div className="nav-dropdown">{rooms.map((room) => <a href={`/by-room?room=${encodeURIComponent(room.name)}`} key={room.name}>{room.name}</a>)}</div></div>
        <div className="nav-group"><a href="/categories">Categories <span>⌄</span></a><div className="nav-dropdown">{categories.slice(0, 7).map((category) => <a href={`/categories/${category.slug}`} key={category.slug}>{category.name}</a>)}</div></div>
        <div className="nav-group"><a href="/more">More <span>⌄</span></a><div className="nav-dropdown compact"><a href="/bulk-quotes">Get Bulk Quotes</a><a href="/list-product">List your Products</a><a href="/inventory">Inventory Portal</a></div></div>
      </nav>
      <form className="header-search" onSubmit={submitSearch}>
        <label className="sr-only" htmlFor="global-search">Search products</label>
        <input id="global-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products, brands, categories..." />
        <button aria-label="Search" type="submit">⌕</button>
      </form>
      <div className="account-links"><a href="/login">Login</a><a className="signup-button" href="/signup">Sign Up</a></div>
      <button className="menu-button" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><i /><i /><i /></button>
      {menuOpen && <div className="mobile-drawer" onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setMenuOpen(false); }}>
        <form className="mobile-search" onSubmit={submitSearch}><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." /><button>Search</button></form>
        <a href="/by-stage">By Stage</a><a href="/by-room">By Room</a><a href="/categories">Categories</a><a href="/bulk-quotes">Get Bulk Quotes</a><a href="/list-product">List your Products</a><a href="/inventory">Inventory Portal</a>
        <div><a href="/login">Login</a><a className="signup-button" href="/signup">Sign Up</a></div>
      </div>}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand"><a className="wordmark" href="/"><img src="/logo.png" alt="" /><strong>Buildanta</strong></a><p>Your all-in-one source for every build detail.</p></div>
      <FooterColumn title="By Stage" links={["Flooring & Tiling", "Electrical & Wiring", "False Ceiling", "Paint & Finishing", "Kitchen & Wardrobes", "Bathroom & Plumbing"]} href="/by-stage" />
      <FooterColumn title="By Room" links={["Kitchen", "Bathroom", "Living Room", "Bedroom", "Balcony & Terrace"]} href="/by-room" />
      <FooterColumn title="Categories" links={["Cement & Structure", "Steel & TMT", "Paints", "Electrical", "Tiles & Flooring", "Doors & Windows"]} href="/categories" />
      <FooterColumn title="More" links={["Get Bulk Quotes", "List your Product", "Inventory Portal", "Preview My Reno (Coming soon)"]} href="/more" />
      <p className="copyright">© 2026 Buildanta. All rights reserved.</p>
    </footer>
  );
}

function FooterColumn({ title, links, href }: { title: string; links: string[]; href: string }) {
  return <div className="footer-column"><a className="footer-title" href={href}>{title}</a>{links.map((link) => <a key={link} href={link.includes("Quote") ? "/bulk-quotes" : link.includes("List") ? "/list-product" : link.includes("Inventory") ? "/inventory" : href}>{link}</a>)}</div>;
}
