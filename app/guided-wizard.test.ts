import { describe, expect, it } from "vitest";
import { brandOptions, childOptions, departmentsFor, productsInSubtree, resolveStep } from "./guided-wizard";
import type { CatalogNode, CategoryLink, StoreProduct } from "./live-catalog";

function node(id: string, name: string, parentId: string | null = null, links: CategoryLink[] = []): CatalogNode {
  return {
    id, name, slug: id, parentId,
    description: null, imageUrl: null, icon: null,
    sortOrder: 0, featured: false, published: true,
    seoTitle: null, seoDescription: null,
    categoryLinks: links, childCount: 0, productCount: 0,
  };
}

function product(id: string, brand: string, categoryIds: string[]): StoreProduct {
  return {
    id, slug: id, name: id, brand,
    categories: [], categoryIds, category: "", categorySlug: "",
    stages: [], rooms: [], unit: "unit", price: 100, bulkPrice: null,
    description: "", specs: [], image: null, imageAlt: "", images: [], variants: [],
    sku: id, availability: "IN_STOCK", minimumOrderQuantity: 1,
    gstPercent: null, deliveryInfo: null, updatedAt: "2026-01-01",
  };
}

const categories = [
  node("paints", "Paints"),
  node("exterior", "Exterior Paints", "paints"),
  node("emulsion", "Exterior Emulsion", "exterior"),
  node("putty", "Exterior Putty", "exterior"),
  node("interior", "Interior Paints", "paints"),
  node("tiles", "Tiles"),
  node("floor", "Floor Tiles", "tiles"),
];

const products = [
  product("apex", "Asian Paints", ["emulsion"]),
  product("weathercoat", "Berger", ["emulsion"]),
  product("royale", "Asian Paints", ["interior"]),
  product("vitrified", "Kajaria", ["floor"]),
];

describe("guided wizard", () => {
  it("counts products anywhere beneath a category", () => {
    expect(productsInSubtree(products, categories, "paints")).toHaveLength(3);
    expect(productsInSubtree(products, categories, "exterior")).toHaveLength(2);
  });

  // Two `Primer` nodes really did live under Paints; a name match would have
  // credited one with the other's stock.
  it("matches on id, not name", () => {
    const twins = [...categories, node("primer-a", "Primer", "paints"), node("primer-b", "Primer", "paints")];
    const stocked = [...products, product("decoprime", "Asian Paints", ["primer-b"])];
    expect(productsInSubtree(stocked, twins, "primer-a")).toHaveLength(0);
    expect(productsInSubtree(stocked, twins, "primer-b")).toHaveLength(1);
  });

  it("hides branches that lead nowhere", () => {
    const withEmpty = [...categories, node("texture", "Texture Paints", "paints")];
    expect(childOptions(withEmpty, products, "paints").map((option) => option.node.id)).toEqual(["exterior", "interior"]);
  });

  it("ranks options by how much can actually be bought", () => {
    expect(childOptions(categories, products, "paints").map((option) => option.node.id)).toEqual(["exterior", "interior"]);
  });

  it("returns a room's departments in the order staff arranged them", () => {
    const room = node("living", "Living room", null, [
      { categoryId: "tiles", mode: "INCLUDE", sortOrder: 20 },
      { categoryId: "paints", mode: "INCLUDE", sortOrder: 10 },
    ]);
    expect(departmentsFor(room, categories, products).map((option) => option.node.id)).toEqual(["paints", "tiles"]);
  });

  it("drops a department the room excludes, and its products", () => {
    const room = node("living", "Living room", null, [
      { categoryId: "paints", mode: "INCLUDE", sortOrder: 10 },
      { categoryId: "exterior", mode: "EXCLUDE", sortOrder: 0 },
    ]);
    const [paints] = departmentsFor(room, categories, products);
    expect(paints!.productCount).toBe(1);
  });

  it("omits a department whose every product is excluded", () => {
    const room = node("living", "Living room", null, [
      { categoryId: "tiles", mode: "INCLUDE", sortOrder: 10 },
      { categoryId: "floor", mode: "EXCLUDE", sortOrder: 0 },
    ]);
    expect(departmentsFor(room, categories, products)).toHaveLength(0);
  });

  it("skips a level that offers only one way forward", () => {
    const step = resolveStep(categories, products, "tiles");
    expect(step.current.id).toBe("floor");
    expect(step.skipped.map((skippedNode) => skippedNode.id)).toEqual(["tiles"]);
  });

  it("stops skipping where the level holds products of its own", () => {
    const stocked = [...products, product("mixed", "Somany", ["tiles"])];
    const step = resolveStep(categories, stocked, "tiles");
    expect(step.current.id).toBe("tiles");
    expect(step.skipped).toHaveLength(0);
  });

  it("lists brands most stocked first", () => {
    expect(brandOptions(productsInSubtree(products, categories, "paints"))).toEqual([
      { brand: "Asian Paints", productCount: 2 },
      { brand: "Berger", productCount: 1 },
    ]);
  });
});
