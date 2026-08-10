import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart, type CartSummary } from "./cart-context";
import type { StoreProduct } from "./live-catalog";
import { ProductCard, resolveProductCardAction } from "./product-card";

function makeProduct(overrides: Partial<StoreProduct> = {}): StoreProduct {
  return {
    id: "product-1",
    slug: "premium-cement",
    name: "Premium Cement",
    brand: "Buildanta",
    categories: ["Cement"],
    categoryIds: ["cement"],
    category: "Cement",
    categorySlug: "cement",
    stages: [],
    rooms: [],
    unit: "bag",
    price: 450,
    bulkPrice: null,
    description: "A dependable construction material for structural work.",
    specs: [],
    image: null,
    imageAlt: "Premium cement bag",
    images: [],
    variants: [],
    sku: "CEMENT-50",
    availability: "IN_STOCK",
    minimumOrderQuantity: 1,
    gstPercent: null,
    deliveryInfo: null,
    updatedAt: "2026-08-11T00:00:00.000Z",
    ...overrides,
  };
}

function makeVariant(id: string, purchaseMode: "DIRECT_ONLY" | "QUOTE_ONLY" | "DIRECT_AND_QUOTE" = "DIRECT_ONLY") {
  return {
    id,
    sku: id.toUpperCase(),
    label: "50 kg",
    price: 450,
    unit: "bag",
    availability: "IN_STOCK" as const,
    attributes: {},
    purchaseMode,
    minimumOrderQuantity: 5,
    maxDirectQuantity: null,
    bulkQuoteThreshold: null,
    quantityIncrement: 1,
  };
}

const emptySummary: CartSummary = {
  cartId: null,
  status: "ACTIVE",
  lines: [],
  lineCount: 0,
  itemCount: 0,
  subtotal: 0,
  requiresQuoteCount: 0,
  hasBlockingIssues: false,
};

function CartCount() {
  const { summary } = useCart();
  return <output aria-label="Cart item count">{summary.itemCount}</output>;
}

describe("ProductCard purchase actions", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("adds the exact single direct variant with card quantity one", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...emptySummary, cartId: "cart-1", lineCount: 1, itemCount: 1, adjustment: null }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const product = makeProduct({ variants: [makeVariant("variant-one", "DIRECT_AND_QUOTE")] });

    render(<ProductCard product={product} />);
    fireEvent.click(screen.getByRole("button", { name: "Add Premium Cement to cart" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Added" })).toBeInTheDocument());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ variantId: "variant-one", quantity: 1 });
    expect(screen.getByRole("link", { name: "Get quote" })).toHaveAttribute("href", "/bulk-quotes?product=Premium%20Cement");
  });

  it("sends products with multiple direct variants to their existing detail route", () => {
    const product = makeProduct({ variants: [makeVariant("variant-one"), makeVariant("variant-two")] });

    render(<ProductCard product={product} />);

    expect(screen.getByRole("link", { name: "Choose options" })).toHaveAttribute("href", "/products/premium-cement");
    expect(screen.queryByRole("button", { name: /Add .* to cart/ })).not.toBeInTheDocument();
  });

  it("keeps quotation-only products out of the direct cart flow", () => {
    const product = makeProduct({ variants: [makeVariant("quote-only", "QUOTE_ONLY")] });

    render(<ProductCard product={product} />);

    expect(resolveProductCardAction(product)).toEqual({ kind: "quote" });
    expect(screen.getByRole("link", { name: "Get quote" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add .* to cart/ })).not.toBeInTheDocument();
  });

  it("disables direct purchasing when delivery availability is blocked", () => {
    const product = makeProduct({ variants: [makeVariant("variant-one")] });

    render(<ProductCard product={product} location={{ availabilityStatus: "OUT_OF_STOCK", fulfilmentMode: "ON_REQUEST", leadTimeLabel: "Confirm availability" }} />);

    expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Get quote" })).toBeInTheDocument();
  });

  it("updates the shared cart count immediately after a successful add", async () => {
    const fetchMock = vi.fn().mockImplementation((_input: string, init?: RequestInit) => Promise.resolve({
      ok: true,
      json: async () => init?.method === "POST"
        ? { ...emptySummary, cartId: "cart-1", lineCount: 1, itemCount: 1, adjustment: null }
        : emptySummary,
    }));
    vi.stubGlobal("fetch", fetchMock);
    const product = makeProduct({ variants: [makeVariant("variant-one")] });

    render(<CartProvider><CartCount /><ProductCard product={product} /></CartProvider>);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/cart", { cache: "no-store" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Premium Cement to cart" }));

    await waitFor(() => expect(screen.getByLabelText("Cart item count")).toHaveTextContent("1"));
  });

  it("keeps long titles accessible while the visual card can clamp them", () => {
    const name = "An exceptionally long construction material product name with specification details";
    render(<ProductCard product={makeProduct({ name })} />);

    expect(screen.getByRole("heading", { name })).toHaveAttribute("id", "product-product-1-title");
    expect(screen.getByTitle(name)).toHaveAttribute("href", "/products/premium-cement");
  });
});
