// Builds the package comparison table.
//
// Comparison works off the inclusion category, never off parsing the label
// text. Two contractors write "Concealed electrical wiring" and "Electrical -
// concealed" for the same thing; only the category they were filed under can
// line those up in the same row.

import type { ContractorPackage } from "./package-estimate";

// Roughly the order a house gets built in, so the table reads like a project
// rather than an alphabetical list.
export const CATEGORY_ORDER = [
  "STRUCTURE", "PLASTER", "ELECTRICAL", "PLUMBING", "FLOORING", "WINDOWS",
  "DOORS", "KITCHEN", "BATHROOM", "PAINT", "CEILING", "ELEVATION",
  "WATER_TANK", "RAILING", "OTHER",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  STRUCTURE: "Structure",
  PLASTER: "Plaster",
  ELECTRICAL: "Electrical",
  PLUMBING: "Plumbing",
  FLOORING: "Flooring",
  WINDOWS: "Windows",
  DOORS: "Doors",
  KITCHEN: "Kitchen",
  BATHROOM: "Bathroom",
  PAINT: "Paint",
  CEILING: "Ceiling",
  ELEVATION: "Elevation",
  WATER_TANK: "Water tank",
  RAILING: "Railing",
  OTHER: "Other works",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category]
    ?? category.charAt(0) + category.slice(1).toLowerCase().replace(/_/g, " ");
}

export type ComparisonCell = {
  packageId: string;
  /** Empty when this package includes nothing in this category. */
  items: string[];
};

export type ComparisonRow = {
  category: string;
  label: string;
  cells: ComparisonCell[];
};

function describeInclusion(item: ContractorPackage["inclusionItems"][number]): string {
  const allowance = item.allowanceAmount == null || item.allowanceAmount === ""
    ? null
    : Number(item.allowanceAmount);
  if (allowance === null || !Number.isFinite(allowance) || allowance <= 0) return item.label;
  const amount = `₹${allowance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  return item.allowanceUnit
    ? `${item.label} (up to ${amount} ${item.allowanceUnit})`
    : `${item.label} (up to ${amount})`;
}

/**
 * One row per category any package covers. A category no package mentions is
 * omitted entirely — an empty row teaches the customer nothing. A category some
 * packages cover and others do not is kept, with blank cells, because that
 * absence is exactly what a customer is comparing.
 */
export function buildComparison(packages: ContractorPackage[]): ComparisonRow[] {
  if (packages.length < 2) return [];

  const rows: ComparisonRow[] = [];

  for (const category of CATEGORY_ORDER) {
    const cells = packages.map((pkg) => ({
      packageId: pkg.id,
      items: pkg.inclusionItems
        .filter((item) => item.category === category)
        .map(describeInclusion),
    }));

    if (cells.some((cell) => cell.items.length > 0)) {
      rows.push({ category, label: categoryLabel(category), cells });
    }
  }

  return rows;
}

/**
 * Exclusions get their own row and are never collapsed away: what a rate does
 * not cover is the part a customer is most likely to be surprised by.
 */
export function buildExclusionRow(packages: ContractorPackage[]): ComparisonRow | null {
  if (packages.length < 2) return null;
  const cells = packages.map((pkg) => ({ packageId: pkg.id, items: pkg.exclusions }));
  return cells.some((cell) => cell.items.length > 0)
    ? { category: "EXCLUSIONS", label: "Not included", cells }
    : null;
}
