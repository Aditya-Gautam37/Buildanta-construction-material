import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KnowYourMaterialTrigger } from "./know-your-material";

const publishedPayload = {
  summary: "A verified summary.",
  useCases: ["Structural concrete"],
  suitableSurfaces: [],
  unsuitableSurfaces: [],
  preparationSteps: [],
  applicationSteps: [],
  sequenceNote: null,
  mixingInstructions: null,
  requiredTools: [],
  coverageValue: null,
  coverageUnit: null,
  coverageConditions: null,
  numberOfCoats: null,
  dryingCuringInfo: null,
  safetyPrecautions: ["Wear gloves"],
  commonMistakes: [],
  professionalTips: [],
  relatedMaterials: [],
};

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe("KnowYourMaterialTrigger", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not call the API until the customer opens the panel", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<KnowYourMaterialTrigger productId="product-1" productName="Cement" />);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // Regression: the fetch effect previously depended on the state it set, so
  // React re-ran it immediately and the cleanup cancelled the in-flight
  // response — leaving the panel stuck on "Loading" forever.
  it("settles on the honest empty state when nothing is published, instead of loading forever", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(404, { error: "not found" })));
    render(<KnowYourMaterialTrigger productId="product-1" productName="Cement" />);

    fireEvent.click(screen.getByRole("button", { name: /Know Your Material/i }));

    await waitFor(() =>
      expect(screen.getByText(/haven't published verified information/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/Loading verified information/i)).not.toBeInTheDocument();
  });

  it("renders published knowledge, and always shows the verification disclaimer", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, publishedPayload)));
    render(<KnowYourMaterialTrigger productId="product-1" productName="Cement" />);

    fireEvent.click(screen.getByRole("button", { name: /Know Your Material/i }));

    await waitFor(() => expect(screen.getByText("A verified summary.")).toBeInTheDocument());
    expect(screen.getByText("Structural concrete")).toBeInTheDocument();
    expect(screen.getByText("Wear gloves")).toBeInTheDocument();
    expect(screen.getByText(/Only the information above has been verified/i)).toBeInTheDocument();
  });

  it("omits sections the admin left blank rather than showing empty headings", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, publishedPayload)));
    render(<KnowYourMaterialTrigger productId="product-1" productName="Cement" />);

    fireEvent.click(screen.getByRole("button", { name: /Know Your Material/i }));

    await waitFor(() => expect(screen.getByText("A verified summary.")).toBeInTheDocument());
    expect(screen.queryByText("Coverage and curing")).not.toBeInTheDocument();
    expect(screen.queryByText("Application steps")).not.toBeInTheDocument();
    expect(screen.queryByText("Works well with")).not.toBeInTheDocument();
  });

  it("hides the question box when the assistant is not configured, without hiding verified info", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, { ...publishedPayload, assistantAvailable: false })));
    render(<KnowYourMaterialTrigger productId="product-1" productName="Cement" />);

    fireEvent.click(screen.getByRole("button", { name: /Know Your Material/i }));

    await waitFor(() => expect(screen.getByText("A verified summary.")).toBeInTheDocument());
    expect(screen.queryByLabelText(/Ask a question/i)).not.toBeInTheDocument();
    expect(screen.getByText(/not switched on yet/i)).toBeInTheDocument();
  });

  it("asks a question and shows the answer, without persisting it anywhere", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(200, { ...publishedPayload, assistantAvailable: true }))
      .mockResolvedValueOnce(jsonResponse(200, { answer: "Use it on reinforced concrete." }));
    vi.stubGlobal("fetch", fetchMock);
    render(<KnowYourMaterialTrigger productId="product-1" productName="Cement" />);

    fireEvent.click(screen.getByRole("button", { name: /Know Your Material/i }));
    await waitFor(() => expect(screen.getByLabelText(/Ask a question/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Ask a question/i), { target: { value: "Where can I use this?" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    await waitFor(() => expect(screen.getByText("Use it on reinforced concrete.")).toBeInTheDocument());
    expect(screen.getByText("Where can I use this?")).toBeInTheDocument();
  });

  it("shows the API's message when a question cannot be answered, and adds nothing of its own", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(200, { ...publishedPayload, assistantAvailable: true }))
      .mockResolvedValueOnce(jsonResponse(503, { error: "The material assistant is unavailable right now." }));
    vi.stubGlobal("fetch", fetchMock);
    render(<KnowYourMaterialTrigger productId="product-1" productName="Cement" />);

    fireEvent.click(screen.getByRole("button", { name: /Know Your Material/i }));
    await waitFor(() => expect(screen.getByLabelText(/Ask a question/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Ask a question/i), { target: { value: "How much?" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("The material assistant is unavailable right now."),
    );
  });

  it("offers no quantity calculator when coverage was never verified", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, publishedPayload)));
    render(<KnowYourMaterialTrigger productId="product-1" productName="Cement" />);

    fireEvent.click(screen.getByRole("button", { name: /Know Your Material/i }));

    await waitFor(() => expect(screen.getByText("A verified summary.")).toBeInTheDocument());
    expect(screen.queryByText("How much do I need?")).not.toBeInTheDocument();
  });

  it("calculates a quantity from verified coverage, and shows its working", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, {
      ...publishedPayload,
      coverageValue: "4",
      coverageUnit: "sq m per 20 kg bag",
      coverageConditions: "on a smooth surface",
    })));
    render(<KnowYourMaterialTrigger productId="product-1" productName="Cement" />);

    fireEvent.click(screen.getByRole("button", { name: /Know Your Material/i }));
    await waitFor(() => expect(screen.getByText("How much do I need?")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Area to cover/i), { target: { value: "21" } });

    // 21 / 4 = 5.25, rounded up to 6 whole bags.
    expect(screen.getByText("6 20 kg bags")).toBeInTheDocument();
    expect(screen.getByText(/Verified coverage assumes: on a smooth surface/i)).toBeInTheDocument();
  });

  it("labels a wastage allowance as the customer's own, not a verified figure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, {
      ...publishedPayload,
      coverageValue: "4",
      coverageUnit: "sq m per 20 kg bag",
    })));
    render(<KnowYourMaterialTrigger productId="product-1" productName="Cement" />);

    fireEvent.click(screen.getByRole("button", { name: /Know Your Material/i }));
    await waitFor(() => expect(screen.getByText("How much do I need?")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Area to cover/i), { target: { value: "20" } });
    fireEvent.change(screen.getByLabelText(/wastage/i), { target: { value: "10" } });

    expect(screen.getByText("6 20 kg bags")).toBeInTheDocument();
    expect(screen.getByText(/your own choice, not a Buildanta-verified figure/i)).toBeInTheDocument();
  });

  it("links each related material to its product page, and never adds anything to the cart", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, {
      ...publishedPayload,
      relatedMaterials: [{
        role: "PRIMER",
        reason: "Seals the surface before this product goes on.",
        sequenceNote: "Apply at least 4 hours before.",
        relatedProduct: { id: "p2", name: "Buildanta Wall Primer" },
      }],
    })));
    render(<KnowYourMaterialTrigger productId="product-1" productName="Cement" />);

    fireEvent.click(screen.getByRole("button", { name: /Know Your Material/i }));
    await waitFor(() => expect(screen.getByText("Works well with")).toBeInTheDocument());

    const link = screen.getByRole("link", { name: /Buildanta Wall Primer/i });
    expect(link).toHaveAttribute("href", "/products/buildanta-wall-primer");
    expect(screen.getByText("Seals the surface before this product goes on.")).toBeInTheDocument();
    expect(screen.getByText("Apply at least 4 hours before.")).toBeInTheDocument();
    expect(screen.getByText(/Nothing is added to your cart automatically/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add to cart/i })).not.toBeInTheDocument();
  });

  it("shows no related-materials section when staff have curated none", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, publishedPayload)));
    render(<KnowYourMaterialTrigger productId="product-1" productName="Cement" />);

    fireEvent.click(screen.getByRole("button", { name: /Know Your Material/i }));
    await waitFor(() => expect(screen.getByText("A verified summary.")).toBeInTheDocument());

    expect(screen.queryByText("Works well with")).not.toBeInTheDocument();
  });

  // The panel renders inside cart lines. If it can throw during render, it
  // takes the whole cart page down with it — so a malformed payload has to be
  // survivable, not merely unlikely.
  it("survives a malformed API payload without crashing the page around it", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(200, {
      summary: 42,
      useCases: "not an array",
      safetyPrecautions: [null, "Wear gloves", 7],
      relatedMaterials: [{ relatedProduct: null }, "garbage"],
      coverageValue: {},
    })));
    render(
      <div>
        <span>cart line still here</span>
        <KnowYourMaterialTrigger productId="product-1" productName="Cement" />
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Know Your Material/i }));

    await waitFor(() =>
      expect(screen.getByText(/Only the information above has been verified/i)).toBeInTheDocument(),
    );
    // Usable entries survive, unusable ones are dropped, nothing throws.
    expect(screen.getByText("Wear gloves")).toBeInTheDocument();
    expect(screen.queryByText("Works well with")).not.toBeInTheDocument();
    expect(screen.queryByText("How much do I need?")).not.toBeInTheDocument();
    expect(screen.getByText("cart line still here")).toBeInTheDocument();
  });

  it("keeps the surrounding page intact when the knowledge request fails outright", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    render(
      <div>
        <span>cart line still here</span>
        <KnowYourMaterialTrigger productId="product-1" productName="Cement" compact />
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Know Your Material/i }));

    await waitFor(() =>
      expect(screen.getByText("This could not be loaded right now.")).toBeInTheDocument(),
    );
    expect(screen.getByText("cart line still here")).toBeInTheDocument();
  });

  it("shows a plain failure message when the request errors, and never invents content", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    render(<KnowYourMaterialTrigger productId="product-1" productName="Cement" />);

    fireEvent.click(screen.getByRole("button", { name: /Know Your Material/i }));

    await waitFor(() =>
      expect(screen.getByText("This could not be loaded right now.")).toBeInTheDocument(),
    );
  });
});
