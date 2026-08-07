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

function continueWizard() {
  fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
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
    expect(screen.getByText("Where is your project now?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /My plan is in progress/ }));
    expect(screen.getByText("How large is your project?")).toBeInTheDocument();

    continueWizard();
    expect(screen.getByText("Which spaces are you building?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Increase Bedroom" }));

    continueWizard();
    expect(screen.getByText("Choose your material quality")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Economy/ }));

    expect(screen.getByText("Ready to see your materials?")).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: /My plan is in progress/ }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid 6-digit delivery PIN code first.");
    expect(screen.getByText("Where is your project now?")).toBeInTheDocument();
    await waitFor(() => expect(fetch).not.toHaveBeenCalled());
  });
});
