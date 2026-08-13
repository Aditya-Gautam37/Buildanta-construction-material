import { prisma, UserRole } from "@workspace/db"
import { requireStaffAccess } from "@/lib/staff-access"
import type { ContractorPackageRecord, ProfessionalRecord, ProfessionalTypeValue } from "@/lib/professionals"
import ProfessionalManager from "./professional-manager"

export default async function ProfessionalsPage() {
  await requireStaffAccess("/professionals", { allowedRoles: [UserRole.ADMIN, UserRole.DATA_ENTRY] })

  const records = await prisma.professional.findMany({
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: {
      packages: {
        orderBy: { sortOrder: "asc" },
        include: {
          materials: { orderBy: { sortOrder: "asc" } },
          inclusionItems: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  })

  const professionals: ProfessionalRecord[] = records.map((record) => ({
    ...record,
    type: record.type as ProfessionalTypeValue,
    updatedAt: record.updatedAt.toISOString(),
  }))

  // Decimal and Date do not cross the server/client boundary, so packages are
  // flattened to plain values here rather than in the client component.
  const packages: ContractorPackageRecord[] = records.flatMap((record) =>
    record.packages.map((item) => ({
      id: item.id,
      professionalId: item.professionalId,
      name: item.name,
      slug: item.slug,
      tagline: item.tagline,
      summary: item.summary,
      ratePerSqFt: item.ratePerSqFt.toString(),
      rateBasis: item.rateBasis,
      inclusions: item.inclusionItems.map((inclusion) => inclusion.label),
      bestFor: item.bestFor,
      exclusions: item.exclusions,
      terms: item.terms,
      validFrom: item.validFrom ? item.validFrom.toISOString().slice(0, 10) : null,
      validUntil: item.validUntil ? item.validUntil.toISOString().slice(0, 10) : null,
      materials: item.materials.map((material) => ({
        category: material.category,
        specification: material.specification,
        preferredBrands: material.preferredBrands,
        substitutionNote: material.substitutionNote,
      })),
      sortOrder: item.sortOrder,
      status: item.status,
    })),
  )

  return <ProfessionalManager initialProfessionals={professionals} initialPackages={packages} />
}
