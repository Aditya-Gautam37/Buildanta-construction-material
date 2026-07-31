import { childrenOf, getCatalogSnapshot, rootNodes } from "../live-catalog";

const categoryIcons = ["ϟ", "◐", "▦", "♧", "▧", "Ⅱ", "◒", "▤", "⌂", "▱"];

export default async function Categories({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q = "" }, catalog] = await Promise.all([searchParams, getCatalogSnapshot()]);
  const needle = q.trim().toLowerCase();
  const roots = rootNodes(catalog.categories);
  const filtered = roots.filter((category) => {
    const children = childrenOf(catalog.categories, category.id);
    return !needle || `${category.name} ${children.map((item) => item.name).join(" ")} ${catalog.brands.map((brand) => brand.name).join(" ")}`.toLowerCase().includes(needle);
  });

  return <main className="taxonomy-page"><div className="page-intro"><p>EXPLORE THE LIVE CATALOGUE</p><h1>Building Categories</h1><span>Products, categories and brands on this page are read directly from Buildanta Inventory.</span></div>
    <form className="taxonomy-search"><span>⌕</span><input name="q" defaultValue={q} placeholder="Search categories or brands..." /><button>Search</button></form>
    <section><h2>Featured Categories</h2><div className="taxonomy-grid">{filtered.map((category, index) => {
      const children = childrenOf(catalog.categories, category.id);
      return <article key={category.id}><a className="taxonomy-icon" href={`/categories/${category.slug}`}>{categoryIcons[index % categoryIcons.length]}</a><div><a href={`/categories/${category.slug}`}><h3>{category.name}</h3></a><p>Explore products and request project pricing from the live supplier catalogue.</p>{children.length > 0 && <ul>{children.slice(0, 6).map((item) => <li key={item.id}><a href={`/categories/${item.slug}`}>{item.name}<span>›</span></a></li>)}</ul>}</div></article>;
    })}</div></section>
  </main>;
}
