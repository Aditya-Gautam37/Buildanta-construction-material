import { describe, expect, it } from "vitest";
import type { StoreProduct } from "./live-catalog";
import { recommendProducts, type FinderAnswers } from "./product-recommender";

function product(name: string, price: number, overrides: Partial<StoreProduct> = {}): StoreProduct {
  return {
    id: name,
    slug: name.toLowerCase().replaceAll(" ", "-"),
    name,
    brand: "Buildanta",
    categories: ["Cement"],
    category: "Cement",
    categorySlug: "cement",
    stages: [],
    rooms: ["Living Room"],
    unit: "bag",
    price,
    bulkPrice: null,
    description: "Test product",
    specs: [],
    image: null,
    imageAlt: name,
    images: [],
    variants: [],
    sku: name,
    availability: "IN_STOCK",
    minimumOrderQuantity: 1,
    gstPercent: 18,
    deliveryInfo: null,
    updatedAt: "2026-08-07T00:00:00.000Z",
    ...overrides,
  };
}

const baseAnswers: FinderAnswers = { quality: "STANDARD", preferredBrand: "all", maxUnitPrice: 0, quantity: 1, availability: "ANY" };

describe("recommendProducts", () => {
  const products = [product("Economy", 100), product("Standard", 300), product("Premium", 900)];

  it("ranks products according to the selected quality-price tier", () => {
    expect(recommendProducts(products, { ...baseAnswers, quality: "ECONOMY" }).recommendations[0].product.name).toBe("Economy");
    expect(recommendProducts(products, { ...baseAnswers, quality: "STANDARD" }).recommendations[0].product.name).toBe("Standard");
    expect(recommendProducts(products, { ...baseAnswers, quality: "PREMIUM" }).recommendations[0].product.name).toBe("Premium");
  });

  it("honours brand, budget, availability and minimum order quantity", () => {
    const matching = product("Matching", 250, { brand: "Preferred", minimumOrderQuantity: 10, availability: "LOW_STOCK" });
    const result = recommendProducts([...products, matching], { ...baseAnswers, preferredBrand: "Preferred", maxUnitPrice: 300, quantity: 4, availability: "AVAILABLE_NOW" });
    expect(result.relaxed).toBe(false);
    expect(result.recommendations[0].product.name).toBe("Matching");
    expect(result.recommendations[0].purchaseQuantity).toBe(10);
    expect(result.recommendations[0].indicativeTotal).toBe(2500);
  });

  it("shows sensible alternatives when strict preferences match nothing", () => {
    const result = recommendProducts(products, { ...baseAnswers, preferredBrand: "Missing brand" });
    expect(result.relaxed).toBe(true);
    expect(result.recommendations).toHaveLength(3);
  });
});
