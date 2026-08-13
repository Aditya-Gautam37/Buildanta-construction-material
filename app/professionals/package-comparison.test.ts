import { describe, expect, it } from "vitest";
import { buildComparison, buildExclusionRow, categoryLabel } from "./package-comparison";
import type { ContractorPackage } from "./package-estimate";

type Inclusion = ContractorPackage["inclusionItems"][number];

function inclusion(category: string, label: string, extra: Partial<Inclusion> = {}): Inclusion {
  return { id: `${category}-${label}`, category, label, description: null, allowanceAmount: null, allowanceUnit: null, ...extra };
}

function pkg(id: string, name: string, inclusionItems: Inclusion[], exclusions: string[] = []): ContractorPackage {
  return {
    id,
    name,
    slug: name.toLowerCase(),
    tagline: null,
    summary: null,
    ratePerSqFt: "1250",
    rateBasis: "PLOT_AREA",
    bestFor: [],
    exclusions,
    terms: null,
    validUntil: null,
    inclusionItems,
    materials: [],
  };
}

describe("buildComparison", () => {
  it("returns nothing for a single package — there is nothing to compare it against", () => {
    expect(buildComparison([pkg("a", "Economy", [inclusion("ELECTRICAL", "Basic wiring")])])).toEqual([]);
  });

  it("returns nothing when the contractor has no packages", () => {
    expect(buildComparison([])).toEqual([]);
  });

  // The whole reason categories exist: two packages word the same trade
  // differently, and only the category can align them.
  it("aligns differently-worded works onto one row via their category", () => {
    const rows = buildComparison([
      pkg("a", "Economy", [inclusion("ELECTRICAL", "Basic electrical wiring")]),
      pkg("b", "Premium", [inclusion("ELECTRICAL", "Premium concealed wiring")]),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.category).toBe("ELECTRICAL");
    expect(rows[0]?.cells[0]?.items).toEqual(["Basic electrical wiring"]);
    expect(rows[0]?.cells[1]?.items).toEqual(["Premium concealed wiring"]);
  });

  it("omits a category no package covers, rather than showing an empty row", () => {
    const rows = buildComparison([
      pkg("a", "Economy", [inclusion("ELECTRICAL", "Wiring")]),
      pkg("b", "Premium", [inclusion("ELECTRICAL", "Wiring")]),
    ]);
    expect(rows.map((row) => row.category)).toEqual(["ELECTRICAL"]);
  });

  // A gap is information: it is precisely what the customer is comparing.
  it("keeps a category one package covers and another does not, leaving the gap visible", () => {
    const rows = buildComparison([
      pkg("a", "Economy", [inclusion("ELECTRICAL", "Wiring")]),
      pkg("b", "Premium", [inclusion("ELECTRICAL", "Wiring"), inclusion("CEILING", "False ceiling")]),
    ]);

    const ceiling = rows.find((row) => row.category === "CEILING");
    expect(ceiling?.cells[0]?.items).toEqual([]);
    expect(ceiling?.cells[1]?.items).toEqual(["False ceiling"]);
  });

  it("orders rows the way a house is built, not alphabetically", () => {
    const rows = buildComparison([
      pkg("a", "Economy", [inclusion("PAINT", "Putty"), inclusion("STRUCTURE", "RCC frame")]),
      pkg("b", "Premium", [inclusion("PAINT", "Premium paint"), inclusion("STRUCTURE", "RCC frame")]),
    ]);
    expect(rows.map((row) => row.category)).toEqual(["STRUCTURE", "PAINT"]);
  });

  it("keeps a cell's several works together in one row", () => {
    const rows = buildComparison([
      pkg("a", "Economy", [inclusion("BATHROOM", "Basic fittings"), inclusion("BATHROOM", "Standard sanitaryware")]),
      pkg("b", "Premium", [inclusion("BATHROOM", "Premium fittings")]),
    ]);
    expect(rows[0]?.cells[0]?.items).toEqual(["Basic fittings", "Standard sanitaryware"]);
  });

  it("shows an allowance alongside the work, since customers compare on it", () => {
    const rows = buildComparison([
      pkg("a", "Economy", [inclusion("FLOORING", "Floor tiles", { allowanceAmount: "40", allowanceUnit: "per sq ft" })]),
      pkg("b", "Premium", [inclusion("FLOORING", "Floor tiles", { allowanceAmount: "90", allowanceUnit: "per sq ft" })]),
    ]);
    expect(rows[0]?.cells[0]?.items).toEqual(["Floor tiles (up to ₹40 per sq ft)"]);
    expect(rows[0]?.cells[1]?.items).toEqual(["Floor tiles (up to ₹90 per sq ft)"]);
  });

  it("ignores an unusable allowance rather than printing a nonsense figure", () => {
    for (const allowanceAmount of ["0", "-5", "abc", ""]) {
      const rows = buildComparison([
        pkg("a", "Economy", [inclusion("FLOORING", "Tiles", { allowanceAmount, allowanceUnit: "per sq ft" })]),
        pkg("b", "Premium", [inclusion("FLOORING", "Tiles")]),
      ]);
      expect(rows[0]?.cells[0]?.items).toEqual(["Tiles"]);
    }
  });

  it("keeps one cell per package, in the order given", () => {
    const rows = buildComparison([
      pkg("a", "Economy", [inclusion("PAINT", "Putty")]),
      pkg("b", "Standard", [inclusion("PAINT", "Emulsion")]),
      pkg("c", "Premium", [inclusion("PAINT", "Premium paint")]),
    ]);
    expect(rows[0]?.cells.map((cell) => cell.packageId)).toEqual(["a", "b", "c"]);
  });
});

describe("buildExclusionRow", () => {
  it("surfaces what a rate does not cover", () => {
    const row = buildExclusionRow([
      pkg("a", "Economy", [], ["Boundary wall", "Modular kitchen"]),
      pkg("b", "Premium", [], ["Boundary wall"]),
    ]);
    expect(row?.label).toBe("Not included");
    expect(row?.cells[0]?.items).toEqual(["Boundary wall", "Modular kitchen"]);
    expect(row?.cells[1]?.items).toEqual(["Boundary wall"]);
  });

  it("is omitted when no package lists exclusions", () => {
    expect(buildExclusionRow([pkg("a", "Economy", []), pkg("b", "Premium", [])])).toBeNull();
  });

  it("needs at least two packages, like the rest of the comparison", () => {
    expect(buildExclusionRow([pkg("a", "Economy", [], ["Boundary wall"])])).toBeNull();
  });
});

describe("categoryLabel", () => {
  it("reads as words rather than database constants", () => {
    expect(categoryLabel("WATER_TANK")).toBe("Water tank");
    expect(categoryLabel("OTHER")).toBe("Other works");
  });

  it("degrades gracefully for a category it has no wording for", () => {
    expect(categoryLabel("SOME_NEW_TRADE")).toBe("Some new trade");
  });
});
