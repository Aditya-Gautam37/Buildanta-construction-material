import { prisma, FulfilmentMode, VariantStatus } from "@workspace/db"

type AreaDefinition = {
  code: string
  name: string
  city: string
  state: string
  pincodes: string[]
  minimumDays: number
  maximumDays: number
}

function inclusivePincodeRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => String(start + index).padStart(6, "0"))
}

const areas: AreaDefinition[] = [
  {
    code: "DELHI-NCR",
    name: "Delhi NCR",
    city: "Delhi NCR",
    state: "Delhi / NCR",
    pincodes: [
      ...inclusivePincodeRange(110001, 110096),
      ...inclusivePincodeRange(121001, 121010),
      ...inclusivePincodeRange(122001, 122018),
      ...inclusivePincodeRange(201001, 201017),
      ...inclusivePincodeRange(201301, 201318),
    ],
    minimumDays: 2,
    maximumDays: 5,
  },
  {
    code: "KANPUR-URBAN",
    name: "Kanpur Urban",
    city: "Kanpur",
    state: "Uttar Pradesh",
    pincodes: inclusivePincodeRange(208001, 208027),
    minimumDays: 3,
    maximumDays: 7,
  },
]

async function main() {
  if (process.env.CONFIRM_SERVICEABILITY_SEED !== "CONFIGURE_LIVE_COVERAGE") {
    throw new Error("Set CONFIRM_SERVICEABILITY_SEED=CONFIGURE_LIVE_COVERAGE before configuring PIN-code coverage.")
  }

  const supplier = await prisma.supplier.findUnique({ where: { email: "catalogue@buildanta.in" } })
  if (!supplier) throw new Error("Run seed:real-catalogue before configuring serviceability.")

  const savedAreas: Array<{ id: string; definition: AreaDefinition }> = []
  for (const definition of areas) {
    const serviceArea = await prisma.serviceArea.upsert({
      where: { code: definition.code },
      update: { name: definition.name, city: definition.city, state: definition.state, active: true },
      create: { code: definition.code, name: definition.name, city: definition.city, state: definition.state, active: true },
    })
    await prisma.pincodeCoverage.createMany({
      data: [...new Set(definition.pincodes)].map((pincode) => ({ serviceAreaId: serviceArea.id, pincode, active: true })),
      skipDuplicates: true,
    })
    await prisma.pincodeCoverage.updateMany({
      where: { serviceAreaId: serviceArea.id, pincode: { in: definition.pincodes } },
      data: { active: true },
    })
    savedAreas.push({ id: serviceArea.id, definition })
  }

  const variants = await prisma.productVariant.findMany({
    where: { status: VariantStatus.ACTIVE, product: { status: "PUBLISHED" } },
    select: { id: true, sku: true },
  })
  for (const variant of variants) {
    const supplierProduct = await prisma.supplierProduct.upsert({
      where: { supplierId_variantId: { supplierId: supplier.id, variantId: variant.id } },
      update: { supplierSku: variant.sku, fulfilmentMode: FulfilmentMode.ON_REQUEST, active: true },
      create: { supplierId: supplier.id, variantId: variant.id, supplierSku: variant.sku, fulfilmentMode: FulfilmentMode.ON_REQUEST, active: true },
    })
    for (const area of savedAreas) {
      const existing = await prisma.supplierLeadTime.findFirst({
        where: { supplierProductId: supplierProduct.id, serviceAreaId: area.id },
      })
      if (existing) {
        await prisma.supplierLeadTime.update({
          where: { id: existing.id },
          data: { minimumDays: area.definition.minimumDays, maximumDays: area.definition.maximumDays },
        })
      } else {
        await prisma.supplierLeadTime.create({
          data: { supplierProductId: supplierProduct.id, serviceAreaId: area.id, minimumDays: area.definition.minimumDays, maximumDays: area.definition.maximumDays },
        })
      }
    }
  }

  console.log(JSON.stringify({
    status: "complete",
    serviceAreas: savedAreas.map((area) => ({ code: area.definition.code, pincodes: area.definition.pincodes.length })),
    coveredPincodes: await prisma.pincodeCoverage.count({ where: { active: true } }),
    activeVariants: variants.length,
    supplierProducts: await prisma.supplierProduct.count({ where: { supplierId: supplier.id, active: true } }),
  }, null, 2))
}

main().catch((error) => { console.error(error); process.exitCode = 1 }).finally(async () => prisma.$disconnect())
