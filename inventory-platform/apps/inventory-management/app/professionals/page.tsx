import { prisma, UserRole } from "@workspace/db"
import { requireStaffAccess } from "@/lib/staff-access"
import type { ProfessionalRecord, ProfessionalTypeValue } from "@/lib/professionals"
import ProfessionalManager from "./professional-manager"

export default async function ProfessionalsPage() {
  await requireStaffAccess("/professionals", { allowedRoles: [UserRole.ADMIN, UserRole.DATA_ENTRY] })

  const records = await prisma.professional.findMany({
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  })
  const professionals: ProfessionalRecord[] = records.map((record) => ({
    ...record,
    type: record.type as ProfessionalTypeValue,
    updatedAt: record.updatedAt.toISOString(),
  }))

  return <ProfessionalManager initialProfessionals={professionals} />
}
