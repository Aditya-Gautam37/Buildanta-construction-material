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
  detail: string
}

export type ContractorPackageRecord = {
  id: string
  professionalId: string
  name: string
  tagline: string | null
  // Kept as a string end to end: Prisma Decimal does not survive a float
  // round trip intact, and a rate is money.
  ratePerSqFt: string
  inclusions: string[]
  bestFor: string[]
  materials: ContractorPackageMaterialDraft[]
  sortOrder: number
  published: boolean
}

export type ContractorPackageDraft = Omit<ContractorPackageRecord, "id"> & { id?: string }

/** A package may only be published once it can actually price a job. */
export function packagePublishIssues(draft: ContractorPackageDraft): string[] {
  const issues: string[] = []
  if (!draft.name.trim()) issues.push("a package name")
  const rate = Number(draft.ratePerSqFt)
  if (!Number.isFinite(rate) || rate <= 0) issues.push("a rate above zero")
  if (!draft.inclusions.filter((item) => item.trim()).length) issues.push("at least one included work")
  return issues
}

export function professionalTypeLabel(type: ProfessionalTypeValue, singular = false) {
  const option = professionalTypeOptions.find((item) => item.value === type)
  return singular ? option?.singular ?? type : option?.label ?? type
}
