import { describe, expect, it } from "vitest";
import {
  estimatePackages,
  formatRange,
  formatRupees,
  MAX_AREA_SQ_FT,
  MIN_AREA_SQ_FT,
  roundCost,
  type ContractorPackage,
} from "./package-estimate";

function pkg(overrides: Partial<ContractorPackage> = {}): ContractorPackage {
  return {
    id: "pkg-1",
    name: "Economy",
    tagline: null,
    ratePerSqFt: "1250",
    inclusions: ["Structure + Plaster Both Sides"],
    bestFor: ["Budget friendly homes"],
    materials: [{ category: "Cement", detail: "MP Birla / JK Lakshmi" }],
    ...overrides,
  };
}

describe("estimatePackages — the arithmetic", () => {
  // The figures a real Kanpur flyer advertises, so the output can be checked
  // against the contractor's own printed example.
  it.each([
    [1250, 900, 1_125_000],
    [1450, 900, 1_305_000],
    [1600, 900, 1_440_000],
  ])("prices %p per sq ft over %p sq ft as %p", (rate, area, expected) => {
    const result = estimatePackages([pkg({ ratePerSqFt: String(rate) })], area);
    expect(result.status).toBe("ok");
    if (result.status === "ok") expect(result.estimates[0]?.totalCost).toBe(expected);
  });

  it("scales with the area, so 500 sq ft costs less than 900", () => {
    const small = estimatePackages([pkg()], 500);
    const large = estimatePackages([pkg()], 900);
    if (small.status === "ok" && large.status === "ok") {
      expect(small.estimates[0]?.totalCost).toBe(625_000);
      expect(large.estimates[0]?.totalCost).toBeGreaterThan(small.estimates[0]!.totalCost);
    }
  });

  it("accepts a rate arriving as a number as well as a decimal string", () => {
    const result = estimatePackages([pkg({ ratePerSqFt: 1250 })], 900);
    if (result.status === "ok") expect(result.estimates[0]?.totalCost).toBe(1_125_000);
  });

  it("handles a fractional rate without leaking pennies into the headline", () => {
    const result = estimatePackages([pkg({ ratePerSqFt: "1333.33" })], 750);
    if (result.status === "ok") expect(result.estimates[0]?.totalCost).toBe(1_000_000);
  });

  it("reports the true lowest and highest across packages", () => {
    const result = estimatePackages([
      pkg({ id: "a", name: "Premium", ratePerSqFt: "1600" }),
      pkg({ id: "b", name: "Economy", ratePerSqFt: "1250" }),
      pkg({ id: "c", name: "Standard", ratePerSqFt: "1450" }),
    ], 900);
    if (result.status === "ok") {
      expect(result.lowest).toBe(1_125_000);
      expect(result.highest).toBe(1_440_000);
    }
  });

  it("keeps packages in the order given, rather than re-sorting by price", () => {
    const result = estimatePackages([
      pkg({ id: "a", name: "Economy" }),
      pkg({ id: "b", name: "Premium", ratePerSqFt: "1600" }),
    ], 900);
    if (result.status === "ok") {
      expect(result.estimates.map((estimate) => estimate.name)).toEqual(["Economy", "Premium"]);
    }
  });
});

describe("estimatePackages — refusing rather than guessing", () => {
  it("is unavailable when the contractor has published no packages", () => {
    expect(estimatePackages([], 900).status).toBe("unavailable");
  });

  it.each(["0", "-1250", "not a number", ""])("ignores an unusable rate of %p", (ratePerSqFt) => {
    expect(estimatePackages([pkg({ ratePerSqFt })], 900).status).toBe("unavailable");
  });

  it("drops only the broken package when others are fine", () => {
    const result = estimatePackages([
      pkg({ id: "broken", ratePerSqFt: "0" }),
      pkg({ id: "good", name: "Standard", ratePerSqFt: "1450" }),
    ], 900);
    if (result.status === "ok") {
      expect(result.estimates).toHaveLength(1);
      expect(result.estimates[0]?.packageId).toBe("good");
    }
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])("rejects an area of %p", (area) => {
    expect(estimatePackages([pkg()], area).status).toBe("invalid");
  });

  it("rejects an implausibly small area rather than showing a tiny total", () => {
    const result = estimatePackages([pkg()], MIN_AREA_SQ_FT - 1);
    expect(result.status).toBe("invalid");
    if (result.status === "invalid") expect(result.reason).toContain(String(MIN_AREA_SQ_FT));
  });

  it("rejects an absurdly large area", () => {
    expect(estimatePackages([pkg()], MAX_AREA_SQ_FT + 1).status).toBe("invalid");
  });

  it("accepts the exact boundary areas", () => {
    expect(estimatePackages([pkg()], MIN_AREA_SQ_FT).status).toBe("ok");
    expect(estimatePackages([pkg()], MAX_AREA_SQ_FT).status).toBe("ok");
  });
});

describe("rounding and formatting", () => {
  it("rounds to the nearest hundred, so no false precision is implied", () => {
    expect(roundCost(1_125_347)).toBe(1_125_300);
    expect(roundCost(1_125_350)).toBe(1_125_400);
  });

  it("formats with Indian digit grouping", () => {
    expect(formatRupees(1_125_000)).toBe("₹11,25,000");
    expect(formatRupees(625_000)).toBe("₹6,25,000");
  });

  it("shows a range across packages", () => {
    expect(formatRange(1_125_000, 1_440_000)).toBe("₹11,25,000 – ₹14,40,000");
  });

  it("collapses to one figure when every package costs the same", () => {
    expect(formatRange(1_125_000, 1_125_000)).toBe("₹11,25,000");
  });
});
