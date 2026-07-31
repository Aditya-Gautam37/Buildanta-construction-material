import { notFound } from "next/navigation";
import { getCatalogSnapshot } from "../../live-catalog";

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, catalog] = await Promise.all([params, getCatalogSnapshot()]);
  const product = catalog.products.find((item) => item.slug === slug);
  if (!product) notFound();

  return <main className="product-page"><div className="breadcrumbs"><a href="/">Home</a><span>›</span><a href={`/categories/${product.categorySlug}`}>{product.category}</a><span>›</span>{product.name}</div>
    <section className="product-detail"><div className={`product-detail-visual ${product.image ? "has-image" : ""}`}><span>{product.brand}</span>{product.image ? <img src={product.image} alt={product.imageAlt} /> : <b>{product.category.split(" ")[0]}</b>}</div><div className="product-detail-copy"><p>{product.brand} · {product.category}</p><h1>{product.name}</h1><p className="detail-description">{product.description}</p><div className="price-box"><span>{product.price > 0 ? "Indicative price" : "Pricing"}</span><strong>{product.price > 0 ? `₹${product.price.toLocaleString("en-IN")}` : "Request a quote"}</strong>{product.price > 0 && <small> / {product.unit}</small>}</div><p className="availability"><i /> Available for supplier enquiry{product.supplier ? ` · ${product.supplier}` : ""}</p><a className="button orange wide" href={`/bulk-quotes?product=${encodeURIComponent(product.name)}`}>Request best quote <span>→</span></a><small>Final pricing depends on quantity, delivery location and supplier availability.</small></div></section>
    <section className="spec-section"><div><p>PRODUCT DETAILS</p><h2>Live product information.</h2></div><ul>{product.specs.map((spec) => <li key={spec}><span>✓</span>{spec}</li>)}</ul></section>
  </main>;
}
