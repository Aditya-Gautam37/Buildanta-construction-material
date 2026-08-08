import { describe, expect, it } from "vitest";
import type { StoreProduct } from "../live-catalog";
import { buildStagePlan, type StageAnswers } from "./stage-planner";

const answers: StageAnswers = {
  builtUpAreaSqFt: 1000,
  floors: 1,
  rooms: 4,
  bathrooms: 2,
  kitchens: 1,
  projectType: "RESIDENTIAL",
  structureSystem: "RCC_FRAME",
  qualityTier: "STANDARD",
  coveragePercent: 100,
  wastagePercent: 5,
};

function product(name: string, price: number, minimumOrderQuantity = 1): StoreProduct {
  return {
    id: name,
    slug: name.toLowerCase().replaceAll(" ", "-"),
    name,
    brand: "Buildanta test brand",
    categories: [],
    categoryIds: [],
    category: "Test",
    categorySlug: "test",
    stages: [],
    rooms: [],
    unit: "unit",
    price,
    bulkPrice: null,
    description: "Test product",
    specs: [],
    image: null,
    imageAlt: name,
    images: [],
    variants: [],
    sku: "TEST",
    availability: "ENQUIRY",
    minimumOrderQuantity,
    gstPercent: 18,
    deliveryInfo: null,
    updatedAt: "2026-08-05T00:00:00.000Z",
  };
}

describe("stage planner", () => {
  it("produces priced foundation quantities from mapped catalogue products", () => {
    const plan = buildStagePlan("Foundation & Structure", answers, [
      product("UltraTech OPC 53 Cement", 414, 10),
      product("TMT Reinforcement Steel", 70, 100),
      product("Annealed Binding Wire", 82, 25),
    ]);

    expect(plan.totalLines).toBe(5);
    expect(plan.mappedLines).toBe(3);
    expect(plan.indicativeTotal).toBeGreaterThan(0);
    expect(plan.lines.find((line) => line.key === "cement")?.purchaseQuantity).toBeGreaterThanOrEqual(10);
  });

  it("uses room and area answers for an electrical point-and-route schedule", () => {
    const plan = buildStagePlan("Electrical & Wiring", answers, [
      product("FR-LF Copper House Wire", 1990),
      product("Classic Modular Switch", 125, 10),
      product("Miniature Circuit Breaker", 385, 4),
      product("LED Batten", 610, 4),
    ]);

    expect(plan.lines.find((line) => line.key === "wire")?.requirement).toBeGreaterThan(1);
    expect(plan.lines.find((line) => line.key === "switches")?.purchaseQuantity).toBeGreaterThan(20);
    expect(plan.mappedLines).toBe(4);
  });

  it("still returns a schedule for stages without catalogue products", () => {
    const plan = buildStagePlan("Kitchen & Wardrobes", answers, []);
    expect(plan.totalLines).toBe(4);
    expect(plan.mappedLines).toBe(0);
    expect(plan.lines.every((line) => line.lineTotal == null)).toBe(true);
  });
});
