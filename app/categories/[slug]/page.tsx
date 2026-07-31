import { notFound } from "next/navigation";
import { getCatalogSnapshot } from "../../live-catalog";
import { ProductBrowser } from "../../product-browser";

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string }> }) {
  const [{ slug }, { q = "" }, catalog] = await Promise.all([params, searchParams, getCatalogSnapshot()]);
  const category = catalog.categories.find((item) => item.slug === slug);
  if (!category) notFound();
  return <main className="listing-page"><div className="page-intro"><p>BUILDANTA CATEGORY</p><h1>{category.name}</h1><span>Compare live products from trusted suppliers and request project pricing.</span></div><ProductBrowser mode="category" products={catalog.products} options={catalog.categories.map((item) => item.name)} initial={category.name} query={q} /></main>;
}
