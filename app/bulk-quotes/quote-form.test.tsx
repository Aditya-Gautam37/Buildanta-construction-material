import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuoteForm } from "./quote-form";
import type { StoreProduct } from "../live-catalog";

function makeProduct(overrides: Partial<StoreProduct> = {}): StoreProduct {
  return {
    id: "product-1",
    slug: "product-1",
    name: "Cement Bag",
    brand: "Buildanta",
    categories: [],
    category: "Cement & Structure",
    categorySlug: "cement-structure",
    stages: [],
    rooms: [],
    unit: "bag",
    price: 400,
    bulkPrice: null,
    description: "A cement product.",
    specs: [],
    image: null,
    imageAlt: "",
    images: [],
    variants: [{ id: "variant-1", sku: "CEMENT-50", label: "50 kg", price: 400, unit: "bag", availability: "IN_STOCK", attributes: {} }],
    sku: "CEMENT-50",
    availability: "IN_STOCK",
    minimumOrderQuantity: 1,
    gstPercent: null,
    deliveryInfo: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function fillContactFields() {
  fireEvent.change(screen.getByPlaceholderText("Your full name"), { target: { value: "Aditya" } });
  fireEvent.change(screen.getByPlaceholderText("you@company.com"), { target: { value: "aditya@example.com" } });
  fireEvent.change(screen.getByPlaceholderText("+91 98765 43210"), { target: { value: "9876543210" } });
  fireEvent.change(screen.getByPlaceholderText("208001"), { target: { value: "208001" } });
}

describe("QuoteForm", () => {
  const products = [makeProduct()];

  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  it("adds and removes a basket line item", () => {
    render(<QuoteForm products={products} />);

    expect(screen.queryByText("Remove item")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("+ Add product"));
    expect(screen.getAllByText("Item 1", { exact: false })).toHaveLength(1);
    expect(screen.getByText("Item 2", { exact: false })).toBeInTheDocument();
    expect(screen.getAllByText("Remove item")).toHaveLength(2);

    fireEvent.click(screen.getAllByText("Remove item")[0]);
    expect(screen.queryByText("Remove item")).not.toBeInTheDocument();
  });

  it("blocks review submission when a line item has an invalid quantity", () => {
    render(<QuoteForm products={products} />);
    fillContactFields();

    fireEvent.change(screen.getByDisplayValue("1"), { target: { value: "0" } });
    // Fire the submit event directly: a real click on the submit button would be blocked
    // first by the input's own HTML5 `min` constraint, never reaching the app's own check.
    fireEvent.submit(screen.getByText("Review quotation summary").closest("form")!);

    expect(screen.getByRole("alert")).toHaveTextContent("Choose a valid product, variant and quantity for every line.");
  });

  it("reviews and submits a quote request, showing the returned reference on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reference: "Q-2026-0001" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<QuoteForm products={products} />);
    fillContactFields();
    fireEvent.click(screen.getByText("Review quotation summary"));

    expect(screen.getByText("1 material line")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Submit quotation"));

    await waitFor(() => expect(screen.getByText("Quotation request received")).toBeInTheDocument());
    expect(screen.getByText("Q-2026-0001")).toBeInTheDocument();

    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse(requestInit.body as string);
    expect(body.email).toBe("aditya@example.com");
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({ productId: "product-1", variantId: "variant-1" });
  });

  it("returns to the review step with an error message when the submission fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Server error." }) }));

    render(<QuoteForm products={products} />);
    fillContactFields();
    fireEvent.click(screen.getByText("Review quotation summary"));
    fireEvent.click(screen.getByText("Submit quotation"));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Server error."));
    expect(screen.getByText("Submit quotation")).toBeInTheDocument();
  });
});
