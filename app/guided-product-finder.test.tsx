import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StoreProduct } from "./live-catalog";
import { GuidedProductFinder } from "./guided-product-finder";

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

describe("GuidedProductFinder", () => {
  it("shows ranked room recommendations after the customer answers the questions", () => {
    render(<GuidedProductFinder mode="room" selection="Living Room" products={[product("Value Paint", 200), product("Premium Paint", 800)]} />);

    fireEvent.click(screen.getByRole("button", { name: /Other.*Enter a quantity/i }));
    fireEvent.change(screen.getByLabelText("Approximate quantity needed"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    fireEvent.click(screen.getByText("Premium"));
    fireEvent.click(screen.getByRole("button", { name: /show my matches/i }));

    expect(screen.getByText("2 products selected for you")).toBeInTheDocument();
    expect(screen.getByText("Premium Paint")).toBeInTheDocument();
    expect(screen.getAllByText("3 bag").length).toBeGreaterThan(0);
  });

  it("changes the recommendation pool when a customer chooses another category", () => {
    const products = [product("Cement Bag", 400), product("Wall Paint", 500, { categories: ["Paints"], category: "Paints" })];
    render(<GuidedProductFinder mode="category" selection="Cement" options={["Cement", "Paints"]} products={products} />);

    fireEvent.click(screen.getByRole("button", { name: /Paints.*1.*products/i }));
    fireEvent.click(screen.getByRole("button", { name: /1.*unit \/ pack/i }));
    fireEvent.click(screen.getByRole("button", { name: /Standard/i }));
    fireEvent.click(screen.getByRole("button", { name: /show my matches/i }));

    expect(screen.getByText("Wall Paint")).toBeInTheDocument();
    expect(screen.queryByText("Cement Bag")).not.toBeInTheDocument();
  });
});
