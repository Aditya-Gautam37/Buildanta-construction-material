import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CartPageClient } from "./cart-page-client";

type Adjustment = { requestedQuantity: number; adjustedQuantity: number; reasons: string[]; message: string };

function line(quantity: number) {
  return {
    itemId: "item-1",
    variantId: "variant-1",
    productId: "product-1",
    productName: "Sample porcelain tile",
    sku: "BLD-SAMPLE-001",
    quantity,
    purchaseMode: "DIRECT_ONLY" as const,
    unit: "unit",
    unitPriceSnapshot: 100,
    livePrice: 100,
    priceChanged: false,
    lineSubtotal: quantity * 100,
    availability: "IN_STOCK" as const,
    eligible: true,
    requiresQuote: false,
    adjustment: null,
    issues: [] as string[],
  };
}

function summary(quantity: number, adjustment: Adjustment | null = null) {
  return {
    cartId: "cart-1",
    status: "ACTIVE",
    lines: [line(quantity)],
    lineCount: 1,
    itemCount: quantity,
    subtotal: quantity * 100,
    requiresQuoteCount: 0,
    hasBlockingIssues: false,
    ...(adjustment === null ? {} : { adjustment }),
  };
}

/** First call is the provider's initial GET; later calls are the mutation under test. */
function mockCartFetch(initialQuantity: number, mutationBody: Record<string, unknown>) {
  let call = 0;
  return vi.fn().mockImplementation(async () => {
    call += 1;
    return { ok: true, json: async () => (call === 1 ? summary(initialQuantity) : mutationBody) };
  });
}

async function waitForCart() {
  await waitFor(() => expect(screen.getByText("Sample porcelain tile")).toBeInTheDocument());
}

describe("Cart page quantity adjustments", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the server adjustment message after a quantity update", async () => {
    vi.stubGlobal("fetch", mockCartFetch(1, summary(50, {
      requestedQuantity: 100,
      adjustedQuantity: 50,
      reasons: ["MAXIMUM_DIRECT_QUANTITY"],
      message: "Quantity adjusted from 100 to 50 because the maximum direct-order quantity is 50.",
    })));

    render(<CartPageClient />);
    await waitForCart();
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));

    await waitFor(() =>
      expect(
        screen.getByText("Quantity adjusted from 100 to 50 because the maximum direct-order quantity is 50."),
      ).toBeInTheDocument(),
    );
  });

  it("shows an increment adjustment message from the server", async () => {
    vi.stubGlobal("fetch", mockCartFetch(5, summary(10, {
      requestedQuantity: 7,
      adjustedQuantity: 10,
      reasons: ["QUANTITY_INCREMENT"],
      message: "Quantity adjusted from 7 to 10 because this product is sold in increments of 5.",
    })));

    render(<CartPageClient />);
    await waitForCart();
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));

    await waitFor(() =>
      expect(
        screen.getByText("Quantity adjusted from 7 to 10 because this product is sold in increments of 5."),
      ).toBeInTheDocument(),
    );
  });

  it("shows a minimum-order-quantity adjustment message from the server", async () => {
    vi.stubGlobal("fetch", mockCartFetch(6, summary(5, {
      requestedQuantity: 2,
      adjustedQuantity: 5,
      reasons: ["MINIMUM_ORDER_QUANTITY"],
      message: "Quantity adjusted from 2 to 5 because the minimum order quantity is 5.",
    })));

    render(<CartPageClient />);
    await waitForCart();
    fireEvent.click(screen.getByRole("button", { name: "Decrease quantity" }));

    await waitFor(() =>
      expect(
        screen.getByText("Quantity adjusted from 2 to 5 because the minimum order quantity is 5."),
      ).toBeInTheDocument(),
    );
  });

  it("can dismiss the adjustment message", async () => {
    vi.stubGlobal("fetch", mockCartFetch(1, summary(5, {
      requestedQuantity: 2,
      adjustedQuantity: 5,
      reasons: ["MINIMUM_ORDER_QUANTITY"],
      message: "Quantity adjusted from 2 to 5 because the minimum order quantity is 5.",
    })));

    render(<CartPageClient />);
    await waitForCart();
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));
    await waitFor(() => expect(screen.getByText(/Quantity adjusted/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Dismiss message" }));

    expect(screen.queryByText(/Quantity adjusted/)).not.toBeInTheDocument();
  });

  it("shows no message when the server made no adjustment", async () => {
    const fetchMock = mockCartFetch(1, summary(2));
    vi.stubGlobal("fetch", fetchMock);

    render(<CartPageClient />);
    await waitForCart();
    fireEvent.click(screen.getByRole("button", { name: "Increase quantity" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(/Quantity adjusted/)).not.toBeInTheDocument();
  });
});
