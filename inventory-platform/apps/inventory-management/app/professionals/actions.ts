"use server"

import { revalidatePath } from "next/cache"
import { prisma, ProfessionalType, UserRole } from "@workspace/db"
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server"
import type { ContractorPackageDraft, ProfessionalDraft, ProfessionalRecord, ProfessionalTypeValue } from "@/lib/professionals"
import { canPublishPackages, packagePublishIssues } from "@/lib/professionals"

async function requireStaff() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Authentication required.")
  const profile = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (!profile || (profile.role !== UserRole.ADMIN && profile.role !== UserRole.DATA_ENTRY)) {
    throw new Error("Inventory staff access is required.")
  }
}

function optional(value: string | null | undefined) {
  const cleaned = value?.trim()
  return cleaned || null
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function validateUrl(value: string | null | undefined, label: string) {
  const cleaned = optional(value)
  if (!cleaned) return null
  try {
    const url = new URL(cleaned)
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error()
    return url.toString()
  } catch {
    throw new Error(`${label} must be a valid http or https link.`)
  }
}

function validateType(value: ProfessionalTypeValue) {
  if (!Object.values(ProfessionalType).includes(value as ProfessionalType)) {
    throw new Error("Choose a valid professional type.")
  }
  return value as ProfessionalType
}

function serialize(record: {
  id: string; name: string; slug: string; type: ProfessionalType; headline: string | null;
  bio: string | null; photoUrl: string | null; location: string; yearsExperience: number;
  email: string | null; phone: string | null; website: string | null; portfolioUrl: string | null;
  services: string[]; featured: boolean; published: boolean; sortOrder: number; updatedAt: Date;
}): ProfessionalRecord {
  return { ...record, type: record.type as ProfessionalTypeValue, updatedAt: record.updatedAt.toISOString() }
}

function cleanDraft(input: ProfessionalDraft) {
  const name = input.name.trim()
  const location = input.location.trim()
  const slug = slugify(input.slug || name)
  if (!name) throw new Error("Name is required.")
  if (!location) throw new Error("Location is required.")
  if (!slug) throw new Error("A valid profile URL slug is required.")
  if (!Number.isInteger(input.yearsExperience) || input.yearsExperience < 0 || input.yearsExperience > 80) {
    throw new Error("Experience must be a whole number between 0 and 80.")
  }
  return {
    name,
    slug,
    type: validateType(input.type),
    headline: optional(input.headline),
    bio: optional(input.bio),
    photoUrl: validateUrl(input.photoUrl, "Photo URL"),
    location,
    yearsExperience: input.yearsExperience,
    email: optional(input.email),
    phone: optional(input.phone),
    website: validateUrl(input.website, "Website"),
    portfolioUrl: validateUrl(input.portfolioUrl, "Portfolio link"),
    services: [...new Set(input.services.map((item) => item.trim()).filter(Boolean))].slice(0, 30),
    featured: Boolean(input.featured),
    published: Boolean(input.published),
    sortOrder: Number.isInteger(input.sortOrder) ? input.sortOrder : 0,
  }
}

export async function saveProfessionalAction(input: ProfessionalDraft) {
  try {
    await requireStaff()
    const data = cleanDraft(input)
    const professional = input.id
      ? await prisma.professional.update({ where: { id: input.id }, data })
      : await prisma.professional.create({ data })
    revalidatePath("/professionals")
    return { ok: true as const, professional: serialize(professional) }
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : ""
    return { ok: false as const, error: code === "P2002" ? "That profile URL is already in use. Change the slug." : error instanceof Error ? error.message : "Unable to save professional." }
  }
}

export async function deleteProfessionalAction(id: string) {
  try {
    await requireStaff()
    await prisma.professional.delete({ where: { id } })
    revalidatePath("/professionals")
    return { ok: true as const }
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unable to delete professional." }
  }
}

// ---------------------------------------------------------------------------
// Contractor packages (rate cards)
// ---------------------------------------------------------------------------

function optionalDate(value: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) throw new Error("Enter valid validity dates.")
  return parsed
}

function cleanPackageDraft(input: ContractorPackageDraft) {
  const rate = Number(input.ratePerSqFt)
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("Enter a rate per sq ft above zero.")
  if (!input.name.trim()) throw new Error("Enter a package name.")

  const slug = slugify(input.slug?.trim() || input.name)
  if (!slug) throw new Error("Enter a package name that produces a valid web address.")

  return {
    professionalId: input.professionalId,
    name: input.name.trim(),
    slug,
    tagline: optional(input.tagline),
    summary: optional(input.summary),
    ratePerSqFt: rate.toFixed(2),
    rateBasis: input.rateBasis === "BUILT_UP_AREA" ? "BUILT_UP_AREA" as const : "PLOT_AREA" as const,
    bestFor: input.bestFor.map((item) => item.trim()).filter(Boolean),
    exclusions: (input.exclusions ?? []).map((item) => item.trim()).filter(Boolean),
    terms: optional(input.terms),
    validFrom: optionalDate(input.validFrom),
    validUntil: optionalDate(input.validUntil),
    sortOrder: Number.isInteger(input.sortOrder) ? input.sortOrder : 0,
    status: input.status ?? "DRAFT",
  }
}

export async function saveContractorPackageAction(input: ContractorPackageDraft) {
  try {
    await requireStaff()
    const data = cleanPackageDraft(input)

    // Only contractors advertise construction packages in this release, and
    // the rule is enforced here rather than only in the UI — the action is
    // callable directly.
    const owner = await prisma.professional.findUnique({
      where: { id: data.professionalId },
      select: { type: true },
    })
    if (!owner) throw new Error("That professional no longer exists.")
    if (!canPublishPackages(owner.type as ProfessionalTypeValue)) {
      throw new Error("Only contractors can have construction packages.")
    }

    // Publishing is what makes a rate card customer-visible, so an incomplete
    // or expired one must not slip through even if the UI allowed it.
    if (data.status === "PUBLISHED") {
      const issues = packagePublishIssues({ ...input, ratePerSqFt: data.ratePerSqFt })
      if (issues.length) throw new Error(`Cannot publish: add ${issues.join(", ")}.`)
    }

    const materials = input.materials
      .map((material, index) => ({
        category: material.category.trim(),
        specification: material.specification.trim(),
        preferredBrands: optional(material.preferredBrands),
        substitutionNote: optional(material.substitutionNote),
        sortOrder: index,
      }))
      .filter((material) => material.category && material.specification)

    const inclusions = input.inclusions
      .map((item, index) => {
        const allowance = item.allowanceAmount?.trim()
        const parsed = allowance ? Number(allowance) : null
        if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
          throw new Error("Allowance amounts must be zero or more.")
        }
        return {
          category: item.category,
          label: item.label.trim(),
          allowanceAmount: parsed === null ? null : parsed.toFixed(2),
          allowanceUnit: optional(item.allowanceUnit),
          sortOrder: index,
        }
      })
      .filter((item) => item.label)

    const saved = await prisma.$transaction(async (tx) => {
      const record = input.id
        ? await tx.contractorPackage.update({ where: { id: input.id }, data })
        : await tx.contractorPackage.create({ data })

      // Materials and inclusions are small ordered lists edited as a whole, so
      // replacing them keeps the saved state exactly what the form showed.
      await tx.contractorPackageMaterial.deleteMany({ where: { packageId: record.id } })
      if (materials.length) {
        await tx.contractorPackageMaterial.createMany({
          data: materials.map((material) => ({ ...material, packageId: record.id })),
        })
      }

      await tx.contractorPackageInclusion.deleteMany({ where: { packageId: record.id } })
      if (inclusions.length) {
        await tx.contractorPackageInclusion.createMany({
          data: inclusions.map((item) => ({ ...item, packageId: record.id })),
        })
      }
      return record
    })

    revalidatePath("/professionals")
    return { ok: true as const, packageId: saved.id }
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : ""
    return {
      ok: false as const,
      error: code === "P2002"
        ? "This contractor already has a package with that name."
        : error instanceof Error ? error.message : "Unable to save package.",
    }
  }
}

export async function deleteContractorPackageAction(id: string) {
  try {
    await requireStaff()
    await prisma.contractorPackage.delete({ where: { id } })
    revalidatePath("/professionals")
    return { ok: true as const }
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unable to delete package." }
  }
}

/**
 * Duplicates a package. Economy -> Standard is mostly a copy with a different
 * rate, so this saves staff retyping a dozen inclusions. The copy always lands
 * as a DRAFT: publishing is a deliberate act, never a side effect.
 */
export async function duplicateContractorPackageAction(id: string) {
  try {
    await requireStaff()
    const source = await prisma.contractorPackage.findUnique({
      where: { id },
      include: { inclusionItems: true, materials: true },
    })
    if (!source) throw new Error("That package no longer exists.")

    const siblings = await prisma.contractorPackage.count({ where: { professionalId: source.professionalId } })

    // Find a free name and slug rather than failing on the unique constraint.
    let suffix = 2
    let name = `${source.name} copy`
    let slug = `${source.slug}-copy`
    while (await prisma.contractorPackage.findFirst({
      where: { professionalId: source.professionalId, OR: [{ name }, { slug }] },
      select: { id: true },
    })) {
      name = `${source.name} copy ${suffix}`
      slug = `${source.slug}-copy-${suffix}`
      suffix += 1
    }

    const created = await prisma.$transaction(async (tx) => {
      const record = await tx.contractorPackage.create({
        data: {
          professionalId: source.professionalId,
          name,
          slug,
          tagline: source.tagline,
          summary: source.summary,
          ratePerSqFt: source.ratePerSqFt,
          rateBasis: source.rateBasis,
          bestFor: source.bestFor,
          exclusions: source.exclusions,
          terms: source.terms,
          validFrom: source.validFrom,
          validUntil: source.validUntil,
          sortOrder: siblings,
          status: "DRAFT",
        },
      })
      if (source.inclusionItems.length) {
        await tx.contractorPackageInclusion.createMany({
          data: source.inclusionItems.map((item) => ({
            packageId: record.id,
            category: item.category,
            label: item.label,
            description: item.description,
            allowanceAmount: item.allowanceAmount,
            allowanceUnit: item.allowanceUnit,
            sortOrder: item.sortOrder,
          })),
        })
      }
      if (source.materials.length) {
        await tx.contractorPackageMaterial.createMany({
          data: source.materials.map((material) => ({
            packageId: record.id,
            category: material.category,
            specification: material.specification,
            preferredBrands: material.preferredBrands,
            substitutionNote: material.substitutionNote,
            sortOrder: material.sortOrder,
          })),
        })
      }
      return record
    })

    revalidatePath("/professionals")
    return { ok: true as const, packageId: created.id }
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unable to duplicate package." }
  }
}

/** Moves a package one place up or down in the order customers see. */
export async function reorderContractorPackageAction(id: string, direction: "up" | "down") {
  try {
    await requireStaff()
    const target = await prisma.contractorPackage.findUnique({
      where: { id },
      select: { id: true, professionalId: true, sortOrder: true },
    })
    if (!target) throw new Error("That package no longer exists.")

    const siblings = await prisma.contractorPackage.findMany({
      where: { professionalId: target.professionalId },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    })
    const index = siblings.findIndex((item) => item.id === id)
    const swapWith = direction === "up" ? index - 1 : index + 1
    if (index === -1 || swapWith < 0 || swapWith >= siblings.length) {
      return { ok: true as const }
    }

    // Rewrite every sortOrder from the reordered list, so the sequence stays
    // dense even if it had gaps or duplicates before.
    const reordered = [...siblings]
    const moved = reordered[index]!
    reordered[index] = reordered[swapWith]!
    reordered[swapWith] = moved

    await prisma.$transaction(
      reordered.map((item, position) =>
        prisma.contractorPackage.update({ where: { id: item.id }, data: { sortOrder: position } }),
      ),
    )

    revalidatePath("/professionals")
    return { ok: true as const }
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unable to reorder packages." }
  }
}
