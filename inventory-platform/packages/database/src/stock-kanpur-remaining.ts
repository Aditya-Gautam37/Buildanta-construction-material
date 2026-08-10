import 'dotenv/config'
import { PrismaClient } from './../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

/**
 * Opening stock for the remaining 36 variants at Kanpur, so the buy button that
 * is already showing on them has real stock behind it instead of letting a
 * customer order what is not held.
 *
 * Quantities are sensible defaults for a building-material store, not counts of
 * what is physically on the floor. The operator asked for reasonable numbers to
 * start from and will correct them in Stock & locations. Made-to-measure lines
 * (windows) get modest per-square-metre floors, since they are really sold to
 * order — those numbers especially are placeholders.
 */
type StockLine = {
  sku: string
  quantity: number
  lowStockThreshold: number
  bulkQuoteThreshold: number
  maxDirectQuantity: number
}

const STOCK: StockLine[] = [
  // Anchor modular switches
  { sku: 'ANCH-ROMA-6A-1W', quantity: 100, lowStockThreshold: 15, bulkQuoteThreshold: 50, maxDirectQuantity: 100 },
  { sku: 'ANCH-ROMA-6A-2W', quantity: 80, lowStockThreshold: 12, bulkQuoteThreshold: 40, maxDirectQuantity: 80 },
  { sku: 'ANCH-ROMA-16A-1W', quantity: 60, lowStockThreshold: 10, bulkQuoteThreshold: 40, maxDirectQuantity: 80 },

  // Asian Paints Apex Ultima exterior
  { sku: 'AP-APEXULT-20L', quantity: 30, lowStockThreshold: 6, bulkQuoteThreshold: 15, maxDirectQuantity: 30 },
  { sku: 'AP-APEXULT-10L', quantity: 40, lowStockThreshold: 8, bulkQuoteThreshold: 20, maxDirectQuantity: 40 },

  // Asian Paints Decoprime primer
  { sku: 'AP-DECOPRIME-WT-20L', quantity: 25, lowStockThreshold: 6, bulkQuoteThreshold: 15, maxDirectQuantity: 30 },
  { sku: 'AP-DECOPRIME-ST-20L', quantity: 20, lowStockThreshold: 5, bulkQuoteThreshold: 15, maxDirectQuantity: 30 },

  // CenturyPly flush doors
  { sku: 'CENT-S710-2100-900', quantity: 15, lowStockThreshold: 4, bulkQuoteThreshold: 10, maxDirectQuantity: 20 },
  { sku: 'CENT-S710-2100-750', quantity: 15, lowStockThreshold: 4, bulkQuoteThreshold: 10, maxDirectQuantity: 20 },

  // Dr. Fixit
  { sku: 'DRFIX-BATHSEAL-15KG', quantity: 20, lowStockThreshold: 5, bulkQuoteThreshold: 12, maxDirectQuantity: 25 },
  { sku: 'DRFIX-ROOFSEAL-20L', quantity: 25, lowStockThreshold: 6, bulkQuoteThreshold: 15, maxDirectQuantity: 30 },

  // Fenesta uPVC windows (per sq m — made to measure, placeholders)
  { sku: 'FEN-UPVC-2T-CLEAR', quantity: 40, lowStockThreshold: 10, bulkQuoteThreshold: 25, maxDirectQuantity: 60 },
  { sku: 'FEN-UPVC-3T-MESH', quantity: 30, lowStockThreshold: 8, bulkQuoteThreshold: 20, maxDirectQuantity: 50 },

  // Godrej mortise locks
  { sku: 'GOD-MORTISE-SATIN', quantity: 30, lowStockThreshold: 6, bulkQuoteThreshold: 20, maxDirectQuantity: 40 },
  { sku: 'GOD-MORTISE-ANTIQUE', quantity: 25, lowStockThreshold: 5, bulkQuoteThreshold: 20, maxDirectQuantity: 40 },

  // Gyproc ceiling / drywall
  { sku: 'GYPROC-GI-3660', quantity: 200, lowStockThreshold: 30, bulkQuoteThreshold: 100, maxDirectQuantity: 200 },
  { sku: 'GYPROC-STD-12.5', quantity: 150, lowStockThreshold: 20, bulkQuoteThreshold: 100, maxDirectQuantity: 200 },
  { sku: 'GYPROC-MR-12.5', quantity: 100, lowStockThreshold: 20, bulkQuoteThreshold: 100, maxDirectQuantity: 200 },
  { sku: 'GYPROC-PROFILL-20KG', quantity: 40, lowStockThreshold: 8, bulkQuoteThreshold: 25, maxDirectQuantity: 50 },

  // Hindware WC
  { sku: 'HIND-ELEMENT-WH-WHITE', quantity: 12, lowStockThreshold: 3, bulkQuoteThreshold: 8, maxDirectQuantity: 16 },

  // Jaquar
  { sku: 'JAQ-CON-BASIN-MIX-CHR', quantity: 25, lowStockThreshold: 5, bulkQuoteThreshold: 15, maxDirectQuantity: 30 },
  { sku: 'JAQ-OHS-200-CHR', quantity: 30, lowStockThreshold: 6, bulkQuoteThreshold: 20, maxDirectQuantity: 40 },

  // Kajaria wall / anti-skid tiles
  { sku: 'KAJ-AS-300-300', quantity: 150, lowStockThreshold: 25, bulkQuoteThreshold: 80, maxDirectQuantity: 150 },
  { sku: 'KAJ-WALL-300-600', quantity: 180, lowStockThreshold: 30, bulkQuoteThreshold: 90, maxDirectQuantity: 160 },

  // Legrand MCBs
  { sku: 'LEG-DX3-SP-C6', quantity: 100, lowStockThreshold: 15, bulkQuoteThreshold: 50, maxDirectQuantity: 100 },
  { sku: 'LEG-DX3-SP-C16', quantity: 100, lowStockThreshold: 15, bulkQuoteThreshold: 50, maxDirectQuantity: 100 },
  { sku: 'LEG-DX3-DP-C32', quantity: 40, lowStockThreshold: 8, bulkQuoteThreshold: 25, maxDirectQuantity: 50 },

  // Philips LED batten
  { sku: 'PHIL-SLIMLINE-20W-CDL', quantity: 60, lowStockThreshold: 10, bulkQuoteThreshold: 30, maxDirectQuantity: 60 },

  // Sika sealant (MOQ 12)
  { sku: 'SIKA-11FC-GREY-600', quantity: 60, lowStockThreshold: 12, bulkQuoteThreshold: 36, maxDirectQuantity: 72 },
  { sku: 'SIKA-11FC-WHITE-600', quantity: 48, lowStockThreshold: 12, bulkQuoteThreshold: 36, maxDirectQuantity: 72 },

  // Tata Tiscon TMT (per kg, MOQ 100)
  { sku: 'TATA-550SD-8MM', quantity: 3000, lowStockThreshold: 300, bulkQuoteThreshold: 1000, maxDirectQuantity: 2000 },
  { sku: 'TATA-550SD-10MM', quantity: 3000, lowStockThreshold: 300, bulkQuoteThreshold: 1000, maxDirectQuantity: 2000 },
  { sku: 'TATA-550SD-12MM', quantity: 4000, lowStockThreshold: 400, bulkQuoteThreshold: 1000, maxDirectQuantity: 2000 },
  { sku: 'TATA-550SD-16MM', quantity: 2500, lowStockThreshold: 250, bulkQuoteThreshold: 1000, maxDirectQuantity: 2000 },

  // Tata Tiscon binding wire (per kg, MOQ 25)
  { sku: 'TATA-BIND-1KG', quantity: 500, lowStockThreshold: 50, bulkQuoteThreshold: 200, maxDirectQuantity: 400 },
  { sku: 'TATA-BIND-25KG', quantity: 200, lowStockThreshold: 25, bulkQuoteThreshold: 100, maxDirectQuantity: 300 },
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
      console.log(`REFUSING — no fulfilment location ${LOCATION_CODE}.`)
      process.exitCode = 1
      return
    }

    console.log(`Location: ${location.name} (${LOCATION_CODE})\n`)
    let applied = 0
    const unknown: string[] = []

    for (const line of STOCK) {
      const variant = await prisma.productVariant.findUnique({
        where: { sku: line.sku },
        select: { id: true, product: { select: { name: true, brand: { select: { name: true } } } } },
      })
      if (!variant) {
        unknown.push(line.sku)
        continue
      }

      console.log(`  ${line.sku.padEnd(24)} ${String(line.quantity).padStart(5)} units   quote above ${String(line.bulkQuoteThreshold).padStart(4)}   ${variant.product.brand.name} ${variant.product.name}`)

      if (APPLY) {
        await prisma.$transaction(async (tx) => {
          await tx.inventoryBalance.upsert({
            where: { variantId_fulfilmentLocationId: { variantId: variant.id, fulfilmentLocationId: location.id } },
            create: { variantId: variant.id, fulfilmentLocationId: location.id, physicalQuantity: line.quantity, lowStockThreshold: line.lowStockThreshold },
            update: { physicalQuantity: line.quantity, lowStockThreshold: line.lowStockThreshold },
          })
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              purchaseMode: 'DIRECT_AND_QUOTE',
              directCheckoutEnabled: true,
              bulkQuoteThreshold: line.bulkQuoteThreshold,
              maxDirectQuantity: line.maxDirectQuantity,
              stockTracked: true,
              stockQuantity: line.quantity,
              lowStockThreshold: line.lowStockThreshold,
            },
          })
        })
      }
      applied += 1
    }

    if (unknown.length > 0) console.log(`\n  SKU NOT FOUND: ${unknown.join(', ')}`)
    console.log(`\n${APPLY ? 'Stocked' : 'Would stock'}: ${applied} variants`)
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
