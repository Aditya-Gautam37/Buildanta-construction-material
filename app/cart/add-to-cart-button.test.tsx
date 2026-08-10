import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddToCartButton } from "./add-to-cart-button";

type Adjustment = { requestedQuantity: number; adjustedQuantity: number; reasons: string[]; message: string };

function mockAddResponse(adjustment: Adjustment | null) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      cartId: "cart-1",
      status: "ACTIVE",
      lines: [],
      lineCount: 1,
      itemCount: adjustment?.adjustedQuantity ?? 1,
      subtotal: 0,
      requiresQuoteCount: 0,
      hasBlockingIssues: false,
      adjustment,
    }),
  });
}

async function addAndWait() {
  fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Added" })).toBeInTheDocument());
}

describe("AddToCartButton quantity adjustments", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the server message when the minimum order quantity raises the amount", async () => {
    vi.stubGlobal("fetch", mockAddResponse({
      requestedQuantity: 2,
      adjustedQuantity: 5,
      reasons: ["MINIMUM_ORDER_QUANTITY"],
      message: "Quantity adjusted from 2 to 5 because the minimum order quantity is 5.",
    }));

    render(<AddToCartButton variantId="variant-1" minimumOrderQuantity={2} />);
    await addAndWait();

    expect(
      screen.getByText("Quantity adjusted from 2 to 5 because the minimum order quantity is 5."),
    ).toBeInTheDocument();
  });

  it("shows the server message when the quantity is rounded to an increment", async () => {
    vi.stubGlobal("fetch", mockAddResponse({
      requestedQuantity: 7,
      adjustedQuantity: 10,
      reasons: ["QUANTITY_INCREMENT"],
      message: "Quantity adjusted from 7 to 10 because this product is sold in increments of 5.",
    }));

    render(<AddToCartButton variantId="variant-1" minimumOrderQuantity={7} />);
    await addAndWait();

    expect(
      screen.getByText("Quantity adjusted from 7 to 10 because this product is sold in increments of 5."),
    ).toBeInTheDocument();
  });

  it("shows the server message when the maximum direct quantity caps the amount", async () => {
    vi.stubGlobal("fetch", mockAddResponse({
      requestedQuantity: 100,
      adjustedQuantity: 50,
      reasons: ["MAXIMUM_DIRECT_QUANTITY"],
      message: "Quantity adjusted from 100 to 50 because the maximum direct-order quantity is 50.",
    }));

    render(<AddToCartButton variantId="variant-1" minimumOrderQuantity={100} />);
    await addAndWait();

    expect(
      screen.getByText("Quantity adjusted from 100 to 50 because the maximum direct-order quantity is 50."),
    ).toBeInTheDocument();
  });

  it("resets the stepper to the quantity the server actually accepted", async () => {
    vi.stubGlobal("fetch", mockAddResponse({
      requestedQuantity: 2,
      adjustedQuantity: 5,
      reasons: ["MINIMUM_ORDER_QUANTITY"],
      message: "Quantity adjusted from 2 to 5 because the minimum order quantity is 5.",
    }));

    render(<AddToCartButton variantId="variant-1" minimumOrderQuantity={2} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    await addAndWait();

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows no adjustment message when the server accepted the quantity as requested", async () => {
    vi.stubGlobal("fetch", mockAddResponse(null));

    render(<AddToCartButton variantId="variant-1" minimumOrderQuantity={3} />);
    await addAndWait();

    expect(screen.queryByText(/Quantity adjusted/)).not.toBeInTheDocument();
  });

  it("surfaces a server error instead of an adjustment notice", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "This product is available for bulk quotation only." }),
    }));

    render(<AddToCartButton variantId="variant-1" minimumOrderQuantity={1} />);
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "This product is available for bulk quotation only.",
      ),
    );
    expect(screen.queryByText(/Quantity adjusted/)).not.toBeInTheDocument();
  });

  it("prevents repeated submissions while a card add is in progress", async () => {
    let resolveRequest: ((value: unknown) => void) | undefined;
    const fetchMock = vi.fn().mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));
    vi.stubGlobal("fetch", fetchMock);

    render(<AddToCartButton variantId="variant-1" compact productName="Premium Cement" />);
    fireEvent.click(screen.getByRole("button", { name: "Add Premium Cement to cart" }));
    const addingButton = screen.getByRole("button", { name: "Adding..." });
    expect(addingButton).toBeDisabled();
    fireEvent.click(addingButton);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveRequest?.({ ok: true, json: async () => ({ adjustment: null }) });
    await waitFor(() => expect(screen.getByRole("button", { name: "Added" })).toBeInTheDocument());
  });
});
