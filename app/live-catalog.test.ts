import { afterEach, describe, expect, it, vi } from "vitest";
import {
  availabilityLabel,
  childrenOf,
  fallbackSnapshot,
  getCatalogSnapshot,
  mapProducts,
  rootNodes,
  type CatalogNode,
  type StoreProduct,
} from "./live-catalog";

const node = (overrides: Partial<CatalogNode> = {}): CatalogNode => ({
  id: "cat-1",
  name: "Cement",
  slug: "cement",
  parentId: null,
  description: null,
  imageUrl: null,
  icon: null,
  sortOrder: 0,
  featured: false,
  published: true,
  seoTitle: null,
  seoDescription: null,
  childCount: 0,
  productCount: 0,
  ...overrides,
});

describe("rootNodes / childrenOf", () => {
  it("splits a flat node list into roots and children by parentId", () => {
    const nodes = [
      node({ id: "root", parentId: null }),
      node({ id: "child-1", parentId: "root" }),
      node({ id: "child-2", parentId: "root" }),
      node({ id: "other-root", parentId: null }),
    ];

    expect(rootNodes(nodes).map((item) => item.id)).toEqual(["root", "other-root"]);
    expect(childrenOf(nodes, "root").map((item) => item.id)).toEqual(["child-1", "child-2"]);
    expect(childrenOf(nodes, "missing")).toEqual([]);
  });
});

describe("availabilityLabel", () => {
  const product = (availability: StoreProduct["availability"]) => ({ availability }) as StoreProduct;

  it("maps every availability status to a customer-facing label", () => {
    expect(availabilityLabel(product("IN_STOCK"))).toBe("In stock");
    expect(availabilityLabel(product("LOW_STOCK"))).toBe("Limited stock");
    expect(availabilityLabel(product("OUT_OF_STOCK"))).toBe("Request availability");
    expect(availabilityLabel(product("ENQUIRY"))).toBe("Available for enquiry");
  });
});

describe("mapProducts", () => {
  const categories = [node({ id: "cat-parent", name: "Steel & Structure", slug: "steel-structure", parentId: null })];

  it("aggregates variant images, price, and availability onto the parent product", () => {
    const products = [
      {
        id: "product-1",
        name: "Tata Tiscon TMT Bar",
        brand: "Tata Steel",
        sellingPrice: 700,
        categories: [{ name: "Steel & Structure" }],
        updatedAt: "2026-01-01T00:00:00.000Z",
        images: [{ src: "/product.jpg", alt: "Product", primary: false, sortOrder: 1 }],
      },
    ];
    const variants = [
      {
        id: "variant-1",
        productId: "product-1",
        sku: "TMT-12MM",
        price: 735,
        unit: "12 m length",
        availabilityStatus: "IN_STOCK" as const,
        images: [{ src: "/variant.jpg", alt: "Variant", primary: true, sortOrder: 0 }],
      },
    ];

    const [result] = mapProducts(products, variants, categories, [], []);

    expect(result.price).toBe(735);
    expect(result.sku).toBe("TMT-12MM");
    expect(result.availability).toBe("IN_STOCK");
    expect(result.category).toBe("Steel & Structure");
    // primary image sorts first regardless of input order
    expect(result.image).toBe("/variant.jpg");
    expect(result.images).toHaveLength(2);
  });

  it("falls back to the product's own price and ENQUIRY availability when there are no variants", () => {
    const products = [
      {
        id: "product-2",
        name: "Made-to-order Item",
        brand: "Buildanta",
        sellingPrice: 500,
        categories: [],
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    const [result] = mapProducts(products, [], categories, [], []);

    expect(result.price).toBe(500);
    expect(result.sku).toBe("Made to order");
    expect(result.availability).toBe("ENQUIRY");
  });
});

describe("fallbackSnapshot", () => {
  it("builds a complete, internally consistent snapshot from the static demo catalogue", () => {
    const snapshot = fallbackSnapshot();

    expect(snapshot.source).toBe("fallback");
    expect(snapshot.products.length).toBeGreaterThan(0);
    expect(snapshot.categories.length).toBeGreaterThan(0);

    // every product's category must resolve to a real fallback category slug
    const categorySlugs = new Set(snapshot.categories.map((category) => category.slug));
    for (const product of snapshot.products) {
      expect(categorySlugs.has(product.categorySlug)).toBe(true);
      expect(product.availability).toBe("ENQUIRY");
    }
  });
});

describe("getCatalogSnapshot", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it("returns the fallback snapshot when the inventory API is unreachable", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));

    const snapshot = await getCatalogSnapshot();

    expect(snapshot.source).toBe("fallback");
    expect(snapshot.products.length).toBeGreaterThan(0);
  });

  it("returns the fallback snapshot when the inventory API responds with a non-OK status", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

    const snapshot = await getCatalogSnapshot();

    expect(snapshot.source).toBe("fallback");
  });
});
