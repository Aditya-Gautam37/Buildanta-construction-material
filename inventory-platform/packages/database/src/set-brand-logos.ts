import 'dotenv/config'
import { PrismaClient } from './../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

/**
 * Brand marks served from the storefront's own public directory, so the paths
 * are relative. Only brands whose actual logo we hold appear here: a product
 * photograph in a brand's colours is not a logo, and using one would make the
 * brand rail look wrong rather than empty.
 */
const LOGOS: Record<string, string> = {
  'Asian Paints': '/brands/asian-paints.png',
  Jaquar: '/brands/jaquar.png',
}

const APPLY = process.argv.includes('--apply')

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

  const pool = new Pool({ connectionString })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    const brands = await prisma.brand.findMany({ select: { id: true, name: true, logo: true }, orderBy: { name: 'asc' } })
    let updated = 0

    for (const [name, logo] of Object.entries(LOGOS)) {
      const brand = brands.find((candidate) => candidate.name === name)
      if (!brand) {
        console.log(`  SKIP    ${name} — no such brand in the catalogue`)
        continue
      }
      if (brand.logo === logo) {
        console.log(`  ok      ${name} — already set`)
        continue
      }
      console.log(`  ${APPLY ? 'SET' : 'would'}     ${name} -> ${logo}`)
      if (APPLY) await prisma.brand.update({ where: { id: brand.id }, data: { logo } })
      updated += 1
    }

    const without = brands.filter((brand) => !LOGOS[brand.name] && !brand.logo)
    console.log(`\nStill without a logo (${without.length}): ${without.map((brand) => brand.name).join(', ')}`)
    console.log(`\n${APPLY ? 'Updated' : 'Would update'}: ${updated}`)
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
