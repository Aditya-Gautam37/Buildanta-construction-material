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
        include: { materials: { orderBy: { sortOrder: "asc" } } },
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
      tagline: item.tagline,
      ratePerSqFt: item.ratePerSqFt.toString(),
      inclusions: item.inclusions,
      bestFor: item.bestFor,
      materials: item.materials.map((material) => ({ category: material.category, detail: material.detail })),
      sortOrder: item.sortOrder,
      published: item.published,
    })),
  )

  return <ProfessionalManager initialProfessionals={professionals} initialPackages={packages} />
}
