import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { childrenOf, getCatalogSnapshot, type CatalogNode } from "../../live-catalog";
import { ProductBrowser } from "../../product-browser";

// Category slugs are hierarchical: CategoriesService derives them as
// `parent.slug + "/" + name`, so most published categories are multi-segment.
// A catch-all keeps both shapes reachable at the same public URL.
type CategoryPageProps = { params: Promise<{ slug: string[] }>; searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const [{ slug }, catalog] = await Promise.all([params, getCatalogSnapshot()]);
  const category = catalog.categories.find((item) => item.slug === slug.join("/"));
  if (!category) return {};
  const description = `Browse live ${category.name.toLowerCase()} products, specifications and project quote options on Buildanta.`;
  return { title: category.name, description, openGraph: { title: `${category.name} | Buildanta`, description } };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ slug }, { q = "" }, catalog] = await Promise.all([params, searchParams, getCatalogSnapshot()]);
  const category = catalog.categories.find((item) => item.slug === slug.join("/"));
  if (!category) notFound();
  const byId = new Map(catalog.categories.map((item) => [item.id, item]));
  const crumbs: CatalogNode[] = [];
  let cursor: CatalogNode | undefined = category;
  while (cursor) {
    crumbs.unshift(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
  const descendants: CatalogNode[] = [];
  const collect = (node: CatalogNode) => {
    descendants.push(node);
    childrenOf(catalog.categories, node.id).forEach(collect);
  };
  collect(category);
  const children = childrenOf(catalog.categories, category.id);
  const categoryGroups = Object.fromEntries(descendants.map((node) => {
    const names: string[] = [];
    const collectNames = (current: CatalogNode) => {
      names.push(current.name);
      childrenOf(catalog.categories, current.id).forEach(collectNames);
    };
    collectNames(node);
    return [node.name, names];
  }));
  const productCountFor = (node: CatalogNode) => {
    const accepted = categoryGroups[node.name] ?? [node.name];
    return catalog.products.filter((product) => accepted.some((name) => product.categories.includes(name))).length;
  };
  const productCount = productCountFor(category);

  return <main className="listing-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span><a href="/categories">Categories</a>{crumbs.map((item, index) => <span key={item.id} className="breadcrumb-part">› {index === crumbs.length - 1 ? item.name : <a href={`/categories/${item.slug}`}>{item.name}</a>}</span>)}</nav>
    <div className="page-intro category-page-intro"><div><p>BUILDANTA CATEGORY</p><h1>{category.name}</h1><span>{category.description || "Compare live products from approved suppliers and request project pricing."}</span><small>{productCount} published products across this category</small></div>{category.imageUrl && <img src={category.imageUrl} alt={`${category.name} materials`} />}</div>
    {children.length > 0 && <section className="child-category-section"><div className="section-heading-row"><div><p>Continue browsing</p><h2>Shop {category.name} by type</h2><span>Choose a subcategory before comparing real products.</span></div></div><div className="child-category-grid">{children.map((item) => <a href={`/categories/${item.slug}`} key={item.id}><span>{item.imageUrl ? <img src={item.imageUrl} alt="" /> : <b>{item.name.slice(0, 1)}</b>}</span><div><h3>{item.name}</h3><p>{item.description || "Browse published products."}</p><small>{productCountFor(item)} products →</small></div></a>)}</div></section>}
    <ProductBrowser mode="category" products={catalog.products} options={descendants.map((item) => item.name)} initial={category.name} query={q} categoryGroups={categoryGroups} />
  </main>;
}
