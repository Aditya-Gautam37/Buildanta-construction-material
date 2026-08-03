"use client";

import { useState } from "react";
import { availabilityLabel, type StoreProduct } from "./live-catalog";

export function ProductDetailClient({ product }: { product: StoreProduct }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [variantId, setVariantId] = useState(product.variants[0]?.id || "");
  const variant = product.variants.find((item) => item.id === variantId) || product.variants[0];
  const images = product.images.length ? product.images : product.image ? [{ src: product.image, alt: product.imageAlt }] : [];
  const price = variant?.price || product.price;
  const unit = variant?.unit || product.unit;
  const availability = variant?.availableStock == null ? availabilityLabel(product) : variant.availableStock > 0 ? `${variant.availableStock} ${unit} available` : "Available for enquiry";

  return <section className="product-detail">
    <div className="product-gallery"><div className={`product-detail-visual ${images.length ? "has-image" : ""}`}><span>{product.brand}</span>{images[imageIndex] ? <img src={images[imageIndex].src} alt={images[imageIndex].alt} /> : <b>{product.category.split(" ")[0]}</b>}</div>{images.length > 1 && <div className="product-thumbnails" aria-label="Product images">{images.map((image, index) => <button key={`${image.src}-${index}`} className={index === imageIndex ? "active" : ""} onClick={() => setImageIndex(index)} aria-label={`View image ${index + 1}`}><img src={image.src} alt="" /></button>)}</div>}</div>
    <div className="product-detail-copy"><p>{product.brand} · {product.category}</p><h1>{product.name}</h1><p className="detail-description">{product.description}</p>{product.variants.length > 0 && <label className="variant-selector"><span>Choose variant</span><select value={variantId} onChange={(event) => setVariantId(event.target.value)}>{product.variants.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.sku}</option>)}</select></label>}<div className="price-box"><span>{price > 0 ? "Indicative demonstration price" : "Pricing"}</span><strong>{price > 0 ? `₹${price.toLocaleString("en-IN")}` : "Request latest price"}</strong>{price > 0 && <small> / {unit}</small>}{product.bulkPrice != null && <em>Indicative bulk price: ₹{product.bulkPrice.toLocaleString("en-IN")} / {product.unit}</em>}</div><p className={`availability ${product.availability === "LOW_STOCK" || product.availability === "OUT_OF_STOCK" ? "limited" : ""}`}><i /> {availability}</p><dl className="product-facts"><div><dt>SKU</dt><dd>{variant?.sku || product.sku}</dd></div><div><dt>Minimum order</dt><dd>{product.minimumOrderQuantity} {product.unit}</dd></div><div><dt>GST</dt><dd>{product.gstPercent == null ? "Confirmed in quotation" : `${product.gstPercent}%`}</dd></div><div><dt>Supplier</dt><dd>{product.supplier || "Confirmed with quotation"}</dd></div></dl><p className="detail-description">{product.deliveryInfo || "Delivery confirmed after PIN-code review."} GST and transportation are confirmed in the quotation.</p><a className="button orange wide" href={`/bulk-quotes?product=${encodeURIComponent(product.name)}`}>Request latest price <span>→</span></a><small>Final pricing depends on quantity, delivery location and supplier availability.</small></div>
  </section>;
}
