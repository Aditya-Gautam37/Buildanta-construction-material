// Turns a package enquiry into a brief a contractor can act on.
//
// Deliberately carries the project and not the person. The customer agreed to
// "Buildanta contacting me about this enquiry" — they did not agree to their
// name and phone number being passed to a contractor. Buildanta stays the
// intermediary until there is a consent flow that says otherwise, so this brief
// contains no contact details at all.

export type RequirementBriefSource = {
  reference: string
  packageNameSnapshot: string
  rateSnapshot: string
  rateBasisSnapshot?: "PLOT_AREA" | "BUILT_UP_AREA" | string
  amountSnapshot: string
  areaSqFt: string
  projectLocation: string | null
  plotDimensions: string | null
  floors: number | null
  constructionType: string | null
  expectedStart: string | null
  requirement: string | null
  createdAt: string
}

// Fields that must never reach a contractor through this brief. Listed
// explicitly so the omission is a decision rather than an oversight.
export const WITHHELD_FROM_CONTRACTOR = [
  "customerName",
  "customerPhone",
  "customerEmail",
] as const

function rupees(value: string): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return value
  return `Rs ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

function line(label: string, value: string | null | undefined): string | null {
  const cleaned = typeof value === "string" ? value.trim() : value
  return cleaned ? `${label}: ${cleaned}` : null
}

/**
 * A plain-text brief staff can paste into WhatsApp or email.
 *
 * Plain text rather than a formatted document because that is how these
 * actually get sent, and because it survives being forwarded.
 */
export function buildRequirementBrief(enquiry: RequirementBriefSource): string {
  const basis = enquiry.rateBasisSnapshot === "BUILT_UP_AREA" ? "built-up area" : "plot area"
  const area = Number(enquiry.areaSqFt)
  const areaText = Number.isFinite(area) ? area.toLocaleString("en-IN") : enquiry.areaSqFt

  const rows = [
    line("Reference", enquiry.reference),
    line("Received", new Date(enquiry.createdAt).toLocaleDateString("en-IN")),
    line("Package enquired about", enquiry.packageNameSnapshot),
    line("Advertised rate", `${rupees(enquiry.rateSnapshot)} per sq ft of ${basis}`),
    line("Area given by customer", `${areaText} sq ft`),
    line("Indicative amount", rupees(enquiry.amountSnapshot)),
    line("Area of Kanpur", enquiry.projectLocation),
    line("Plot size", enquiry.plotDimensions),
    line("Floors", enquiry.floors ? String(enquiry.floors) : null),
    line("Construction type", enquiry.constructionType),
    line("Expected start", enquiry.expectedStart),
  ].filter((row): row is string => row !== null)

  const parts = [
    "Buildanta — project requirement",
    "",
    ...rows,
  ]

  if (enquiry.requirement?.trim()) {
    parts.push("", "Customer notes:", enquiry.requirement.trim())
  }

  parts.push(
    "",
    "The amount above is the advertised rate multiplied by the area the customer",
    "gave. It is not a quotation. Please reply with your quotation after reviewing",
    "the drawings and site.",
    "",
    "Customer contact details are held by Buildanta. Reply to us and we will",
    `arrange the introduction. Quote ${enquiry.reference}.`,
  )

  return parts.join("\n")
}
