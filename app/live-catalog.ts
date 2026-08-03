import { cache } from "react";
import {
  brands as fallbackBrandNames,
  categories as fallbackCategories,
  products as fallbackProducts,
  rooms as fallbackRooms,
  slugify,
  stages as fallbackStages,
} from "./data";

const DEFAULT_API_URL = process.env.NODE_ENV === "development"
  ? "http://localhost:5173"
  : "https://buildanta-monorepo-nest-api.vercel.app";

type ApiTreeNode = { id: string; name: string; slug: string; parentId: string | null; description?: string | null; imageUrl?: string | null; icon?: string | null; sortOrder?: number; featured?: boolean; published?: boolean; seoTitle?: string | null; seoDescription?: string | null; _count?: { children: number; products: number } };
type ApiBrand = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  website?: string | null;
};
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
  categories?: { id?: string; name: string; slug?: string }[];
  variants?: { sku: string; price: number | string; unit?: string; stockQuantity?: number; reservedQuantity?: number; lowStockThreshold?: number; stockTracked?: boolean; supplier?: { name: string } | null }[];
};
type ApiVariant = {
  id: string;
  productId: string;
  supplierId: string;
  sku: string;
  price?: number | string | null;
  unit?: string;
  stockQuantity?: number;
  reservedQuantity?: number;
  lowStockThreshold?: number;
  stockTracked?: boolean;
  attributes?: unknown;
  product?: { id: string; name: string };
  supplier?: { id: string; name: string };
  images?: { id?: string; src: string; alt?: string; sortOrder?: number; primary?: boolean }[];
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
  variants: { id: string; sku: string; label: string; price: number; unit: string; availableStock: number | null; attributes: Record<string, string> }[];
  sku: string;
  supplier: string | null;
  availability: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "ENQUIRY";
  availableStock: number | null;
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

function mapProducts(products: ApiProduct[], variants: ApiVariant[], categories: CatalogNode[], stages: CatalogNode[], rooms: CatalogNode[]) {
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
    const images = detailedVariants.flatMap((variant) => variant.images || []).sort((a,b) => Number(Boolean(b.primary))-Number(Boolean(a.primary)) || (a.sortOrder ?? 0)-(b.sortOrder ?? 0));
    const image = images[0];
    const price = priceNumber(firstDetailedVariant?.price ?? firstSummaryVariant?.price);
    const sku = firstDetailedVariant?.sku || firstSummaryVariant?.sku || "Made to order";
    const supplier = firstDetailedVariant?.supplier?.name || firstSummaryVariant?.supplier?.name || null;
    const specs = (product.keySpecifications || []).filter(Boolean);
    const stockVariants = detailedVariants.length > 0 ? detailedVariants : (product.variants || []);
    const trackedVariants = stockVariants.filter((variant) => variant.stockTracked);
    const availableStock = trackedVariants.length
      ? trackedVariants.reduce((sum, variant) => sum + (variant.stockQuantity ?? 0) - (variant.reservedQuantity ?? 0), 0)
      : null;
    const lowStockThreshold = trackedVariants.reduce((sum, variant) => sum + (variant.lowStockThreshold ?? 0), 0);
    const availability: StoreProduct["availability"] = availableStock == null
      ? "ENQUIRY"
      : availableStock <= 0
        ? "OUT_OF_STOCK"
        : availableStock <= lowStockThreshold
          ? "LOW_STOCK"
          : "IN_STOCK";
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
      description: product.description?.trim() || (specs.length > 0 ? specs.join(" · ") : `${product.name} by ${product.brand}, available for project pricing and supplier enquiry.`),
      specs: specs.length > 0 ? specs : [`SKU: ${sku}`, supplier ? `Supplier: ${supplier}` : "Supplier quote available"],
      image: image?.src || null,
      imageAlt: image?.alt || product.name,
      images: images.length ? images.map((item)=>({src:item.src,alt:item.alt||product.name})) : [],
      variants: detailedVariants.map((variant) => {
        const record = variant.attributes && typeof variant.attributes === "object" && !Array.isArray(variant.attributes) ? variant.attributes as Record<string, unknown> : {};
        const attributes = Object.fromEntries(Object.entries(record).flatMap(([key,value]) => typeof value === "string" || typeof value === "number" ? [[key,String(value)]] : []));
        const available = variant.stockTracked ? (variant.stockQuantity ?? 0) - (variant.reservedQuantity ?? 0) : null;
        return { id:variant.id, sku:variant.sku, label:Object.values(attributes).join(" / ") || variant.sku, price:priceNumber(variant.price) || priceNumber(product.sellingPrice), unit:variant.unit || product.unit || "unit", availableStock:available, attributes };
      }),
      sku,
      supplier,
      availability,
      availableStock,
      minimumOrderQuantity: product.minimumOrderQuantity ?? 1,
      gstPercent,
      deliveryInfo: product.deliveryInfo?.trim() || null,
      updatedAt: product.updatedAt,
    };
  });
}

function fallbackSnapshot(): CatalogSnapshot {
  const node = (id:string,name:string,slug:string):CatalogNode => ({ id,name,slug,parentId:null,description:null,imageUrl:null,icon:null,sortOrder:0,featured:false,published:true,seoTitle:null,seoDescription:null,childCount:0,productCount:0 });
  const fallbackImageByCategory: Record<string,string> = {
    "Cement & Structure": "/demo/products/real/cement.jpg",
    "Steel & TMT": "/demo/products/real/steel.jpg",
    Waterproofing: "/demo/products/real/waterproofing.jpg",
    Electrical: "/demo/products/real/electrical.jpg",
    "Sanitaryware & Bathware": "/demo/products/real/bath.jpg",
    "Doors & Windows": "/demo/products/real/openings.jpg",
    "False Ceiling & Drywall": "/demo/products/real/ceiling.jpg",
    "Tiles & Flooring": "/demo/products/real/tiles.jpg",
    Paints: "/demo/products/real/paint.jpg",
  };
  const categories: CatalogNode[] = fallbackCategories.map((item, index) => node(`fallback-category-${index}`,item.name,item.slug));
  const stages: CatalogNode[] = fallbackStages.map(([, name], index) => node(`fallback-stage-${index}`,name,slugify(name)));
  const rooms: CatalogNode[] = fallbackRooms.map((item, index) => node(`fallback-room-${index}`,item.name,slugify(item.name)));

  return {
    source: "fallback",
    categories,
    stages,
    rooms,
    brands: fallbackBrandNames.map((name, index) => ({ id: `fallback-brand-${index}`, name, slug: slugify(name), logo: null, description: null, website: null })),
    products: fallbackProducts.map((product, index) => ({
      id: `fallback-product-${index}`,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      categories: [product.category],
      category: product.category,
      categorySlug: product.categorySlug,
      stages: [product.stage],
      rooms: [...product.room],
      unit: product.unit,
      price: product.price,
      bulkPrice: null,
      description: product.description,
      specs: product.specs,
      image: fallbackImageByCategory[product.category] || null,
      imageAlt: product.name,
      images: fallbackImageByCategory[product.category] ? [{ src:fallbackImageByCategory[product.category], alt:product.name }] : [],
      variants: [],
      sku: "Catalogue item",
      supplier: null,
      availability: "ENQUIRY",
      availableStock: null,
      minimumOrderQuantity: 1,
      gstPercent: null,
      deliveryInfo: null,
      updatedAt: new Date(0).toISOString(),
    })),
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
  if (product.availability === "IN_STOCK") return "In stock";
  if (product.availability === "LOW_STOCK") return "Limited stock";
  if (product.availability === "OUT_OF_STOCK") return "Request availability";
  return "Available for enquiry";
}
