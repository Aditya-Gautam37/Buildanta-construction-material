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

export function professionalTypeLabel(type: ProfessionalTypeValue, singular = false) {
  const option = professionalTypeOptions.find((item) => item.value === type)
  return singular ? option?.singular ?? type : option?.label ?? type
}
