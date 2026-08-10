"use client";

import Image from "next/image";
import type { SyntheticEvent } from "react";
import { AddToCartButton } from "./cart/add-to-cart-button";
import { availabilityLabel, availabilityStatusLabel, type PublicAvailability, type StoreProduct } from "./live-catalog";

export type ProductCardLocation = {
  availabilityStatus: PublicAvailability;
  leadTimeLabel: string;
  fulfilmentMode: string;
};

export type ProductCardAction =
  | { kind: "add"; variant: StoreProduct["variants"][number] }
  | { kind: "choose" }
  | { kind: "unavailable" }
  | { kind: "quote" };

function canPurchase(status: PublicAvailability) {
  return status === "IN_STOCK" || status === "LOW_STOCK";
}

export function resolveProductCardAction(product: StoreProduct, effectiveAvailability: PublicAvailability = product.availability): ProductCardAction {
  const directVariants = product.variants.filter((variant) => variant.purchaseMode !== "QUOTE_ONLY" && variant.price > 0);
  const purchasableVariants = canPurchase(effectiveAvailability)
    ? directVariants.filter((variant) => canPurchase(variant.availability))
    : [];

  if (purchasableVariants.length === 1) return { kind: "add", variant: purchasableVariants[0] };
  if (purchasableVariants.length > 1) return { kind: "choose" };
  if (directVariants.length > 0) return { kind: "unavailable" };
  return { kind: "quote" };
}

export function productImageFallback(product: Pick<StoreProduct, "name" | "category">) {
  const label = `${product.name} ${product.category}`.toLowerCase();
  if (/(paint|putty|finish)/.test(label)) return "/demo/products/real/paint.jpg";
  if (/(tile|floor)/.test(label)) return "/demo/products/real/tiles.jpg";
  if (/(bath|sanitary|plumb|faucet)/.test(label)) return "/demo/products/real/bath.jpg";
  if (/(electric|wire|switch|light)/.test(label)) return "/demo/products/real/electrical.jpg";
  if (/(steel|tmt|rebar|binding)/.test(label)) return "/demo/products/real/steel.jpg";
  if (/(waterproof|chemical)/.test(label)) return "/demo/products/real/waterproofing.jpg";
  if (/(door|window|glass|opening)/.test(label)) return "/demo/products/real/openings.jpg";
  if (/(ceiling|gypsum|drywall)/.test(label)) return "/demo/products/real/ceiling.jpg";
  return "/demo/products/real/cement.jpg";
}

export function recoverProductImage(event: SyntheticEvent<HTMLImageElement>, fallback: string) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied) return;
  image.dataset.fallbackApplied = "true";
  image.src = fallback;
}

function deliveryNote(location: ProductCardLocation) {
  const source = location.fulfilmentMode === "PARTNER_STOCK"
    ? "Available from partner"
    : location.fulfilmentMode === "ON_REQUEST"
      ? "Available on request"
      : "Buildanta stock";
  return `${source}. ${location.leadTimeLabel}.`;
}

export function ProductCard({ product, location, badge, pricePrefix = "Indicative", homepage = false }: {
  product: StoreProduct;
  location?: ProductCardLocation;
  badge?: string | null;
  pricePrefix?: "Indicative" | "From";
  homepage?: boolean;
}) {
  const effectiveAvailability = location?.availabilityStatus ?? product.availability;
  const availability = location ? availabilityStatusLabel(location.availabilityStatus) : availabilityLabel(product);
  const action = resolveProductCardAction(product, effectiveAvailability);
  const productHref = `/products/${product.slug}`;
  const quoteHref = `/bulk-quotes?product=${encodeURIComponent(product.name)}`;
  const titleId = `product-${product.id}-title`;
  const cardClassName = `product-card${homepage ? " homepage-product-card" : ""}`;

  return <article className={cardClassName} aria-labelledby={titleId}>
    <a className={`product-visual ${product.image ? "has-image" : ""}`} href={productHref} aria-label={`View ${product.name}`}>
      <span className="product-brand">{badge || product.brand}</span>
      {product.image
        ? <Image src={product.image} alt={product.imageAlt || product.name} fill sizes="(max-width: 760px) calc(100vw - 32px), (max-width: 1180px) 50vw, 25vw" unoptimized onError={(event) => recoverProductImage(event, productImageFallback(product))} />
        : <b>{product.category.split(" ")[0]}</b>}
      <i className={`availability-${effectiveAvailability.toLowerCase().replaceAll("_", "-")}`}>{availability}</i>
    </a>
    <div className="product-body">
      <p>{product.brand} / {product.unit}</p>
      <a href={productHref} title={product.name}><h2 id={titleId}>{product.name}</h2></a>
      <p className="product-description">{product.description}</p>
      {location && <small className="location-product-note">{deliveryNote(location)}</small>}
      {!location && product.deliveryInfo && <small className="location-product-note">{product.deliveryInfo}</small>}
      <div className="product-card-footer">
        <span className="product-card-price">{product.price > 0 ? <>{pricePrefix} <strong>₹{product.price.toLocaleString("en-IN")}</strong><small> / {product.unit}</small></> : <strong>Request latest price</strong>}</span>
        <div className="product-card-actions">
          {action.kind === "add" && <AddToCartButton variantId={action.variant.id} minimumOrderQuantity={action.variant.minimumOrderQuantity} compact productName={product.name} />}
          {action.kind === "choose" && <a className="product-card-primary-link" href={productHref}>Choose options</a>}
          {action.kind === "unavailable" && <button className="product-card-unavailable" type="button" disabled>Unavailable</button>}
          <a className={`small-quote${action.kind === "quote" ? " product-card-primary-link" : " product-card-secondary-link"}`} href={quoteHref}>Get quote</a>
        </div>
      </div>
    </div>
  </article>;
}
