import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogSnapshot } from "../../live-catalog";
import { ProductCard } from "../../product-browser";
import { ProductDetailClient } from "../../product-detail-client";

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const [{ slug }, catalog] = await Promise.all([params, getCatalogSnapshot()]);
  const product = catalog.products.find((item) => item.slug === slug);
  if (!product) return {};
  const description = product.description.slice(0, 155);
  return { title: product.name, description, openGraph: { title: `${product.name} | Buildanta`, description, images: product.image ? [{ url: product.image, alt: product.imageAlt }] : undefined } };
}

export default async function ProductDetail({ params }: ProductPageProps) {
  const [{ slug }, catalog] = await Promise.all([params, getCatalogSnapshot()]);
  const product = catalog.products.find((item) => item.slug === slug);
  if (!product) notFound();
  const related = catalog.products.filter((item) => item.id !== product.id && item.categories.some((category) => product.categories.includes(category))).slice(0, 4);
  return <main className="product-page"><div className="breadcrumbs"><a href="/">Home</a><span>›</span><a href={`/categories/${product.categorySlug}`}>{product.category}</a><span>›</span>{product.name}</div><ProductDetailClient product={product} /><section className="spec-section"><div><p>PRODUCT DETAILS</p><h2>Live product information.</h2></div><ul>{product.specs.map((spec, index) => <li key={`${spec}-${index}`}><span>✓</span>{spec}</li>)}</ul></section>{related.length > 0 && <section className="related-products"><div className="section-heading-row"><div><p>Continue sourcing</p><h2>Related building materials</h2><span>More live products from the same construction category.</span></div><a className="view-all" href={`/categories/${product.categorySlug}`}>View category <span>→</span></a></div><div className="products-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}</main>;
}
