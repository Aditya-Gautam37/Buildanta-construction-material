import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { childrenOf, getCatalogSnapshot, rootNodes, type CatalogNode } from "../../live-catalog";
import { ancestryOf, brandOptions, excludedIdsFor, productsInSubtree, resolveStep } from "../../guided-wizard";
import { WizardOptionGrid } from "../../wizard-option-grid";
import { ProductBrowser } from "../../product-browser";

// Category slugs are hierarchical: CategoriesService derives them as
// `parent.slug + "/" + name`, so most published categories are multi-segment.
// A catch-all keeps both shapes reachable at the same public URL.
type CategoryPageProps = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ q?: string; room?: string; brand?: string }>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const [{ slug }, catalog] = await Promise.all([params, getCatalogSnapshot()]);
  const category = catalog.categories.find((item) => item.slug === slug.join("/"));
  if (!category) return {};
  const description = `Browse live ${category.name.toLowerCase()} products, specifications and project quote options on Buildanta.`;
  return { title: category.name, description, openGraph: { title: `${category.name} | Buildanta`, description } };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ slug }, { q = "", room: roomSlug = "", brand: brandFilter = "" }, catalog] = await Promise.all([
    params,
    searchParams,
    getCatalogSnapshot(),
  ]);
  const category = catalog.categories.find((item) => item.slug === slug.join("/"));
  if (!category) notFound();

  // The room narrows which departments are offered and which subcategories are
  // hidden. It deliberately does not filter products by their room tag: with a
  // thin catalogue that would empty most screens for no benefit.
  const room = roomSlug ? rootNodes(catalog.rooms).find((node) => node.slug === roomSlug) : undefined;
  const excluded = excludedIdsFor(room);
  const carry = (extra: Record<string, string> = {}) => {
    const query = new URLSearchParams();
    if (room) query.set("room", room.slug);
    for (const [key, value] of Object.entries(extra)) if (value) query.set(key, value);
    const encoded = query.toString();
    return encoded ? `?${encoded}` : "";
  };

  const step = resolveStep(catalog.categories, catalog.products, category.id, excluded);
  const crumbs: CatalogNode[] = ancestryOf(catalog.categories, step.current.id);
  const scoped = productsInSubtree(catalog.products, catalog.categories, step.current.id, excluded);
  const brands = brandOptions(scoped);
  const visibleProducts = brandFilter ? scoped.filter((product) => product.brand === brandFilter) : scoped;
  const atLeaf = step.options.length === 0;

  return <main className="listing-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a><span>›</span><a href="/categories">Categories</a>
      {crumbs.map((item, index) => <span key={item.id} className="breadcrumb-part">
        › {index === crumbs.length - 1 ? item.name : <a href={`/categories/${item.slug}${carry()}`}>{item.name}</a>}
      </span>)}
    </nav>

    {(room || brandFilter) && (
      <div className="wizard-chips" aria-label="Active filters">
        <span>Narrowed by</span>
        {room && <a className="wizard-chip" href={`/categories/${step.current.slug}${brandFilter ? `?brand=${encodeURIComponent(brandFilter)}` : ""}`}>
          {room.name} <b aria-hidden="true">×</b><span className="sr-only">Remove the {room.name} filter</span>
        </a>}
        {brandFilter && <a className="wizard-chip" href={`/categories/${step.current.slug}${carry()}`}>
          {brandFilter} <b aria-hidden="true">×</b><span className="sr-only">Remove the {brandFilter} filter</span>
        </a>}
      </div>
    )}

    <div className="page-intro category-page-intro">
      <div>
        <p>{room ? `${room.name.toUpperCase()} · BUILDANTA` : "BUILDANTA CATEGORY"}</p>
        <h1>{step.current.name}</h1>
        <span>{step.current.description || "Compare live products from approved suppliers and request project pricing."}</span>
        <small>{scoped.length} published {scoped.length === 1 ? "product" : "products"} in this section</small>
      </div>
      {step.current.imageUrl && <img src={step.current.imageUrl} alt={`${step.current.name} materials`} />}
    </div>

    {step.options.length > 0 && (
      <WizardOptionGrid
        heading={`Shop ${step.current.name.toLowerCase()} by type`}
        subheading="Choose a type before comparing real products."
        options={step.options.map((option) => ({
          id: option.node.id,
          name: option.node.name,
          href: `/categories/${option.node.slug}${carry()}`,
          description: option.node.description,
          imageUrl: option.node.imageUrl,
          productCount: option.productCount,
        }))}
      />
    )}

    {atLeaf && brands.length > 1 && (
      <section className="wizard-brand-step" aria-label="Choose a brand">
        <p>Shop by brand</p>
        <div className="wizard-chip-row">
          <a className={brandFilter ? "wizard-chip" : "wizard-chip selected"} href={`/categories/${step.current.slug}${carry()}`}>Any brand</a>
          {brands.map((option) => (
            <a
              className={brandFilter === option.brand ? "wizard-chip selected" : "wizard-chip"}
              href={`/categories/${step.current.slug}${carry({ brand: option.brand })}`}
              key={option.brand}
            >
              {option.brand} <small>{option.productCount}</small>
            </a>
          ))}
        </div>
      </section>
    )}

    {/* Products only at the end of the journey: an intermediate level that also
        dumps a full grid is the overwhelm this replaces. */}
    {atLeaf && (
      visibleProducts.length > 0
        ? <ProductBrowser
            mode="category"
            products={visibleProducts}
            options={[step.current.name]}
            initial={step.current.name}
            query={q}
            categoryGroups={{ [step.current.name]: [step.current.name] }}
          />
        : <section className="empty-panel">
            <span aria-hidden="true">0</span>
            <h2>No products here yet</h2>
            <p>We can still source this. Tell us what you need and we will come back with pricing.</p>
            <a className="button orange" href={`/bulk-quotes?product=${encodeURIComponent(step.current.name)}`}>Request pricing</a>
          </section>
    )}
  </main>;
}
