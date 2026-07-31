"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ChromeProps = {
  categories: { name: string; slug: string }[];
  rooms: string[];
  stages: string[];
  inventoryHref: string;
};

export function Header({ categories, rooms, stages, inventoryHref }: ChromeProps) {
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
        <div className="nav-group"><a href="/by-stage">By Stage <span>⌄</span></a><div className="nav-dropdown">{stages.slice(0, 8).map((name) => <a href={`/by-stage?stage=${encodeURIComponent(name)}`} key={name}>{name}</a>)}</div></div>
        <div className="nav-group"><a href="/by-room">By Room <span>⌄</span></a><div className="nav-dropdown">{rooms.map((name) => <a href={`/by-room?room=${encodeURIComponent(name)}`} key={name}>{name}</a>)}</div></div>
        <div className="nav-group"><a href="/categories">Categories <span>⌄</span></a><div className="nav-dropdown">{categories.slice(0, 8).map((category) => <a href={`/categories/${category.slug}`} key={category.slug}>{category.name}</a>)}</div></div>
        <div className="nav-group"><a href="/more">More <span>⌄</span></a><div className="nav-dropdown compact"><a href="/bulk-quotes">Get Bulk Quotes</a><a href="/list-product">List your Products</a><a href={inventoryHref}>Inventory Management ↗</a></div></div>
      </nav>
      <form className="header-search" onSubmit={submitSearch}>
        <label className="sr-only" htmlFor="global-search">Search products</label>
        <input id="global-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products, brands, categories..." />
        <button aria-label="Search" type="submit">⌕</button>
      </form>
      <div className="account-links"><a href="/login">Customer Login</a><a className="signup-button" href="/signup">Sign Up</a></div>
      <button className="menu-button" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><i /><i /><i /></button>
      {menuOpen && <div className="mobile-drawer" onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setMenuOpen(false); }}>
        <form className="mobile-search" onSubmit={submitSearch}><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." /><button>Search</button></form>
        <a href="/by-stage">By Stage</a><a href="/by-room">By Room</a><a href="/categories">Categories</a><a href="/bulk-quotes">Get Bulk Quotes</a><a href="/list-product">List your Products</a><a href={inventoryHref}>Inventory Management ↗</a>
        <div><a href="/login">Customer Login</a><a className="signup-button" href="/signup">Sign Up</a></div>
      </div>}
    </header>
  );
}

export function Footer({ categories, rooms, stages, inventoryHref }: ChromeProps) {
  return (
    <footer className="site-footer">
      <div className="footer-brand"><a className="wordmark" href="/"><img src="/logo.png" alt="" /><strong>Buildanta</strong></a><p>Your all-in-one source for every build detail. Catalogue data is managed separately in Buildanta Inventory.</p></div>
      <FooterColumn title="By Stage" links={stages.slice(0, 6).map((name) => ({ label: name, href: `/by-stage?stage=${encodeURIComponent(name)}` }))} />
      <FooterColumn title="By Room" links={rooms.slice(0, 6).map((name) => ({ label: name, href: `/by-room?room=${encodeURIComponent(name)}` }))} />
      <FooterColumn title="Categories" links={categories.slice(0, 6).map((item) => ({ label: item.name, href: `/categories/${item.slug}` }))} />
      <FooterColumn title="More" links={[{ label: "Get Bulk Quotes", href: "/bulk-quotes" }, { label: "List your Product", href: "/list-product" }, { label: "Inventory Management ↗", href: inventoryHref }, { label: "Preview My Reno (Coming soon)", href: "/more" }]} />
      <p className="copyright">© 2026 Buildanta. All rights reserved.</p>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return <div className="footer-column"><span className="footer-title">{title}</span>{links.map((link) => <a key={link.label} href={link.href}>{link.label}</a>)}</div>;
}
