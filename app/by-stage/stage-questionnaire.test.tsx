import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StageQuestionnaire } from "./stage-questionnaire";

const estimateResponse = {
  reference: "EST-STAGE-001",
  calculator: { name: "Complete construction material", slug: "complete-construction-material" },
  version: 4,
  disclaimer: "Preliminary planning estimate. Verify final quantities with qualified professionals.",
  assumptions: ["Managed preliminary planning profile", "Wastage included: 5%"],
  items: [
    {
      id: "item-cement",
      outputKey: "cement",
      description: "Cement",
      group: "Foundation and structure",
      rawQuantity: "180",
      wastageQuantity: "9",
      purchaseQuantity: "189",
      formulaUnitCode: "bag",
      unitCode: "bag",
      unitPrice: null,
      lineTotal: null,
      product: null,
      variant: null,
    },
  ],
};

function next() {
  fireEvent.click(screen.getByRole("button", { name: /^Next/ }));
}

describe("StageQuestionnaire", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("uses a five-step visual flow and submits the final answers to the versioned calculator", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => estimateResponse });
    vi.stubGlobal("fetch", fetchMock);

    render(<StageQuestionnaire stage="Foundation & Structure" products={[]} deliveryPincode="208001" />);

    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
    expect(screen.getByText("Tell us how far your project has progressed")).toBeInTheDocument();

    next();
    expect(screen.getByText("What is the size of your project?")).toBeInTheDocument();

    next();
    expect(screen.getByText("Select your space requirements")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Increase Bedroom" }));

    next();
    expect(screen.getByText("Choose the project and material preference")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Economy/ }));

    next();
    expect(screen.getByText("Review your Foundation & Structure estimate")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Calculate Foundation & Structure/ }));

    expect(await screen.findByText("Your Foundation & Structure material schedule")).toBeInTheDocument();
    expect(screen.getByText("PRELIMINARY · VERSION 4")).toBeInTheDocument();
    expect(screen.getByText("Mapping pending")).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(request.body));
    expect(payload.deliveryPincode).toBe("208001");
    expect(payload.qualityTier).toBe("ECONOMY");
    expect(payload.inputs.roomBreakdown).toEqual(expect.arrayContaining([{ roomType: "BEDROOM", quantity: 3 }]));
  });

  it("keeps the customer on the first step when the PIN code is invalid", async () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<StageQuestionnaire stage="Foundation & Structure" products={[]} deliveryPincode="208001" />);

    fireEvent.change(screen.getByLabelText("Delivery PIN code"), { target: { value: "2080" } });
    next();

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid 6-digit delivery PIN code.");
    expect(screen.getByText("Tell us how far your project has progressed")).toBeInTheDocument();
    await waitFor(() => expect(fetch).not.toHaveBeenCalled());
  });
});
