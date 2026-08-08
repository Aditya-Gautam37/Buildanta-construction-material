import 'dotenv/config'
import { PrismaClient } from './../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// The seeded "Buildanta Calculator Demo" catalogue existed only so calculator
// mappings had a variant to price against. Those mappings now carry a
// categoryId, so deleting these releases the calculator onto real inventory:
// CalculatorProductMapping.variantId is SetNull, and resolveProduct() only
// falls through to the category branch once variantId is null.
const BRAND_NAME = 'Buildanta Calculator Demo'
const APPLY = process.argv.includes('--apply')

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

  const pool = new Pool({ connectionString })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    const brand = await prisma.brand.findFirst({ where: { name: BRAND_NAME }, select: { id: true, name: true } })
    if (!brand) {
      console.log(`No brand named "${BRAND_NAME}". Nothing to do.`)
      return
    }

    const products = await prisma.product.findMany({ where: { brandId: brand.id }, select: { id: true, name: true } })
    const productIds = products.map((product) => product.id)
    const variants = await prisma.productVariant.findMany({ where: { productId: { in: productIds } }, select: { id: true } })
    const variantIds = variants.map((variant) => variant.id)

    // Anything not SetNull would be silently destroyed, so refuse if present.
    const blockers: Array<[string, number]> = [
      ['ProductImage', await prisma.productImage.count({ where: { OR: [{ productId: { in: productIds } }, { variantId: { in: variantIds } }] } })],
      ['CartItem', await prisma.cartItem.count({ where: { variantId: { in: variantIds } } })],
      ['QuotationItem', await prisma.quotationItem.count({ where: { OR: [{ productId: { in: productIds } }, { variantId: { in: variantIds } }] } })],
      ['SalesOrderItem', await prisma.salesOrderItem.count({ where: { variantId: { in: variantIds } } })],
      ['InventoryBalance', await prisma.inventoryBalance.count({ where: { variantId: { in: variantIds } } })],
      ['StockTransaction', await prisma.stockTransaction.count({ where: { variantId: { in: variantIds } } })],
      ['Review', await prisma.review.count({ where: { productId: { in: productIds } } })],
      ['HomepageProduct', await prisma.homepageProduct.count({ where: { productId: { in: productIds } } })],
    ].filter(([, count]) => count > 0)

    const mappings = await prisma.calculatorProductMapping.count({ where: { OR: [{ productId: { in: productIds } }, { variantId: { in: variantIds } }] } })
    const estimateItems = await prisma.materialEstimateItem.count({ where: { OR: [{ productId: { in: productIds } }, { variantId: { in: variantIds } }] } })

    console.log(`Brand:    ${brand.name}`)
    console.log(`Products: ${products.length}`)
    console.log(`Variants: ${variantIds.length}`)
    console.log(`\nWill be detached, not deleted (both relations are SetNull):`)
    console.log(`  CalculatorProductMapping  ${mappings}  -> falls back to categoryId`)
    console.log(`  MaterialEstimateItem      ${estimateItems}  -> keeps its stored price and mappingSnapshot`)

    if (blockers.length > 0) {
      console.log('\nREFUSING — these would lose data:')
      for (const [label, count] of blockers) console.log(`  ${label}: ${count}`)
      process.exitCode = 1
      return
    }
    console.log('\nNo images, carts, quotations, orders, stock records or reviews attached.')

    if (!APPLY) {
      console.log('\nDry run. Re-run with --apply to delete.')
      return
    }

    const result = await prisma.$transaction(async (tx) => {
      const deletedVariants = await tx.productVariant.deleteMany({ where: { id: { in: variantIds } } })
      const deletedProducts = await tx.product.deleteMany({ where: { id: { in: productIds } } })
      const deletedBrand = await tx.brand.deleteMany({ where: { id: brand.id } })
      return { deletedVariants: deletedVariants.count, deletedProducts: deletedProducts.count, deletedBrand: deletedBrand.count }
    })

    console.log(`\nDeleted variants: ${result.deletedVariants}`)
    console.log(`Deleted products: ${result.deletedProducts}`)
    console.log(`Deleted brand:    ${result.deletedBrand}`)

    const orphanedMappings = await prisma.calculatorProductMapping.count({ where: { variantId: null, categoryId: null } })
    console.log(`\nMappings left with neither a variant nor a category: ${orphanedMappings}`)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
