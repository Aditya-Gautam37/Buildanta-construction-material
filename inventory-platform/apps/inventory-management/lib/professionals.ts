export const professionalTypeOptions = [
  { value: "CONTRACTOR", label: "Contractors", singular: "Contractor" },
  { value: "INTERIOR_DESIGNER", label: "Interior Designers", singular: "Interior Designer" },
  { value: "BUILDER", label: "Builders", singular: "Builder" },
  { value: "ARCHITECT", label: "Architects", singular: "Architect" },
  { value: "PRODUCT_OWNER", label: "Product Owners", singular: "Product Owner" },
] as const

export type ProfessionalTypeValue = (typeof professionalTypeOptions)[number]["value"]

export type ProfessionalRecord = {
  id: string
  name: string
  slug: string
  type: ProfessionalTypeValue
  headline: string | null
  bio: string | null
  photoUrl: string | null
  location: string
  yearsExperience: number
  email: string | null
  phone: string | null
  website: string | null
  portfolioUrl: string | null
  services: string[]
  featured: boolean
  published: boolean
  sortOrder: number
  updatedAt: string
}

export type ProfessionalDraft = Omit<ProfessionalRecord, "id" | "updatedAt"> & { id?: string }

// A contractor's advertised rate card. Names are free text because contractors
// market their own package names rather than a fixed Economy/Standard/Premium
// set. Rates move with the market, so these are edited routinely.
export type ContractorPackageMaterialDraft = {
  category: string
  specification: string
  preferredBrands: string | null
  substitutionNote: string | null
}

// The fixed vocabulary that lets two packages be compared row by row. Free
// text here would make the comparison table impossible to align.
export const inclusionCategories = [
  "STRUCTURE", "PLASTER", "ELECTRICAL", "PLUMBING", "FLOORING", "WINDOWS",
  "DOORS", "KITCHEN", "BATHROOM", "PAINT", "CEILING", "ELEVATION",
  "WATER_TANK", "RAILING", "OTHER",
] as const

export type InclusionCategory = (typeof inclusionCategories)[number]

export function inclusionCategoryLabel(category: InclusionCategory) {
  return category.charAt(0) + category.slice(1).toLowerCase().replace(/_/g, " ")
}

export type ContractorPackageInclusionDraft = {
  category: InclusionCategory
  label: string
  // Contractors advertise allowances customers compare directly, e.g.
  // "floor tiles up to Rs 40 per sq ft".
  allowanceAmount: string | null
  allowanceUnit: string | null
}

export type ContractorPackageRecord = {
  id: string
  professionalId: string
  name: string
  tagline: string | null
  // Kept as a string end to end: Prisma Decimal does not survive a float
  // round trip intact, and a rate is money.
  ratePerSqFt: string
  inclusions: ContractorPackageInclusionDraft[]
  exclusions: string[]
  slug: string
  summary: string | null
  terms: string | null
  rateBasis: "PLOT_AREA" | "BUILT_UP_AREA"
  validFrom: string | null
  validUntil: string | null
  status: "DRAFT" | "UNDER_REVIEW" | "PUBLISHED" | "ARCHIVED"
  bestFor: string[]
  materials: ContractorPackageMaterialDraft[]
  sortOrder: number
}

export type ContractorPackageDraft = Omit<ContractorPackageRecord, "id"> & { id?: string }

/**
 * A package may only be published once it can actually price a job, and only
 * while it is still valid. An expired rate card is worse than no rate card:
 * it advertises a price the contractor has stopped honouring.
 */
export function packagePublishIssues(draft: ContractorPackageDraft, now = new Date()): string[] {
  const issues: string[] = []
  if (!draft.name.trim()) issues.push("a package name")
  const rate = Number(draft.ratePerSqFt)
  if (!Number.isFinite(rate) || rate <= 0) issues.push("a rate above zero")
  if (!draft.inclusions.filter((item) => item.label.trim()).length) issues.push("at least one included work")

  const from = draft.validFrom ? new Date(draft.validFrom) : null
  const until = draft.validUntil ? new Date(draft.validUntil) : null
  if (from && Number.isNaN(from.getTime())) issues.push("a valid start date")
  if (until && Number.isNaN(until.getTime())) issues.push("a valid end date")
  if (from && until && !Number.isNaN(from.getTime()) && !Number.isNaN(until.getTime()) && until < from) {
    issues.push("an end date after the start date")
  }
  if (until && !Number.isNaN(until.getTime()) && until < now) issues.push("an end date in the future")

  return issues
}

/** Only contractors advertise construction packages in this release. */
export function canPublishPackages(type: ProfessionalTypeValue): boolean {
  return type === "CONTRACTOR"
}

export function professionalTypeLabel(type: ProfessionalTypeValue, singular = false) {
  const option = professionalTypeOptions.find((item) => item.value === type)
  return singular ? option?.singular ?? type : option?.label ?? type
}
