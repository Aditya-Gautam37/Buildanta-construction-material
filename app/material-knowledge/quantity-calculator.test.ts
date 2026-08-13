import { describe, expect, it } from "vitest";
import { areaUnitLabel, estimateQuantity, packLabel, type CoverageInput } from "./quantity-calculator";

const coverage = (overrides: Partial<CoverageInput> = {}): CoverageInput => ({
  coverageValue: "4",
  coverageUnit: "sq m per 20 kg bag",
  coverageConditions: "on a smooth, level surface",
  numberOfCoats: null,
  ...overrides,
});

describe("estimateQuantity — refusing rather than guessing", () => {
  it("refuses when no coverage has been verified", () => {
    const result = estimateQuantity(coverage({ coverageValue: null }), 20);
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.reason).toContain("has not verified a coverage figure");
    }
  });

  it("refuses a zero coverage rather than dividing by it", () => {
    expect(estimateQuantity(coverage({ coverageValue: "0" }), 20).status).toBe("unavailable");
  });

  it("refuses a negative coverage rather than flipping the sign", () => {
    expect(estimateQuantity(coverage({ coverageValue: "-4" }), 20).status).toBe("unavailable");
  });

  it("refuses a non-numeric coverage rather than producing NaN", () => {
    expect(estimateQuantity(coverage({ coverageValue: "about four" }), 20).status).toBe("unavailable");
  });
});

describe("estimateQuantity — input validation", () => {
  it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])("rejects an area of %p", (area) => {
    expect(estimateQuantity(coverage(), area).status).toBe("invalid");
  });

  it.each([-1, 101, Number.NaN])("rejects a wastage of %p percent", (wastagePercent) => {
    expect(estimateQuantity(coverage(), 20, { wastagePercent }).status).toBe("invalid");
  });
});

describe("estimateQuantity — the arithmetic", () => {
  it("divides area by coverage when it comes out exact", () => {
    const result = estimateQuantity(coverage(), 20);
    expect(result.status).toBe("ok");
    if (result.status === "ok") expect(result.packs).toBe(5);
  });

  it("rounds up, because a part-used bag still has to be bought", () => {
    const result = estimateQuantity(coverage(), 21);
    if (result.status === "ok") expect(result.packs).toBe(6);
  });

  it("rounds a barely-over amount up to the next whole pack", () => {
    const result = estimateQuantity(coverage(), 20.01);
    if (result.status === "ok") expect(result.packs).toBe(6);
  });

  it("does not add a needless pack when floating-point error makes an exact division look over", () => {
    // 0.1 + 0.2 === 0.30000000000000004; a naive ceil() here returns 4 packs
    // for a job that needs exactly 3.
    const result = estimateQuantity(coverage({ coverageValue: "0.1" }), 0.1 + 0.2);
    if (result.status === "ok") expect(result.packs).toBe(3);
  });

  it("accepts a coverage value that arrives as a number, not just a string", () => {
    const result = estimateQuantity(coverage({ coverageValue: 4 }), 20);
    if (result.status === "ok") expect(result.packs).toBe(5);
  });

  it("handles a fractional coverage rate", () => {
    const result = estimateQuantity(coverage({ coverageValue: "2.5" }), 10);
    if (result.status === "ok") expect(result.packs).toBe(4);
  });

  it("always needs at least one pack for any positive area", () => {
    const result = estimateQuantity(coverage(), 0.001);
    if (result.status === "ok") expect(result.packs).toBe(1);
  });
});

describe("estimateQuantity — coats", () => {
  it("multiplies by the verified number of coats", () => {
    const result = estimateQuantity(coverage({ numberOfCoats: 2 }), 20);
    if (result.status === "ok") {
      expect(result.packs).toBe(10);
      expect(result.coats).toBe(2);
    }
  });

  it("assumes a single coat when none was verified, rather than inventing one", () => {
    const result = estimateQuantity(coverage({ numberOfCoats: null }), 20);
    if (result.status === "ok") {
      expect(result.coats).toBe(1);
      expect(result.packs).toBe(5);
    }
  });

  it("ignores a nonsensical zero or negative coat count", () => {
    for (const numberOfCoats of [0, -2]) {
      const result = estimateQuantity(coverage({ numberOfCoats }), 20);
      if (result.status === "ok") expect(result.coats).toBe(1);
    }
  });
});

describe("estimateQuantity — wastage allowance", () => {
  it("defaults to no wastage, so the figure stays the verified one", () => {
    const result = estimateQuantity(coverage(), 20);
    if (result.status === "ok") {
      expect(result.wastagePercent).toBe(0);
      expect(result.areaWithWastage).toBe(20);
    }
  });

  it("applies the customer's own allowance on top of the area", () => {
    const result = estimateQuantity(coverage(), 20, { wastagePercent: 10 });
    if (result.status === "ok") {
      expect(result.areaWithWastage).toBeCloseTo(22);
      expect(result.packs).toBe(6);
    }
  });

  it("reports back everything needed to show the customer the working", () => {
    const result = estimateQuantity(coverage(), 20, { wastagePercent: 5 });
    if (result.status === "ok") {
      expect(result.area).toBe(20);
      expect(result.coveragePerPack).toBe(4);
      expect(result.coverageUnit).toBe("sq m per 20 kg bag");
      expect(result.conditions).toBe("on a smooth, level surface");
    }
  });
});

describe("unit labels (display only, never used in the maths)", () => {
  it.each([
    ["sq m per 20 kg bag", "sq m", "20 kg bag"],
    ["sq ft per kg", "sq ft", "kg"],
    ["SQ M PER BAG", "SQ M", "BAG"],
  ])("splits %p into area %p and pack %p", (unit, area, pack) => {
    expect(areaUnitLabel(unit)).toBe(area);
    expect(packLabel(unit)).toBe(pack);
  });

  it("falls back to neutral wording when the unit is missing or unparseable", () => {
    expect(areaUnitLabel(null)).toBe("area");
    expect(packLabel(null)).toBe("pack");
    expect(areaUnitLabel("litres")).toBe("litres");
    expect(packLabel("litres")).toBe("pack");
  });
});
