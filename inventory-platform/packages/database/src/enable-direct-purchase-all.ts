import 'dotenv/config'
import { PrismaClient } from './../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

/**
 * Turns on direct purchase + bulk quote for every active variant, so the
 * storefront shows an "Add to cart" button on all of them.
 *
 * The button appears whenever purchaseMode is not QUOTE_ONLY and does NOT check
 * stock, so a variant with zero balance becomes buyable too. That is the
 * explicit ask; the overselling caveat is called out to the operator, not
 * enforced here.
 *
 * Variants that already have direct checkout enabled (the ones stocked at
 * Kanpur, with tuned thresholds) are left untouched, so their maxDirectQuantity
 * and bulkQuoteThreshold survive.
 */
const APPLY = process.argv.includes('--apply')

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

  const pool = new Pool({ connectionString })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    const variants = await prisma.productVariant.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true, sku: true, purchaseMode: true, directCheckoutEnabled: true,
        product: { select: { name: true, status: true, brand: { select: { name: true } } } },
      },
      orderBy: [{ product: { brand: { name: 'asc' } } }, { sku: 'asc' }],
    })

    const alreadyOn = variants.filter((v) => v.directCheckoutEnabled)
    const toEnable = variants.filter((v) => !v.directCheckoutEnabled)

    console.log(`Active variants: ${variants.length}`)
    console.log(`Already direct-enabled (left as-is): ${alreadyOn.length}`)
    console.log(`Will enable now: ${toEnable.length}\n`)
    for (const v of toEnable) {
      console.log(`  ${APPLY ? 'ENABLE' : 'would'}  ${v.sku.padEnd(24)} ${v.product.brand.name} ${v.product.name}`)
    }

    if (APPLY && toEnable.length > 0) {
      await prisma.productVariant.updateMany({
        where: { id: { in: toEnable.map((v) => v.id) } },
        data: {
          purchaseMode: 'DIRECT_AND_QUOTE',
          directCheckoutEnabled: true,
        },
      })
    }

    console.log(`\n${APPLY ? 'Enabled' : 'Would enable'}: ${toEnable.length} variants`)
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
