import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductBrowser } from "./product-browser";
import type { StoreProduct } from "./live-catalog";

function makeProduct(overrides: Partial<StoreProduct>): StoreProduct {
  return {
    id: "product-1",
    slug: "product-1",
    name: "Product 1",
    brand: "Buildanta",
    categories: [],
    category: "Cement & Structure",
    categorySlug: "cement-structure",
    stages: [],
    rooms: [],
    unit: "unit",
    price: 100,
    bulkPrice: null,
    description: "A construction product.",
    specs: [],
    image: null,
    imageAlt: "",
    images: [],
    variants: [],
    sku: "SKU-1",
    availability: "IN_STOCK",
    minimumOrderQuantity: 1,
    gstPercent: null,
    deliveryInfo: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("ProductBrowser", () => {
  const products = [
    makeProduct({ id: "cement", slug: "cement", name: "Cement Bag", categories: ["Cement & Structure"], price: 400, updatedAt: "2026-01-02T00:00:00.000Z" }),
    makeProduct({ id: "tmt", slug: "tmt", name: "TMT Bar", categories: ["Steel & Structure"], price: 700, updatedAt: "2026-01-03T00:00:00.000Z" }),
    makeProduct({ id: "paint", slug: "paint", name: "Emulsion Paint", categories: ["Paints"], price: 250, updatedAt: "2026-01-01T00:00:00.000Z" }),
  ];
  const options = ["Cement & Structure", "Steel & Structure", "Paints"];

  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  it("shows only products matching the selected category", () => {
    render(<ProductBrowser mode="category" products={products} options={options} initial="Steel & Structure" />);

    expect(screen.getByText("TMT Bar")).toBeInTheDocument();
    expect(screen.queryByText("Cement Bag")).not.toBeInTheDocument();
    expect(screen.queryByText("Emulsion Paint")).not.toBeInTheDocument();
  });

  it("includes products from descendant categories in a parent category", () => {
    const nestedProduct = makeProduct({
      id: "general-purpose-cement",
      slug: "general-purpose-cement",
      name: "General Purpose Cement",
      categories: ["General Purpose"],
    });

    render(
      <ProductBrowser
        mode="category"
        products={[nestedProduct]}
        options={["Cement", "General Purpose"]}
        initial="Cement"
        categoryGroups={{ Cement: ["Cement", "General Purpose"], "General Purpose": ["General Purpose"] }}
      />,
    );

    expect(screen.getByText("General Purpose Cement")).toBeInTheDocument();
  });

  it("re-sorts low-to-high by price within a category", () => {
    const sameCategoryProducts = [
      makeProduct({ id: "a", slug: "a", name: "Alpha", categories: ["Cement & Structure"], price: 500 }),
      makeProduct({ id: "b", slug: "b", name: "Beta", categories: ["Cement & Structure"], price: 100 }),
      makeProduct({ id: "c", slug: "c", name: "Gamma", categories: ["Cement & Structure"], price: 300 }),
    ];
    const { container } = render(<ProductBrowser mode="category" products={sameCategoryProducts} options={["Cement & Structure"]} initial="Cement & Structure" />);

    fireEvent.change(screen.getByLabelText("Sort products"), { target: { value: "low" } });

    const names = Array.from(container.querySelectorAll(".product-card h2")).map((heading) => heading.textContent);
    expect(names).toEqual(["Beta", "Gamma", "Alpha"]);
  });

  it("keeps the buying assistant optional until the customer asks for help", () => {
    render(<ProductBrowser mode="category" products={products} options={options} initial="Cement & Structure" />);

    expect(screen.queryByText("Find the right product in under a minute.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Help me choose" }));
    expect(screen.getByText("Find the right product in under a minute.")).toBeInTheDocument();
  });

  it("replaces an unavailable catalogue image with a relevant local fallback", () => {
    const paint = makeProduct({ id: "paint-image", name: "Interior Paint", categories: ["Paints"], category: "Paints", image: "https://example.invalid/paint.jpg", imageAlt: "Interior paint bucket" });
    render(<ProductBrowser mode="category" products={[paint]} options={["Paints"]} initial="Paints" />);

    const cardImage = screen.getAllByAltText("Interior paint bucket").at(-1) as HTMLImageElement;
    fireEvent.error(cardImage);
    expect(cardImage.src).toContain("/demo/products/real/paint.jpg");
  });

  it("shows the empty state when the search term matches nothing", () => {
    render(<ProductBrowser mode="category" products={products} options={["Cement & Structure"]} initial="Cement & Structure" />);

    fireEvent.change(screen.getByPlaceholderText("Search products and brands..."), {
      target: { value: "nonexistent product name" },
    });

    expect(screen.getByText("No matching products")).toBeInTheDocument();
  });
});
