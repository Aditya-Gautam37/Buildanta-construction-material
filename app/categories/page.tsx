import Image from "next/image";
import { childrenOf, getCatalogSnapshot, rootNodes, type StoreProduct } from "../live-catalog";
import { ProductCard } from "../product-browser";
import { ServiceabilityChecker } from "../serviceability-checker";

const categoryFallbacks = [
  { terms: ["electrical", "wire", "switch"], src: "/demo/products/copper-wire.png" },
  { terms: ["paint", "finish"], src: "/demo/hero/finish-selection.png" },
  { terms: ["tile", "floor"], src: "/demo/products/porcelain-tile.png" },
  { terms: ["sanitary", "bath", "plumbing", "faucet"], src: "/demo/products/basin-faucet.png" },
  { terms: ["cement", "structure", "brick", "sand"], src: "/demo/products/cement.png" },
  { terms: ["steel", "tmt"], src: "/demo/products/tmt-steel.png" },
  { terms: ["waterproof", "roof"], src: "/demo/hero/build-journey.png" },
  { terms: ["door", "window", "glass"], src: "/homepage_img.png" },
  { terms: ["ceiling", "drywall", "gypsum"], src: "/demo/hero/project-planning.png" },
] as const;

function fallbackImage(name: string) {
  const normalized = name.toLowerCase();
  return categoryFallbacks.find((item) => item.terms.some((term) => normalized.includes(term)))?.src ?? "/demo/hero/build-journey.png";
}

function categoryProducts(products: StoreProduct[], categoryNames: string[]) {
  return products.filter((product) => categoryNames.some((name) => product.categories.includes(name)));
}

export default async function Categories({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q = "" }, catalog] = await Promise.all([searchParams, getCatalogSnapshot()]);
  const needle = q.trim().toLowerCase();
  const roots = rootNodes(catalog.categories);
  const descendantNames = (rootId: string) => {
    const names: string[] = [];
    const collect = (id: string) => {
      const node = catalog.categories.find((item) => item.id === id);
      if (!node) return;
      names.push(node.name);
      childrenOf(catalog.categories, id).forEach((child) => collect(child.id));
    };
    collect(rootId);
    return names;
  };
  const matchedProducts = needle ? catalog.products.filter((product) => `${product.name} ${product.brand} ${product.category} ${product.description} ${product.specs.join(" ")}`.toLowerCase().includes(needle)) : [];
  const filtered = roots.filter((category) => {
    const children = childrenOf(catalog.categories, category.id);
    const products = categoryProducts(catalog.products, descendantNames(category.id));
    return !needle || `${category.name} ${children.map((item) => item.name).join(" ")} ${products.map((product) => `${product.name} ${product.brand}`).join(" ")}`.toLowerCase().includes(needle);
  });
  const liveHeroImages = catalog.products.filter((product) => product.image).slice(0, 3);
  const heroImages = [
    liveHeroImages[0]?.image ?? "/demo/products/cement.png",
    liveHeroImages[1]?.image ?? "/demo/products/porcelain-tile.png",
    liveHeroImages[2]?.image ?? "/demo/products/basin-faucet.png",
  ];

  return <main className="taxonomy-page"><div className="taxonomy-serviceability"><ServiceabilityChecker /></div>
    <section className="category-hero">
      <div className="category-hero-copy"><p>SHOP BY MATERIAL</p><h1>Choose a material. Get the right product.</h1><span>Browse the live catalogue, compare products and request project pricing.</span><div><b>{roots.length}</b><small>material categories</small><b>{catalog.products.length}</b><small>published products</small></div></div>
      <div className="category-hero-gallery" aria-label="Construction material catalogue preview">{heroImages.map((src, index) => <figure key={`${src}-${index}`}><img src={src} alt={index === 0 ? "Structural construction material" : index === 1 ? "Finishing material" : "Fixture and fitting"} /></figure>)}</div>
    </section>
    <form className="taxonomy-search"><span aria-hidden="true">⌕</span><label className="sr-only" htmlFor="category-search">Search categories or brands</label><input id="category-search" name="q" defaultValue={q} placeholder="Search products, categories or brands..." /><button>Search</button></form>
    {needle && <section className="search-product-results"><div className="section-heading-row"><div><p>Search results</p><h2>{matchedProducts.length ? `${matchedProducts.length} matching products` : "No matching products"}</h2><span>{matchedProducts.length ? "Live published products from Buildanta Inventory." : "Try a product, brand, category or specification."}</span></div></div>{matchedProducts.length > 0 && <div className="products-grid">{matchedProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div>}</section>}
    <section className="category-directory"><div className="section-heading-row"><div><p>Browse the catalogue</p><h2>{needle ? "Matching categories" : "Construction material categories"}</h2><span>Open any category to see its live products, prices and quotation options.</span></div><a className="view-all" href="/bulk-quotes">Request a bulk quote <span>→</span></a></div>
      {filtered.length ? <div className="taxonomy-grid">{filtered.map((category) => {
        const children = childrenOf(catalog.categories, category.id);
        const products = categoryProducts(catalog.products, descendantNames(category.id));
        const livePreview = products.find((product) => product.image);
        const previewImage = category.imageUrl ?? livePreview?.image ?? fallbackImage(category.name);
        const brands = [...new Set(products.map((product) => product.brand))].slice(0, 3);
        return <article key={category.id} className="taxonomy-card">
          <a className="taxonomy-card-visual" href={`/categories/${category.slug}`}>
            <Image
              src={previewImage}
              alt={`${category.name} materials`}
              fill
              sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1180px) 50vw, 33vw"
              unoptimized
            />
            <span className={products.length === 0 ? "is-empty" : undefined}>{products.length} {products.length === 1 ? "product" : "products"}</span>
            {livePreview && <i>Live Inventory image</i>}
          </a>
          <div className="taxonomy-card-copy">
            <p>Construction category</p>
            <a href={`/categories/${category.slug}`}><h3>{category.name}</h3></a>
            <span>{category.description || (products.length ? `Featuring ${products.slice(0, 2).map((product) => product.name).join(" and ")}.` : "Products can be published here from Buildanta Inventory.")}</span>
            {brands.length > 0 && <small>{brands.join(" · ")}</small>}
            {children.length > 0 && <ul>{children.slice(0, 5).map((item) => <li key={item.id}><a href={`/categories/${item.slug}`}>{item.name}<span>›</span></a></li>)}</ul>}
            <a className="taxonomy-card-action" href={`/categories/${category.slug}`}>Explore {category.name} <span>→</span></a>
          </div>
        </article>;
      })}</div> : <div className="category-empty"><h2>No matching categories</h2><p>Try another product, category or brand name.</p><a href="/categories">Clear search</a></div>}
    </section>
  </main>;
}
