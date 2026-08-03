import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { availabilityLabel, getCatalogSnapshot } from "../../live-catalog";
import { ProductCard } from "../../product-browser";

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const [{ slug }, catalog] = await Promise.all([params, getCatalogSnapshot()]);
  const product = catalog.products.find((item) => item.slug === slug);
  if (!product) return {};
  const description = product.description.slice(0, 155);
  return {
    title: product.name,
    description,
    openGraph: { title: `${product.name} | Buildanta`, description, images: product.image ? [{ url: product.image, alt: product.imageAlt }] : undefined },
  };
}

export default async function ProductDetail({ params }: ProductPageProps) {
  const [{ slug }, catalog] = await Promise.all([params, getCatalogSnapshot()]);
  const product = catalog.products.find((item) => item.slug === slug);
  if (!product) notFound();
  const related = catalog.products.filter((item) => item.id !== product.id && item.categories.some((category) => product.categories.includes(category))).slice(0, 4);

  return <main className="product-page"><div className="breadcrumbs"><a href="/">Home</a><span>›</span><a href={`/categories/${product.categorySlug}`}>{product.category}</a><span>›</span>{product.name}</div>
    <section className="product-detail"><div className={`product-detail-visual ${product.image ? "has-image" : ""}`}><span>{product.brand}</span>{product.image ? <img src={product.image} alt={product.imageAlt} /> : <b>{product.category.split(" ")[0]}</b>}</div><div className="product-detail-copy"><p>{product.brand} · {product.category}</p><h1>{product.name}</h1><p className="detail-description">{product.description}</p><div className="price-box"><span>{product.price > 0 ? "Latest indicative price" : "Pricing"}</span><strong>{product.price > 0 ? `₹${product.price.toLocaleString("en-IN")}` : "Request latest price"}</strong>{product.price > 0 && <small> / {product.unit}</small>}</div><p className={`availability ${product.availability === "LOW_STOCK" || product.availability === "OUT_OF_STOCK" ? "limited" : ""}`}><i /> {availabilityLabel(product)}{product.supplier ? ` · ${product.supplier}` : ""}</p><p className="detail-description">Minimum order: {product.minimumOrderQuantity} {product.unit}. {product.gstPercent == null ? "GST will be confirmed in the quotation." : `GST: ${product.gstPercent}%.`} {product.deliveryInfo || "Delivery is confirmed after PIN-code review."}</p><a className="button orange wide" href={`/bulk-quotes?product=${encodeURIComponent(product.name)}`}>Request best quote <span>→</span></a><small>Final pricing depends on quantity, delivery location and supplier availability.</small></div></section>
    <section className="spec-section"><div><p>PRODUCT DETAILS</p><h2>Live product information.</h2></div><ul>{product.specs.map((spec, index) => <li key={`${spec}-${index}`}><span>✓</span>{spec}</li>)}</ul></section>
    {related.length > 0 && <section className="related-products"><div className="section-heading-row"><div><p>Continue sourcing</p><h2>Related building materials</h2><span>More live products from the same construction category.</span></div><a className="view-all" href={`/categories/${product.categorySlug}`}>View category <span>→</span></a></div><div className="products-grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}
  </main>;
}
