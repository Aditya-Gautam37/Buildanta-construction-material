import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PackageCalculator } from "./package-calculator";
import type { ContractorPackage } from "./package-estimate";

function pkg(overrides: Partial<ContractorPackage> = {}): ContractorPackage {
  return {
    id: "pkg-economy",
    name: "Economy",
    slug: "economy",
    summary: null,
    rateBasis: "PLOT_AREA" as const,
    exclusions: [],
    terms: null,
    validUntil: null,
    tagline: "Budget friendly",
    ratePerSqFt: "1250",
    inclusionItems: [
      { id: "i1", category: "STRUCTURE", label: "Structure + Plaster Both Sides", description: null, allowanceAmount: null, allowanceUnit: null },
      { id: "i2", category: "ELECTRICAL", label: "Basic Electrical Wiring", description: null, allowanceAmount: null, allowanceUnit: null },
    ],
    bestFor: ["Budget friendly homes"],
    materials: [{ category: "Cement", specification: "MP Birla / JK Lakshmi", preferredBrands: null, substitutionNote: null }],
    ...overrides,
  };
}

function renderCalculator(packages: ContractorPackage[]) {
  return render(
    <PackageCalculator
      packages={packages}
      professionalName="Aditya Gautam"
      slug="aditya-gautam"
    />,
  );
}

// A single package's figure appears twice by design: once in the range summary
// and once as that package's total. Scope assertions to the package card.
function totalFor(name: string) {
  const card = screen.getByRole("heading", { name }).closest("article") as HTMLElement;
  return within(card);
}

describe("PackageCalculator", () => {
  it("renders nothing at all when the contractor has published no packages", () => {
    const { container } = renderCalculator([]);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows an estimate for the default area on first render", () => {
    renderCalculator([pkg()]);
    // 1250 × 900
    expect(totalFor("Economy").getByText("₹11,25,000")).toBeInTheDocument();
  });

  it("recalculates live when the area changes", () => {
    renderCalculator([pkg()]);
    fireEvent.change(screen.getByLabelText(/Plot area/i), { target: { value: "500" } });
    // 1250 × 500
    expect(totalFor("Economy").getByText("₹6,25,000")).toBeInTheDocument();
    expect(screen.queryByText("₹11,25,000")).not.toBeInTheDocument();
  });

  it("recalculates from a quick-pick chip", () => {
    renderCalculator([pkg()]);
    fireEvent.click(screen.getByRole("button", { name: "1200 sq ft" }));
    // 1250 × 1200
    expect(totalFor("Economy").getByText("₹15,00,000")).toBeInTheDocument();
  });

  it("shows a range across several packages", () => {
    renderCalculator([
      pkg(),
      pkg({ id: "p2", name: "Standard", ratePerSqFt: "1450" }),
      pkg({ id: "p3", name: "Premium", ratePerSqFt: "1600" }),
    ]);
    expect(screen.getByText("₹11,25,000 – ₹14,40,000")).toBeInTheDocument();
  });

  it("shows each package's inclusions and materials", () => {
    renderCalculator([pkg()]);
    expect(screen.getByText("Structure + Plaster Both Sides")).toBeInTheDocument();
    expect(screen.getByText("Cement")).toBeInTheDocument();
    expect(screen.getByText("MP Birla / JK Lakshmi")).toBeInTheDocument();
  });

  it("rejects an implausible area instead of showing a tiny total", () => {
    renderCalculator([pkg()]);
    fireEvent.change(screen.getByLabelText(/Plot area/i), { target: { value: "5" } });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/₹/)).not.toBeInTheDocument();
  });

  // A figure on a public page that reads like a fixed price is a promise the
  // contractor has to honour.
  it("always states that the figures are estimates, not a quotation", () => {
    renderCalculator([pkg()]);
    const disclaimer = screen.getByText(/It is not a quotation/i);
    expect(disclaimer).toBeInTheDocument();
    expect(disclaimer.textContent).toMatch(/final cost depends on your site/i);
  });

  // The old link sent area and package as query parameters that /bulk-quotes
  // silently discarded. The form now opens in place with that context intact.
  it("opens the enquiry form in place, carrying the package and area", () => {
    renderCalculator([pkg()]);
    fireEvent.change(screen.getByLabelText(/Plot area/i), { target: { value: "1500" } });
    fireEvent.click(screen.getByRole("button", { name: /Request a detailed quotation/i }));

    const form = screen.getByRole("heading", { name: /Request a detailed quotation/i })
      .closest("form") as HTMLElement;

    // The form states the package and area it is about, so the customer can
    // see what they are enquiring on.
    expect(within(form).getByText(/Economy/)).toBeInTheDocument();
    expect(within(form).getByText(/1,500 sq ft/)).toBeInTheDocument();
    expect(within(form).getByLabelText(/Your name/i)).toBeInTheDocument();
    expect(within(form).getByLabelText(/Phone number/i)).toBeInTheDocument();
  });

  it("never links away to a page that would drop the enquiry context", () => {
    const { container } = renderCalculator([pkg()]);
    expect(container.querySelector('a[href*="bulk-quotes"]')).toBeNull();
  });

  it("omits a package whose rate is unusable rather than showing zero", () => {
    renderCalculator([pkg({ id: "broken", name: "Broken", ratePerSqFt: "0" }), pkg()]);
    expect(screen.queryByRole("heading", { name: "Broken" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Economy" })).toBeInTheDocument();
  });
});
