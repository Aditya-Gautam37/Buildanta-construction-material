import { describe, expect, it } from "vitest";
import { relatedForCart } from "./related-products";
import type { StoreProduct } from "../live-catalog";

function product(over: Partial<StoreProduct> & { id: string; name: string }): StoreProduct {
  return {
    slug: over.id, brand: "Brand", categories: [], categoryIds: [], category: "Cement", categorySlug: "cement",
    stages: [], rooms: [], unit: "bag", price: 100, bulkPrice: null, description: "", specs: [],
    image: null, imageAlt: "", images: [], variants: [], sku: over.id.toUpperCase(),
    availability: "IN_STOCK", minimumOrderQuantity: 1, gstPercent: 18, deliveryInfo: null,
    updatedAt: "2026-08-14T00:00:00.000Z",
    ...over,
  } as StoreProduct;
}

describe("relatedForCart", () => {
  it("suggests nothing for an empty cart", () => {
    expect(relatedForCart([], [product({ id: "a", name: "A" })])).toEqual([]);
  });

  it("never suggests something already in the cart", () => {
    const cement = product({ id: "cement", name: "Cement", categoryIds: ["c1"] });
    const sand = product({ id: "sand", name: "Sand", categoryIds: ["c1"] });
    const result = relatedForCart([{ productId: "cement" }, { productId: "sand" }], [cement, sand]);
    expect(result).toEqual([]);
  });

  // The whole point of the ordering: a human pairing beats a guess from shared
  // metadata, every time.
  it("puts a curated pairing above a category match", () => {
    const cement = product({ id: "cement", name: "Cement", categoryIds: ["c1"] });
    const sameCategory = product({ id: "sand", name: "Sand", categoryIds: ["c1"] });
    const curatedPick = product({ id: "waterproof", name: "Waterproofing", categoryIds: ["c9"] });

    const result = relatedForCart([{ productId: "cement" }], [cement, sameCategory, curatedPick], {
      curated: { cement: ["waterproof"] },
    });

    expect(result[0]?.product.id).toBe("waterproof");
    expect(result[0]?.source).toBe("curated");
    expect(result[0]?.reason).toContain("Cement");
    expect(result[1]?.product.id).toBe("sand");
  });

  it("ranks a shared category above a shared stage, and a stage above a room", () => {
    const inCart = product({ id: "x", name: "X", categoryIds: ["c1"], stages: ["Foundation"], rooms: ["Kitchen"] });
    const byRoom = product({ id: "r", name: "R", categoryIds: ["c8"], stages: ["Finishing"], rooms: ["Kitchen"] });
    const byStage = product({ id: "s", name: "S", categoryIds: ["c9"], stages: ["Foundation"], rooms: ["Bedroom"] });
    const byCategory = product({ id: "c", name: "C", categoryIds: ["c1"], stages: ["Finishing"], rooms: ["Bedroom"] });

    const result = relatedForCart([{ productId: "x" }], [inCart, byRoom, byStage, byCategory]);
    expect(result.map((entry) => entry.source)).toEqual(["category", "stage", "room"]);
  });

  it("keeps the strongest reason when a product qualifies several ways", () => {
    const inCart = product({ id: "x", name: "X", categoryIds: ["c1"], rooms: ["Kitchen"] });
    const both = product({ id: "b", name: "B", categoryIds: ["c1"], rooms: ["Kitchen"] });

    const result = relatedForCart([{ productId: "x" }], [inCart, both]);
    expect(result).toHaveLength(1);
    expect(result[0]?.source).toBe("category");
  });

  // Suggesting something nobody can buy wastes one of only four slots.
  it("sinks out-of-stock products below buyable ones of the same strength", () => {
    const inCart = product({ id: "x", name: "X", categoryIds: ["c1"] });
    const gone = product({ id: "a-gone", name: "A gone", categoryIds: ["c1"], availability: "OUT_OF_STOCK" });
    const here = product({ id: "z-here", name: "Z here", categoryIds: ["c1"] });

    const result = relatedForCart([{ productId: "x" }], [inCart, gone, here]);
    expect(result.map((entry) => entry.product.id)).toEqual(["z-here", "a-gone"]);
  });

  it("honours the limit", () => {
    const inCart = product({ id: "x", name: "X", categoryIds: ["c1"] });
    const others = Array.from({ length: 9 }, (_, i) => product({ id: `p${i}`, name: `P${i}`, categoryIds: ["c1"] }));

    expect(relatedForCart([{ productId: "x" }], [inCart, ...others], { limit: 3 })).toHaveLength(3);
  });

  it("ignores a curated id that is not a real product", () => {
    const cement = product({ id: "cement", name: "Cement", categoryIds: ["c1"] });
    const result = relatedForCart([{ productId: "cement" }], [cement], { curated: { cement: ["deleted-product"] } });
    expect(result).toEqual([]);
  });

  it("ignores cart lines for products missing from the catalogue", () => {
    const other = product({ id: "other", name: "Other", categoryIds: ["c1"] });
    expect(relatedForCart([{ productId: "ghost" }], [other])).toEqual([]);
  });
});
