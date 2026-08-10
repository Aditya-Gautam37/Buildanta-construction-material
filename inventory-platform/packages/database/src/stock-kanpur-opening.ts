import 'dotenv/config'
import { PrismaClient } from './../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

/**
 * Opening stock for Kanpur, and the first products a customer can actually buy.
 *
 * Chosen as what a building-material store genuinely keeps on the floor:
 * cement and blocks that move by the lorry-load, one paint, one tile, one wire.
 * Deliberately excluded are the made-to-measure and fitted lines — windows,
 * doors, sanitaryware — which a store sells on order rather than off the shelf,
 * and which stay on enquiry.
 *
 * Every line is DIRECT_AND_QUOTE rather than direct-only: a customer buying
 * five bags should check out, a builder buying three hundred should be talking
 * to someone. bulkQuoteThreshold is where that switch happens.
 */
type StockLine = {
  sku: string
  quantity: number
  lowStockThreshold: number
  bulkQuoteThreshold: number
  maxDirectQuantity: number
  quantityIncrement?: number
}

const OPENING_STOCK: StockLine[] = [
  // Cement — the highest-turnover line in any building store.
  { sku: 'UTC-OPC53-50KG', quantity: 500, lowStockThreshold: 50, bulkQuoteThreshold: 100, maxDirectQuantity: 200 },
  { sku: 'UTC-PPC-50KG', quantity: 400, lowStockThreshold: 50, bulkQuoteThreshold: 100, maxDirectQuantity: 200 },

  // AAC blocks — sold by the piece, ordered by the hundred.
  { sku: 'MAG-AAC-600-100', quantity: 800, lowStockThreshold: 100, bulkQuoteThreshold: 500, maxDirectQuantity: 1000 },
  { sku: 'MAG-AAC-600-150', quantity: 600, lowStockThreshold: 100, bulkQuoteThreshold: 500, maxDirectQuantity: 1000 },
  { sku: 'MAG-AAC-600-200', quantity: 400, lowStockThreshold: 80, bulkQuoteThreshold: 400, maxDirectQuantity: 800 },

  // Interior paint — shelf stock, small baskets.
  { sku: 'AP-ROYALE-20L-WHITE', quantity: 40, lowStockThreshold: 6, bulkQuoteThreshold: 15, maxDirectQuantity: 30 },
  { sku: 'AP-ROYALE-10L-WHITE', quantity: 30, lowStockThreshold: 6, bulkQuoteThreshold: 20, maxDirectQuantity: 40 },
  { sku: 'AP-ROYALE-4L-WHITE', quantity: 50, lowStockThreshold: 10, bulkQuoteThreshold: 30, maxDirectQuantity: 60 },

  // Floor tiles — by the box.
  { sku: 'KAJ-GVT-600-1200-GLOSS', quantity: 120, lowStockThreshold: 20, bulkQuoteThreshold: 60, maxDirectQuantity: 100 },
  { sku: 'KAJ-GVT-600-600-GLOSS', quantity: 200, lowStockThreshold: 30, bulkQuoteThreshold: 80, maxDirectQuantity: 150 },

  // House wire — by the coil.
  { sku: 'POLY-ETIRA-1.5-90', quantity: 60, lowStockThreshold: 10, bulkQuoteThreshold: 25, maxDirectQuantity: 50 },
  { sku: 'POLY-ETIRA-2.5-90', quantity: 45, lowStockThreshold: 8, bulkQuoteThreshold: 20, maxDirectQuantity: 40 },
  { sku: 'POLY-ETIRA-4.0-90', quantity: 25, lowStockThreshold: 5, bulkQuoteThreshold: 15, maxDirectQuantity: 30 },
]

const LOCATION_CODE = 'KNP-01'
const APPLY = process.argv.includes('--apply')

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

  const pool = new Pool({ connectionString })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    const location = await prisma.fulfilmentLocation.findUnique({ where: { code: LOCATION_CODE }, select: { id: true, name: true } })
    if (!location) {
      console.log(`REFUSING — no fulfilment location ${LOCATION_CODE}. Run db:setup-kanpur-location first.`)
      process.exitCode = 1
      return
    }

    console.log(`Location: ${location.name} (${LOCATION_CODE})\n`)
    let applied = 0
    const unknown: string[] = []

    for (const line of OPENING_STOCK) {
      const variant = await prisma.productVariant.findUnique({
        where: { sku: line.sku },
        select: { id: true, sku: true, minimumOrderQuantity: true, product: { select: { name: true, brand: { select: { name: true } } } } },
      })
      if (!variant) {
        unknown.push(line.sku)
        continue
      }

      console.log(
        `  ${line.sku.padEnd(24)} ${String(line.quantity).padStart(5)} units   ` +
          `quote above ${String(line.bulkQuoteThreshold).padStart(4)}   ${variant.product.brand.name} ${variant.product.name}`,
      )

      if (APPLY) {
        await prisma.$transaction(async (tx) => {
          await tx.inventoryBalance.upsert({
            where: { variantId_fulfilmentLocationId: { variantId: variant.id, fulfilmentLocationId: location.id } },
            create: {
              variantId: variant.id,
              fulfilmentLocationId: location.id,
              physicalQuantity: line.quantity,
              lowStockThreshold: line.lowStockThreshold,
            },
            update: { physicalQuantity: line.quantity, lowStockThreshold: line.lowStockThreshold },
          })
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              purchaseMode: 'DIRECT_AND_QUOTE',
              directCheckoutEnabled: true,
              bulkQuoteThreshold: line.bulkQuoteThreshold,
              maxDirectQuantity: line.maxDirectQuantity,
              quantityIncrement: line.quantityIncrement ?? 1,
              // Kept in step with the balance so the legacy stock fields do not
              // contradict the location-aware ones.
              stockTracked: true,
              stockQuantity: line.quantity,
              lowStockThreshold: line.lowStockThreshold,
            },
          })
        })
      }
      applied += 1
    }

    if (unknown.length > 0) {
      console.log(`\n  SKU NOT FOUND: ${unknown.join(', ')}`)
    }

    console.log(`\n${APPLY ? 'Stocked' : 'Would stock'}: ${applied} variants across ${new Set(OPENING_STOCK.map((line) => line.sku.split('-')[0])).size} brands`)
    if (!APPLY) console.log('Dry run. Re-run with --apply to write.')
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
