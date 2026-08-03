import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogSnapshot } from "../../live-catalog";
import { ProductBrowser } from "../../product-browser";

type CategoryPageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const [{ slug }, catalog] = await Promise.all([params, getCatalogSnapshot()]);
  const category = catalog.categories.find((item) => item.slug === slug);
  if (!category) return {};
  const description = `Browse live ${category.name.toLowerCase()} products, specifications and project quote options on Buildanta.`;
  return { title: category.name, description, openGraph: { title: `${category.name} | Buildanta`, description } };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const [{ slug }, { q = "" }, catalog] = await Promise.all([params, searchParams, getCatalogSnapshot()]);
  const category = catalog.categories.find((item) => item.slug === slug);
  if (!category) notFound();
  return <main className="listing-page"><div className="page-intro"><p>BUILDANTA CATEGORY</p><h1>{category.name}</h1><span>Compare live products from trusted suppliers and request project pricing.</span></div><ProductBrowser mode="category" products={catalog.products} options={catalog.categories.map((item) => item.name)} initial={category.name} query={q} /></main>;
}
