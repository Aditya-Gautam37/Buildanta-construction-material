import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CalculatorWizard } from "./calculator-wizard";
import type { PublicCalculator } from "../calculator-data";

const calculator: PublicCalculator = {
  id: "calc-1",
  name: "Concrete Calculator",
  slug: "cement-concrete",
  type: "CEMENT_CONCRETE",
  description: "Estimate concrete for a slab, footing, beam or column.",
  instructions: "Enter the component dimensions.",
  imageUrl: null,
  icon: null,
  disclaimer: "Preliminary estimate only.",
  currentVersion: { version: 3, effectiveFrom: null, publishedAt: null },
};

function makeEstimate(overrides: Record<string, unknown> = {}) {
  return {
    reference: "CALC-2026-0001",
    version: 3,
    deliveryPincode: "208001",
    qualityTier: "STANDARD",
    inputs: { componentType: "SLAB" },
    assumptions: ["Wastage allowance applied at 5%."],
    subtotal: "12000",
    gstTotal: "600",
    deliveryTotal: null,
    indicativeTotal: "12600",
    expiresAt: "2026-12-31T00:00:00.000Z",
    expired: false,
    disclaimer: "Final quantities require professional review.",
    quotationReference: null,
    items: [
      {
        id: "item-1",
        outputKey: "cement",
        description: "Cement",
        group: "Structure",
        rawQuantity: "10",
        wastageQuantity: "0.5",
        purchaseQuantity: "11",
        formulaUnitCode: "bags",
        unitCode: "bags",
        packageSize: null,
        availabilityLabel: "In stock",
        leadTimeLabel: null,
        unitPrice: "400",
        gstPercent: "28",
        lineTotal: "4400",
        product: null,
        variant: null,
      },
    ],
    ...overrides,
  };
}

describe("CalculatorWizard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("submits the project brief and renders the returned estimate", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => makeEstimate() });
    vi.stubGlobal("fetch", fetchMock);

    render(<CalculatorWizard calculator={calculator} />);
    fireEvent.click(screen.getByText("Calculate material requirement"));

    await waitFor(() => expect(screen.getByText("Cement")).toBeInTheDocument());

    const [url, requestInit] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/calculators/cement-concrete/calculate");
    const body = JSON.parse(requestInit.body as string);
    expect(body.deliveryPincode).toBe("208001");
    expect(body.inputs.componentType).toBe("SLAB");
  });

  it("shows an error message when the calculation request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "The delivery PIN code is not serviceable." }),
    }));

    render(<CalculatorWizard calculator={calculator} />);
    fireEvent.click(screen.getByText("Calculate material requirement"));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("The delivery PIN code is not serviceable."));
  });

  it("renders quantity-only materials when inventory products and prices are not mapped", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeEstimate({
        subtotal: null,
        gstTotal: null,
        indicativeTotal: null,
        items: [{
          ...makeEstimate().items[0],
          unitPrice: null,
          gstPercent: null,
          lineTotal: null,
          availabilityLabel: "Generic material estimate",
          product: null,
          variant: null,
        }],
      }),
    }));

    render(<CalculatorWizard calculator={calculator} />);
    fireEvent.click(screen.getByText("Calculate material requirement"));

    await waitFor(() => expect(screen.getByText("Generic calculated material / inventory mapping optional")).toBeInTheDocument());
    expect(screen.getAllByText("Request price")).toHaveLength(2);
    expect(screen.getByText(/Staff can select products, prices and fulfilment details/)).toBeInTheDocument();
    expect(screen.getByText("Request quotation for complete BOQ")).toBeInTheDocument();
  });

  it("requests a quotation for a completed estimate and shows the reference", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => makeEstimate() })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ reference: "Q-2026-0099" }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<CalculatorWizard calculator={calculator} />);
    fireEvent.click(screen.getByText("Calculate material requirement"));
    await waitFor(() => expect(screen.getByText("Cement")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Aditya" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "aditya@example.com" } });
    fireEvent.click(screen.getByText("Request quotation for complete BOQ"));

    await waitFor(() => expect(screen.getByText("Quotation request received")).toBeInTheDocument());
    expect(screen.getByText(/Q-2026-0099/)).toBeInTheDocument();

    const [quoteUrl, quoteInit] = fetchMock.mock.calls[1];
    expect(quoteUrl).toBe("/api/calculators/estimates/CALC-2026-0001/quotation");
    expect(JSON.parse(quoteInit.body as string)).toMatchObject({ name: "Aditya", email: "aditya@example.com" });
  });
});
