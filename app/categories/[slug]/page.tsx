import { notFound } from "next/navigation";
import { categories } from "../../data";
import { ProductBrowser } from "../../product-browser";

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ q?: string }> }) {
  const [{ slug }, { q = "" }] = await Promise.all([params, searchParams]);
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  return <main className="listing-page"><div className="page-intro"><p>BUILDANTA CATEGORY</p><h1>{category.name}</h1><span>{category.blurb}. Compare trusted products and request project pricing.</span></div><ProductBrowser mode="category" initial={category.name} query={q} /></main>;
}
