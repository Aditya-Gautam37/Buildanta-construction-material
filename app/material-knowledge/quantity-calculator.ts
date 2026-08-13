// Deterministic quantity estimation for "Know Your Material".
//
// This is plain arithmetic on purpose. The AI assistant is explicitly
// forbidden from calculating quantities, because a confidently wrong bag count
// costs a customer real money on a real site. Everything here is pure,
// testable, and shows its working to the customer.
//
// Deliberate non-goal: unit conversion. The coverage unit is free text an
// admin typed ("sq m per 20 kg bag", "sq ft per kg"). Parsing that into a
// dimensioned quantity would silently produce wrong numbers the day someone
// writes it differently. Instead the customer enters an area in the same unit
// the coverage is quoted in, and that unit is shown verbatim throughout.

export type CoverageInput = {
  coverageValue: string | number | null;
  coverageUnit: string | null;
  coverageConditions: string | null;
  numberOfCoats: number | null;
};

export type EstimateResult =
  | { status: "unavailable"; reason: string }
  | { status: "invalid"; reason: string }
  | {
      status: "ok";
      packs: number;
      area: number;
      coats: number;
      coveragePerPack: number;
      wastagePercent: number;
      areaWithWastage: number;
      coverageUnit: string | null;
      conditions: string | null;
    };

// Guards against the values that would make the arithmetic meaningless rather
// than merely wrong: a coverage of 0 divides to Infinity, a negative one flips
// the sign, and a non-finite one poisons every downstream number.
function parseCoverage(value: string | number | null): number | null {
  if (value == null) return null;
  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function estimateQuantity(
  coverage: CoverageInput,
  area: number,
  options: { wastagePercent?: number } = {},
): EstimateResult {
  const coveragePerPack = parseCoverage(coverage.coverageValue);
  if (coveragePerPack === null) {
    return {
      status: "unavailable",
      reason: "Buildanta has not verified a coverage figure for this product, so we cannot estimate a quantity. Check the product label or technical data sheet.",
    };
  }

  if (!Number.isFinite(area) || area <= 0) {
    return { status: "invalid", reason: "Enter an area greater than zero." };
  }

  const wastagePercent = options.wastagePercent ?? 0;
  if (!Number.isFinite(wastagePercent) || wastagePercent < 0 || wastagePercent > 100) {
    return { status: "invalid", reason: "Wastage allowance must be between 0 and 100 percent." };
  }

  // A blank "number of coats" means the admin did not verify one. Treating it
  // as 1 is the honest reading: apply the coverage as quoted, and do not
  // silently multiply by a number nobody confirmed.
  const coats = coverage.numberOfCoats != null && coverage.numberOfCoats > 0
    ? Math.floor(coverage.numberOfCoats)
    : 1;

  const areaWithWastage = area * (1 + wastagePercent / 100);

  // Round up: packs are sold whole, and rounding down leaves a job unfinished.
  // The tiny epsilon absorbs binary floating-point error so an exact division
  // (0.1 + 0.2 style) does not push the customer to an extra unneeded pack.
  const exact = (areaWithWastage * coats) / coveragePerPack;
  const packs = Math.ceil(Number(exact.toFixed(6)));

  return {
    status: "ok",
    packs,
    area,
    coats,
    coveragePerPack,
    wastagePercent,
    areaWithWastage,
    coverageUnit: coverage.coverageUnit,
    conditions: coverage.coverageConditions,
  };
}

// Display helper only — never feeds the arithmetic. Turns "sq m per 20 kg bag"
// into "sq m" so the area input can be labelled in the customer's own terms.
// Falls back to a neutral label rather than guessing.
export function areaUnitLabel(coverageUnit: string | null): string {
  if (!coverageUnit) return "area";
  const [beforePer] = coverageUnit.split(/\bper\b/i);
  const trimmed = (beforePer ?? "").trim();
  return trimmed || "area";
}

// Likewise display-only: the pack noun, e.g. "20 kg bag" from
// "sq m per 20 kg bag".
export function packLabel(coverageUnit: string | null): string {
  if (!coverageUnit) return "pack";
  const match = coverageUnit.split(/\bper\b/i);
  const afterPer = match.length > 1 ? match[match.length - 1] : "";
  const trimmed = (afterPer ?? "").trim();
  return trimmed || "pack";
}
