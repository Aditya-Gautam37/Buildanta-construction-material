import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfessionalCard } from "../professional-card";
import { splitCategoriesByAvailability, type PublicProfessional } from "../professional-directory";

function professional(overrides: Partial<PublicProfessional> = {}): PublicProfessional {
  return {
    id: "p1",
    name: "Aditya Gautam",
    slug: "aditya-gautam",
    type: "CONTRACTOR",
    headline: null,
    bio: "full time contractor",
    photoUrl: null,
    location: "kanpur uttarpradesh",
    yearsExperience: 3,
    website: null,
    portfolioUrl: null,
    services: [],
    featured: true,
    ...overrides,
  };
}

describe("splitCategoriesByAvailability", () => {
  it("puts categories that have profiles under available, with real counts", () => {
    const { available } = splitCategoriesByAvailability([professional(), professional({ id: "p2", slug: "b" })]);
    expect(available).toHaveLength(1);
    expect(available[0]?.category.slug).toBe("contractors");
    expect(available[0]?.count).toBe(2);
  });

  it("puts every empty category under coming soon, rather than showing '0 professionals'", () => {
    const { available, comingSoon } = splitCategoriesByAvailability([professional()]);
    const soonSlugs = comingSoon.map((category) => category.slug);
    expect(available.map((entry) => entry.category.slug)).toEqual(["contractors"]);
    expect(soonSlugs).toEqual(["interior-designers", "builders", "architects", "product-owners"]);
  });

  it("treats every category as coming soon when nothing is published", () => {
    const { available, comingSoon } = splitCategoriesByAvailability([]);
    expect(available).toHaveLength(0);
    expect(comingSoon).toHaveLength(5);
  });
});

describe("ProfessionalCard", () => {
  it("shows the real name, formatted location and experience", () => {
    render(<ProfessionalCard professional={professional()} />);

    expect(screen.getByRole("heading", { name: "Aditya Gautam" })).toBeInTheDocument();
    expect(screen.getByText("Kanpur, Uttar Pradesh")).toBeInTheDocument();
    expect(screen.getByText("3 years")).toBeInTheDocument();
  });

  it("renders the professional's actual services", () => {
    render(<ProfessionalCard professional={professional({ services: ["Civil construction", "Renovation", "Site supervision"] })} />);

    expect(screen.getByText("Civil construction")).toBeInTheDocument();
    expect(screen.getByText("Site supervision")).toBeInTheDocument();
  });

  it("shows at most three services, so a long list cannot overrun the card", () => {
    const services = ["One", "Two", "Three", "Four", "Five"];
    const { container } = render(<ProfessionalCard professional={professional({ services })} />);

    expect(container.querySelectorAll(".professional-card-services li")).toHaveLength(3);
  });

  it("omits the services list entirely when the professional has none", () => {
    const { container } = render(<ProfessionalCard professional={professional({ services: [] })} />);
    expect(container.querySelector(".professional-card-services")).toBeNull();
  });

  // The old card invented "Trusted contractor" whenever a headline was
  // missing, which put an unearned claim in the professional's mouth.
  it("invents no headline when the record has none", () => {
    render(<ProfessionalCard professional={professional({ headline: null })} />);
    expect(screen.queryByText(/trusted/i)).not.toBeInTheDocument();
  });

  it("uses no verification language, since there is no verification field", () => {
    const { container } = render(<ProfessionalCard professional={professional({ featured: true })} />);
    expect(container.textContent).not.toMatch(/verified|certified|licen[cs]ed|background.?check/i);
  });

  it("labels the featured flag as a listing, not as a credential", () => {
    render(<ProfessionalCard professional={professional({ featured: true })} />);
    expect(screen.getByText("Featured listing")).toBeInTheDocument();
  });

  it("shows no featured badge when the flag is false", () => {
    render(<ProfessionalCard professional={professional({ featured: false })} />);
    expect(screen.queryByText("Featured listing")).not.toBeInTheDocument();
  });

  it("links the name to the profile under its category slug", () => {
    render(<ProfessionalCard professional={professional()} />);
    const heading = screen.getByRole("heading", { name: "Aditya Gautam" });

    expect(within(heading).getByRole("link")).toHaveAttribute("href", "/professionals/contractors/aditya-gautam");
  });

  it("gives the profile link an accessible name that identifies the professional", () => {
    render(<ProfessionalCard professional={professional()} />);
    expect(screen.getByRole("link", { name: /View Aditya Gautam’s profile/i }))
      .toHaveAttribute("href", "/professionals/contractors/aditya-gautam");
  });

  it("never exposes contact details, which the public API no longer returns", () => {
    const { container } = render(<ProfessionalCard professional={professional()} />);
    expect(container.textContent).not.toMatch(/@|\+91|mailto:|tel:/);
  });
});

describe("ProfessionalCard — package hint", () => {
  const somePackage = (rate: string) => ({
    id: `p-${rate}`, name: "Economy", slug: "economy", tagline: null, summary: null,
    ratePerSqFt: rate, rateBasis: "PLOT_AREA" as const, bestFor: [], exclusions: [],
    terms: null, validUntil: null, inclusionItems: [], materials: [],
  });

  it("shows no starting rate when the professional has no packages", () => {
    const { container } = render(<ProfessionalCard professional={professional()} />);
    expect(container.textContent).not.toMatch(/Packages from/i);
  });

  it("advertises the lowest published rate, not an average or the first listed", () => {
    render(<ProfessionalCard professional={professional({
      packages: [somePackage("1600"), somePackage("1250"), somePackage("1450")],
    })} />);
    expect(screen.getByText("Packages from ₹1,250/sq ft*")).toBeInTheDocument();
  });

  it("links to the packages section and counts them", () => {
    render(<ProfessionalCard professional={professional({
      packages: [somePackage("1250"), somePackage("1450")],
    })} />);
    const link = screen.getByRole("link", { name: /View 2 packages/i });
    expect(link).toHaveAttribute("href", "/professionals/contractors/aditya-gautam#packages");
  });

  it("uses the singular for one package", () => {
    render(<ProfessionalCard professional={professional({ packages: [somePackage("1250")] })} />);
    expect(screen.getByRole("link", { name: /View 1 package$/i })).toBeInTheDocument();
  });

  // A zero or unparseable rate must not become "Packages from ₹0/sq ft".
  it("ignores packages whose rate is unusable", () => {
    const { container } = render(<ProfessionalCard professional={professional({
      packages: [somePackage("0"), somePackage("not-a-number")],
    })} />);
    expect(container.textContent).not.toMatch(/Packages from/i);
  });

  it("marks the figure as indicative rather than a fixed price", () => {
    render(<ProfessionalCard professional={professional({ packages: [somePackage("1250")] })} />);
    expect(screen.getByText(/Packages from ₹1,250\/sq ft\*/)).toBeInTheDocument();
  });
});
