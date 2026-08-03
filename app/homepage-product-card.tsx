import { availabilityLabel, type StoreProduct } from "./live-catalog";

export function HomepageProductCard({ product, badge }: { product: StoreProduct; badge?: string | null }) {
  return <article className="product-card homepage-product-card">
    <a className={`product-visual ${product.image ? "has-image" : ""}`} href={`/products/${product.slug}`}><span className="product-brand">{badge || product.brand}</span>{product.image ? <img src={product.image} alt={product.imageAlt} loading="lazy" /> : <b>{product.category.split(" ")[0]}</b>}<i>{availabilityLabel(product)}</i></a>
    <div className="product-body"><p>{product.brand} · {product.unit}</p><a href={`/products/${product.slug}`}><h2>{product.name}</h2></a><p className="product-description">{product.description}</p><div><span>{product.price > 0 ? <>From <strong>₹{product.price.toLocaleString("en-IN")}</strong></> : <strong>Project pricing</strong>}</span><a className="small-quote" href={`/bulk-quotes?product=${encodeURIComponent(product.name)}`}>Get quote</a></div></div>
  </article>;
}
