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

type ApiTreeNode = { id: string; name: string; slug: string; parentId: string | null };
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
  categories?: { name: string }[];
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
  images?: { id?: string; src: string; alt?: string }[];
};

export type CatalogNode = { id: string; name: string; slug: string; parentId: string | null };
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
  description: string;
  specs: string[];
  image: string | null;
  imageAlt: string;
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
    const image = detailedVariants.flatMap((variant) => variant.images || [])[0];
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
      description: product.description?.trim() || (specs.length > 0 ? specs.join(" · ") : `${product.name} by ${product.brand}, available for project pricing and supplier enquiry.`),
      specs: specs.length > 0 ? specs : [`SKU: ${sku}`, supplier ? `Supplier: ${supplier}` : "Supplier quote available"],
      image: image?.src || null,
      imageAlt: image?.alt || product.name,
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
  const categories: CatalogNode[] = fallbackCategories.map((item, index) => ({ id: `fallback-category-${index}`, name: item.name, slug: item.slug, parentId: null }));
  const stages: CatalogNode[] = fallbackStages.map(([, name], index) => ({ id: `fallback-stage-${index}`, name, slug: slugify(name), parentId: null }));
  const rooms: CatalogNode[] = fallbackRooms.map((item, index) => ({ id: `fallback-room-${index}`, name: item.name, slug: slugify(item.name), parentId: null }));

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
      description: product.description,
      specs: product.specs,
      image: null,
      imageAlt: product.name,
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
    const normalizedCategories = categories.map((item) => ({ ...item, parentId: item.parentId ?? null }));
    const normalizedStages = stages.map((item) => ({ ...item, parentId: item.parentId ?? null }));
    const normalizedRooms = rooms.map((item) => ({ ...item, parentId: item.parentId ?? null }));

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
