import { notFound } from "next/navigation";
import { products } from "../../data";

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();
  return <main className="product-page"><div className="breadcrumbs"><a href="/">Home</a><span>›</span><a href={`/categories/${product.categorySlug}`}>{product.category}</a><span>›</span>{product.name}</div>
    <section className="product-detail"><div className={`product-detail-visual ${product.tone}`}><span>{product.brand}</span><b>{product.category.split(" ")[0]}</b></div><div className="product-detail-copy"><p>{product.brand} · {product.category}</p><h1>{product.name}</h1><p className="detail-description">{product.description}</p><div className="price-box"><span>Indicative price</span><strong>₹{product.price.toLocaleString("en-IN")}</strong><small> / {product.unit}</small></div><p className={product.stock > 20 ? "availability" : "availability limited"}><i /> {product.stock > 20 ? "Available for enquiry" : "Limited availability"} · {product.stock} units listed</p><a className="button orange wide" href={`/bulk-quotes?product=${encodeURIComponent(product.name)}`}>Request best quote <span>→</span></a><small>Final pricing depends on quantity, delivery location and availability.</small></div></section>
    <section className="spec-section"><div><p>PRODUCT DETAILS</p><h2>Built for dependable results.</h2></div><ul>{product.specs.map((spec) => <li key={spec}><span>✓</span>{spec}</li>)}</ul></section>
  </main>;
}
