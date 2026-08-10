import 'dotenv/config'
import { PrismaClient } from './../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

/**
 * Cleans up the operator-created "berger paints" product to match the rest of
 * the catalogue, and sets Fenesta windows to quote-only.
 *
 * The Berger product is real but was entered as a placeholder: lowercase name
 * and brand, inconsistent SKUs, a variant with no pack attribute, "unit" units.
 * Prices are left exactly as entered — those are the operator's numbers.
 *
 * Windows are sold by the square metre and made to measure, so a fixed
 * add-to-cart price is misleading. They move to quote-only with the placeholder
 * balance removed, showing "request a quote" instead of a buy button.
 */
const LOCATION_CODE = 'KNP-01'
const APPLY = process.argv.includes('--apply')

const BERGER = {
  brandFrom: 'berger paints',
  brandTo: 'Berger Paints',
  brandSlug: 'berger-paints',
  productTo: 'Berger Exterior Emulsion',
  variants: [
    { fromSku: 'bg-10-V', toSku: 'BRG-EXT-EMUL-10L', unit: '10 L pail', pack: '10 L', quantity: 25, low: 6, bulk: 15, maxDirect: 30 },
    { fromSku: 'bg-20', toSku: 'BRG-EXT-EMUL-20L', unit: '20 L pail', pack: '20 L', quantity: 20, low: 5, bulk: 12, maxDirect: 25 },
  ],
}

const WINDOW_SKUS = ['FEN-UPVC-2T-CLEAR', 'FEN-UPVC-3T-MESH']

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

  const pool = new Pool({ connectionString })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    const location = await prisma.fulfilmentLocation.findUnique({ where: { code: LOCATION_CODE }, select: { id: true } })
    if (!location) { console.log(`REFUSING — no location ${LOCATION_CODE}.`); process.exitCode = 1; return }

    // --- Berger ---
    const brand = await prisma.brand.findFirst({ where: { name: BERGER.brandFrom }, select: { id: true } })
    const product = await prisma.product.findFirst({ where: { name: BERGER.brandFrom }, select: { id: true } })
    console.log('BERGER')
    console.log(`  brand   "${BERGER.brandFrom}" -> "${BERGER.brandTo}" (/${BERGER.brandSlug})`)
    console.log(`  product "${BERGER.brandFrom}" -> "${BERGER.productTo}"`)
    for (const v of BERGER.variants) console.log(`  variant ${v.fromSku} -> ${v.toSku}  ${v.unit}  pack ${v.pack}  stock ${v.quantity}`)

    if (APPLY) {
      if (brand) await prisma.brand.update({ where: { id: brand.id }, data: { name: BERGER.brandTo, slug: BERGER.brandSlug } })
      if (product) await prisma.product.update({ where: { id: product.id }, data: { name: BERGER.productTo } })
      for (const v of BERGER.variants) {
        const variant = await prisma.productVariant.findUnique({ where: { sku: v.fromSku }, select: { id: true } })
        if (!variant) { console.log(`  (variant ${v.fromSku} not found, skipped)`); continue }
        await prisma.$transaction(async (tx) => {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              sku: v.toSku, unit: v.unit, attributes: { pack: v.pack },
              purchaseMode: 'DIRECT_AND_QUOTE', directCheckoutEnabled: true,
              bulkQuoteThreshold: v.bulk, maxDirectQuantity: v.maxDirect,
              stockTracked: true, stockQuantity: v.quantity, lowStockThreshold: v.low,
            },
          })
          await tx.inventoryBalance.upsert({
            where: { variantId_fulfilmentLocationId: { variantId: variant.id, fulfilmentLocationId: location.id } },
            create: { variantId: variant.id, fulfilmentLocationId: location.id, physicalQuantity: v.quantity, lowStockThreshold: v.low },
            update: { physicalQuantity: v.quantity, lowStockThreshold: v.low },
          })
        })
      }
    }

    // --- Windows -> quote only ---
    console.log('\nWINDOWS (Fenesta) -> quote only, placeholder stock removed')
    for (const sku of WINDOW_SKUS) {
      const variant = await prisma.productVariant.findUnique({ where: { sku }, select: { id: true } })
      console.log(`  ${sku}${variant ? '' : '  (not found)'}`)
      if (APPLY && variant) {
        await prisma.$transaction(async (tx) => {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { purchaseMode: 'QUOTE_ONLY', directCheckoutEnabled: false, stockTracked: false, stockQuantity: 0 },
          })
          await tx.inventoryBalance.deleteMany({ where: { variantId: variant.id, fulfilmentLocationId: location.id } })
        })
      }
    }

    console.log(`\n${APPLY ? 'Applied.' : 'Dry run — re-run with --apply to write.'}`)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
