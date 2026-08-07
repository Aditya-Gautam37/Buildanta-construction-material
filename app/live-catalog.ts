import { cache } from "react";
import {
  brands as fallbackBrandNames,
  categories as fallbackCategories,
  rooms as fallbackRooms,
  slugify,
  stages as fallbackStages,
} from "./data";

const DEFAULT_API_URL = process.env.NODE_ENV === "development"
  ? "http://localhost:5173"
  : "https://buildanta-api.vercel.app";

type ApiTreeNode = { id: string; name: string; slug: string; parentId: string | null; description?: string | null; imageUrl?: string | null; icon?: string | null; sortOrder?: number; featured?: boolean; published?: boolean; seoTitle?: string | null; seoDescription?: string | null; _count?: { children: number; products: number } };
type ApiBrand = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  website?: string | null;
};
export type PublicAvailability = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "ENQUIRY";
export type PurchaseMode = "DIRECT_ONLY" | "QUOTE_ONLY" | "DIRECT_AND_QUOTE";
type ApiProduct = {
  id: string;
  name: string;
  brand: string;
  description?: string | null;
  unit?: string;
  minimumOrderQuantity?: number;
  sellingPrice?: number | string;
  bulkPrice?: number | string | null;
  gstPercent?: number | string | null;
  deliveryInfo?: string | null;
  keySpecifications?: string[];
  stage?: string[];
  room?: string[];
  updatedAt: string;
  availabilityStatus?: PublicAvailability;
  categories?: { id?: string; name: string; slug?: string }[];
  variants?: { sku: string; price: number | string; unit?: string; availabilityStatus?: PublicAvailability }[];
  images?: { id?: string; src: string; alt?: string; sortOrder?: number; primary?: boolean }[];
};
type ApiVariant = {
  id: string;
  productId: string;
  sku: string;
  price?: number | string | null;
  unit?: string;
  minimumOrderQuantity?: number;
  availabilityStatus?: PublicAvailability;
  attributes?: unknown;
  product?: { id: string; name: string };
  images?: { id?: string; src: string; alt?: string; sortOrder?: number; primary?: boolean }[];
  purchaseMode?: PurchaseMode;
  maxDirectQuantity?: number | null;
  bulkQuoteThreshold?: number | null;
  quantityIncrement?: number;
};

export type CatalogNode = { id: string; name: string; slug: string; parentId: string | null; description: string | null; imageUrl: string | null; icon: string | null; sortOrder: number; featured: boolean; published: boolean; seoTitle: string | null; seoDescription: string | null; childCount: number; productCount: number };
export type CatalogBrand = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  website: string | null;
};
export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categories: string[];
  category: string;
  categorySlug: string;
  stages: string[];
  rooms: string[];
  unit: string;
  price: number;
  bulkPrice: number | null;
  description: string;
  specs: string[];
  image: string | null;
  imageAlt: string;
  images: { src: string; alt: string }[];
  variants: { id: string; sku: string; label: string; price: number; unit: string; availability: PublicAvailability; attributes: Record<string, string>; purchaseMode: PurchaseMode; minimumOrderQuantity: number; maxDirectQuantity: number | null; bulkQuoteThreshold: number | null; quantityIncrement: number }[];
  sku: string;
  availability: PublicAvailability;
  minimumOrderQuantity: number;
  gstPercent: number | null;
  deliveryInfo: string | null;
  updatedAt: string;
};
export type CatalogSnapshot = {
  products: StoreProduct[];
  categories: CatalogNode[];
  stages: CatalogNode[];
  rooms: CatalogNode[];
  brands: CatalogBrand[];
  source: "inventory" | "fallback";
};

function apiUrl(path: string) {
  return `${(process.env.INVENTORY_API_URL || DEFAULT_API_URL).replace(/\/$/, "")}/${path}`;
}

async function fetchCollection<T>(path: string): Promise<T[]> {
  const response = await fetch(apiUrl(path), { cache: "no-store", headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Inventory API ${path} returned ${response.status}.`);
  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) throw new Error(`Inventory API ${path} returned an invalid collection.`);
  return payload as T[];
}

function expandWithAncestors(names: string[], nodes: CatalogNode[]) {
  const nodesByName = new Map(nodes.map((node) => [node.name, node]));
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const expanded = new Set<string>();
  for (const name of names) {
    let current = nodesByName.get(name);
    expanded.add(name);
    while (current?.parentId) {
      const parent = nodesById.get(current.parentId);
      if (!parent) break;
      expanded.add(parent.name);
      current = parent;
    }
  }
  return [...expanded];
}

function priceNumber(value: number | string | null | undefined) {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function attributeUnit(attributes: unknown) {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) return null;
  const record = attributes as Record<string, unknown>;
  for (const key of ["unit", "size", "packSize", "pack_size"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function aggregateAvailability(statuses: Array<PublicAvailability | undefined>): PublicAvailability {
  if (statuses.includes("IN_STOCK")) return "IN_STOCK";
  if (statuses.includes("LOW_STOCK")) return "LOW_STOCK";
  if (statuses.includes("OUT_OF_STOCK")) return "OUT_OF_STOCK";
  return "ENQUIRY";
}

export function mapProducts(products: ApiProduct[], variants: ApiVariant[], categories: CatalogNode[], stages: CatalogNode[], rooms: CatalogNode[]) {
  const variantsByProduct = new Map<string, ApiVariant[]>();
  for (const variant of variants) {
    const current = variantsByProduct.get(variant.productId) || [];
    current.push(variant);
    variantsByProduct.set(variant.productId, current);
  }

  return products.map<StoreProduct>((product) => {
    const detailedVariants = variantsByProduct.get(product.id) || [];
    const firstDetailedVariant = detailedVariants[0];
    const firstSummaryVariant = product.variants?.[0];
    const rawCategories = (product.categories || []).map((item) => item.name);
    const categoryNames = expandWithAncestors(rawCategories, categories);
    const stageNames = expandWithAncestors(product.stage || [], stages);
    const roomNames = expandWithAncestors(product.room || [], rooms);
    const primaryCategory = rawCategories[0] || categoryNames[0] || "Construction Materials";
    const categoryNode = categories.find((item) => item.name === primaryCategory);
    const images = [...(product.images || []), ...detailedVariants.flatMap((variant) => variant.images || [])]
      .filter((image, index, all) => all.findIndex((candidate) => candidate.src === image.src) === index)
      .sort((a,b) => Number(Boolean(b.primary))-Number(Boolean(a.primary)) || (a.sortOrder ?? 0)-(b.sortOrder ?? 0));
    const image = images[0];
    const price = priceNumber(firstDetailedVariant?.price ?? firstSummaryVariant?.price);
    const sku = firstDetailedVariant?.sku || firstSummaryVariant?.sku || "Made to order";
    const specs = (product.keySpecifications || []).filter(Boolean);
    const availability = product.availabilityStatus ?? aggregateAvailability([
      ...detailedVariants.map((variant) => variant.availabilityStatus),
      ...(product.variants || []).map((variant) => variant.availabilityStatus),
    ]);
    const gstPercent = product.gstPercent == null ? null : priceNumber(product.gstPercent);

    return {
      id: product.id,
      slug: slugify(product.name),
      name: product.name,
      brand: product.brand,
      categories: categoryNames,
      category: primaryCategory,
      categorySlug: categoryNode?.slug || slugify(primaryCategory),
      stages: stageNames,
      rooms: roomNames,
      unit: firstDetailedVariant?.unit || firstSummaryVariant?.unit || product.unit || attributeUnit(firstDetailedVariant?.attributes) || "unit",
      price: price || priceNumber(product.sellingPrice),
      bulkPrice: product.bulkPrice == null ? null : priceNumber(product.bulkPrice),
      description: product.description?.trim() || (specs.length > 0 ? specs.join(" / ") : `${product.name} by ${product.brand}, available for project pricing and fulfilment confirmation.`),
      specs: specs.length > 0 ? specs : [`SKU: ${sku}`, "Supply confirmed with quotation"],
      image: image?.src || null,
      imageAlt: image?.alt || product.name,
      images: images.length ? images.map((item)=>({src:item.src,alt:item.alt||product.name})) : [],
      variants: detailedVariants.map((variant) => {
        const record = variant.attributes && typeof variant.attributes === "object" && !Array.isArray(variant.attributes) ? variant.attributes as Record<string, unknown> : {};
        const attributes = Object.fromEntries(Object.entries(record).flatMap(([key,value]) => typeof value === "string" || typeof value === "number" ? [[key,String(value)]] : []));
        return {
          id:variant.id, sku:variant.sku, label:Object.values(attributes).join(" / ") || variant.sku, price:priceNumber(variant.price) || priceNumber(product.sellingPrice), unit:variant.unit || product.unit || "unit", availability:variant.availabilityStatus || "ENQUIRY", attributes,
          purchaseMode: variant.purchaseMode || "QUOTE_ONLY",
          minimumOrderQuantity: variant.minimumOrderQuantity ?? 1,
          maxDirectQuantity: variant.maxDirectQuantity ?? null,
          bulkQuoteThreshold: variant.bulkQuoteThreshold ?? null,
          quantityIncrement: variant.quantityIncrement ?? 1,
        };
      }),
      sku,
      availability,
      minimumOrderQuantity: product.minimumOrderQuantity ?? 1,
      gstPercent,
      deliveryInfo: product.deliveryInfo?.trim() || null,
      updatedAt: product.updatedAt,
    };
  });
}

export function fallbackSnapshot(): CatalogSnapshot {
  const node = (id:string,name:string,slug:string):CatalogNode => ({ id,name,slug,parentId:null,description:null,imageUrl:null,icon:null,sortOrder:0,featured:false,published:true,seoTitle:null,seoDescription:null,childCount:0,productCount:0 });
  const categories: CatalogNode[] = fallbackCategories.map((item, index) => node(`fallback-category-${index}`,item.name,item.slug));
  const stages: CatalogNode[] = fallbackStages.map(([, name], index) => node(`fallback-stage-${index}`,name,slugify(name)));
  const rooms: CatalogNode[] = fallbackRooms.map((item, index) => node(`fallback-room-${index}`,item.name,slugify(item.name)));

  return {
    source: "fallback",
    categories,
    stages,
    rooms,
    brands: fallbackBrandNames.map((name, index) => ({ id: `fallback-brand-${index}`, name, slug: slugify(name), logo: null, description: null, website: null })),
    products: [],
  };
}

export const getCatalogSnapshot = cache(async (): Promise<CatalogSnapshot> => {
  try {
    const [products, categories, stages, rooms, brands, variants] = await Promise.all([
      fetchCollection<ApiProduct>("products"),
      fetchCollection<ApiTreeNode>("categories"),
      fetchCollection<ApiTreeNode>("stages"),
      fetchCollection<ApiTreeNode>("rooms"),
      fetchCollection<ApiBrand>("brands"),
      fetchCollection<ApiVariant>("product-variants"),
    ]);
    const normalize = (item:ApiTreeNode):CatalogNode => ({id:item.id,name:item.name,slug:item.slug,parentId:item.parentId??null,description:item.description??null,imageUrl:item.imageUrl??null,icon:item.icon??null,sortOrder:item.sortOrder??0,featured:item.featured??false,published:item.published??true,seoTitle:item.seoTitle??null,seoDescription:item.seoDescription??null,childCount:item._count?.children??0,productCount:item._count?.products??0});
    const normalizedCategories = categories.map(normalize).sort((a,b)=>a.sortOrder-b.sortOrder||a.name.localeCompare(b.name));
    const normalizedStages = stages.map(normalize);
    const normalizedRooms = rooms.map(normalize);

    return {
      source: "inventory",
      categories: normalizedCategories,
      stages: normalizedStages,
      rooms: normalizedRooms,
      brands: brands.map((item) => ({ id: item.id, name: item.name, slug: item.slug, logo: item.logo || null, description: item.description || null, website: item.website || null })),
      products: mapProducts(products, variants, normalizedCategories, normalizedStages, normalizedRooms),
    };
  } catch (error) {
    console.error("Live inventory catalogue unavailable; using the storefront fallback.", error);
    return fallbackSnapshot();
  }
});

export function rootNodes(nodes: CatalogNode[]) {
  return nodes.filter((node) => !node.parentId);
}

export function childrenOf(nodes: CatalogNode[], parentId: string) {
  return nodes.filter((node) => node.parentId === parentId);
}

export function availabilityLabel(product: StoreProduct) {
  return availabilityStatusLabel(product.availability);
}

export function availabilityStatusLabel(status: PublicAvailability) {
  if (status === "IN_STOCK") return "In stock";
  if (status === "LOW_STOCK") return "Limited stock";
  if (status === "OUT_OF_STOCK") return "Request availability";
  return "Available for enquiry";
}
