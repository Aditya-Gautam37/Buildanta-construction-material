// Cost estimation for a contractor's published packages.
//
// Deliberately plain arithmetic: rate per square foot multiplied by plot area.
// That is exactly how contractors in Kanpur quote, and matching their own maths
// is what makes the number checkable by the customer against the contractor's
// own flyer.
//
// Nothing here is a quote. The output is an estimate built from rates the
// contractor published, and the UI is required to say so.

export type PackageInclusion = {
  id: string;
  category: string;
  label: string;
  description: string | null;
  allowanceAmount: string | number | null;
  allowanceUnit: string | null;
};

export type PackageMaterial = {
  category: string;
  specification: string;
  preferredBrands: string | null;
  substitutionNote: string | null;
};

export type ContractorPackage = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  summary: string | null;
  ratePerSqFt: string | number;
  // Whether the rate is quoted per sq ft of plot or of built-up area. Drives
  // the calculator's input label so the customer knows which number to enter.
  rateBasis: "PLOT_AREA" | "BUILT_UP_AREA";
  bestFor: string[];
  exclusions: string[];
  terms: string | null;
  validUntil: string | null;
  inclusionItems: PackageInclusion[];
  materials: PackageMaterial[];
};

/** The label for the area input, from the package's own rate basis. */
export function areaLabel(basis: ContractorPackage["rateBasis"]): string {
  return basis === "BUILT_UP_AREA" ? "Built-up area (sq ft)" : "Plot area (sq ft)";
}

export type PackageEstimate = {
  packageId: string;
  name: string;
  ratePerSqFt: number;
  totalCost: number;
};

export type EstimateSummary =
  | { status: "unavailable" }
  | { status: "invalid"; reason: string }
  | { status: "ok"; area: number; estimates: PackageEstimate[]; lowest: number; highest: number };

// Plot areas below this are almost certainly a typo rather than a real plot,
// and a two-digit area produces a nonsensically small headline figure.
export const MIN_AREA_SQ_FT = 100;
export const MAX_AREA_SQ_FT = 100_000;

function parseRate(value: string | number): number | null {
  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

/**
 * Rounds to the nearest 100 rupees. Contractors advertise round figures, and a
 * total like "₹11,25,347" implies a precision this estimate does not have.
 */
export function roundCost(value: number): number {
  return Math.round(value / 100) * 100;
}

export function estimatePackages(packages: ContractorPackage[], area: number): EstimateSummary {
  const usable = packages
    .map((item) => ({ item, rate: parseRate(item.ratePerSqFt) }))
    .filter((entry): entry is { item: ContractorPackage; rate: number } => entry.rate !== null);

  if (!usable.length) return { status: "unavailable" };

  if (!Number.isFinite(area)) return { status: "invalid", reason: "Enter your plot area to see an estimate." };
  if (area < MIN_AREA_SQ_FT) {
    return { status: "invalid", reason: `Enter a plot area of at least ${MIN_AREA_SQ_FT} sq ft.` };
  }
  if (area > MAX_AREA_SQ_FT) {
    return { status: "invalid", reason: `Enter a plot area under ${MAX_AREA_SQ_FT.toLocaleString("en-IN")} sq ft.` };
  }

  const estimates = usable.map(({ item, rate }) => ({
    packageId: item.id,
    name: item.name,
    ratePerSqFt: rate,
    totalCost: roundCost(rate * area),
  }));

  const totals = estimates.map((estimate) => estimate.totalCost);

  return {
    status: "ok",
    area,
    estimates,
    lowest: Math.min(...totals),
    highest: Math.max(...totals),
  };
}

/** Indian digit grouping, e.g. 1125000 -> "₹11,25,000". */
export function formatRupees(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

/** A one-line range, collapsing to a single figure when every package agrees. */
export function formatRange(lowest: number, highest: number): string {
  return lowest === highest
    ? formatRupees(lowest)
    : `${formatRupees(lowest)} – ${formatRupees(highest)}`;
}
