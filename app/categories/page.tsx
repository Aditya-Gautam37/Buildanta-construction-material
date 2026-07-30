import { categories } from "../data";

const taxonomy: Record<string, string[]> = {
  "Cement & Structure": ["PPC & OPC Cement", "Ready-Mix Concrete", "AAC Blocks", "Red Bricks", "Aggregates", "Construction Chemicals"],
  "Steel & TMT": ["TMT Bars", "Structural Steel", "Binding Wire", "MS Pipes", "Reinforcement Mesh", "Fabricated Steel"],
  Electrical: ["House Wires", "Modular Switches", "MCB & Distribution", "Lighting", "Fans", "Conduits & Accessories"],
  Paints: ["Interior Paints", "Exterior Paints", "Primers", "Wood Finishes", "Metal Paints", "Putty & Textures"],
  "Tiles & Flooring": ["Vitrified Tiles", "Ceramic Tiles", "Natural Stone", "Wooden Flooring", "Tile Adhesives", "Grout"],
  "Sanitaryware & Bathware": ["Water Closets", "Wash Basins", "Faucets", "Showers", "Bathtubs", "Bathroom Accessories"],
  Waterproofing: ["Terrace Waterproofing", "Bathroom Systems", "Sealants", "Membranes", "Crack Fillers", "Protective Coatings"],
  "Doors & Windows": ["uPVC Windows", "Aluminium Windows", "Wooden Doors", "Flush Doors", "Glass", "Architectural Hardware"],
  "False Ceiling & Drywall": ["Gypsum Boards", "Ceiling Channels", "Drywall Systems", "Acoustic Ceilings", "Mineral Fibre Tiles", "Accessories"],
};

export default async function Categories({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const filtered = categories.filter((category) => !q || `${category.name} ${taxonomy[category.name].join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  return <main className="taxonomy-page"><div className="page-intro"><p>EXPLORE THE CATALOGUE</p><h1>Building Categories</h1><span>Discover products, materials and trusted brands across the complete construction journey.</span></div>
    <form className="taxonomy-search"><span>⌕</span><input name="q" defaultValue={q} placeholder="Search categories, products or brands..." /><button>Search</button></form>
    <section><h2>Featured Categories</h2><div className="taxonomy-grid">{filtered.map((category) => <article key={category.slug}><a className="taxonomy-icon" href={`/categories/${category.slug}`}>{category.icon}</a><div><a href={`/categories/${category.slug}`}><h3>{category.name}</h3></a><p>{category.blurb}</p><ul>{taxonomy[category.name].map((item) => <li key={item}><a href={`/categories/${category.slug}?q=${encodeURIComponent(item)}`}>{item}<span>›</span></a></li>)}</ul></div></article>)}</div></section>
  </main>;
}
