import 'dotenv/config'
import { PrismaClient } from './../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

/**
 * Opens the first stocking location.
 *
 * Until a fulfilment location exists there are no inventory balances, and with
 * no balances every product falls through to "available for enquiry" — which is
 * why nothing on the storefront can be added to a cart today. This creates the
 * warehouse, the fulfilment location, and the link to the Kanpur Urban service
 * area that already covers 27 pincodes.
 *
 * It deliberately does not invent stock quantities. Zero-quantity balances
 * would read as "out of stock", which is worse for a shopper than "enquiry",
 * so quantities are set separately once they are known.
 */
const WAREHOUSE = {
  code: 'KNP-01',
  name: 'Kanpur Main Store',
  city: 'Kanpur',
  state: 'Uttar Pradesh',
  pincode: '208001',
}

const SERVICE_AREA_NAME = 'Kanpur Urban'
const APPLY = process.argv.includes('--apply')

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

  const pool = new Pool({ connectionString })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    const existing = await prisma.fulfilmentLocation.findUnique({ where: { code: WAREHOUSE.code } })
    if (existing) {
      console.log(`Fulfilment location ${WAREHOUSE.code} already exists. Nothing to do.`)
      return
    }

    const serviceArea = await prisma.serviceArea.findFirst({
      where: { name: SERVICE_AREA_NAME },
      select: { id: true, name: true, _count: { select: { pincodes: true } } },
    })
    if (!serviceArea) {
      console.log(`REFUSING — no service area named "${SERVICE_AREA_NAME}".`)
      process.exitCode = 1
      return
    }

    console.log(`Warehouse      ${WAREHOUSE.code}  ${WAREHOUSE.name}, ${WAREHOUSE.city} ${WAREHOUSE.pincode}`)
    console.log(`Service area   ${serviceArea.name} (${serviceArea._count.pincodes} pincodes)`)
    console.log(`Mode           STOCKED — Buildanta holds the stock itself`)

    if (!APPLY) {
      console.log('\nDry run. Re-run with --apply to create.')
      return
    }

    const created = await prisma.$transaction(async (tx) => {
      const warehouse = await tx.warehouse.create({ data: { ...WAREHOUSE, active: true } })
      const location = await tx.fulfilmentLocation.create({
        data: {
          code: WAREHOUSE.code,
          name: WAREHOUSE.name,
          type: 'WAREHOUSE',
          mode: 'STOCKED',
          active: true,
          warehouseId: warehouse.id,
        },
      })
      await tx.fulfilmentServiceArea.create({
        data: {
          fulfilmentLocationId: location.id,
          serviceAreaId: serviceArea.id,
          estimatedLeadDays: 2,
          active: true,
        },
      })
      return location
    })

    console.log(`\nCreated fulfilment location ${created.code} (${created.id})`)
    console.log('Next: set quantities on the variants you actually hold, then enable direct purchase on them.')
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
