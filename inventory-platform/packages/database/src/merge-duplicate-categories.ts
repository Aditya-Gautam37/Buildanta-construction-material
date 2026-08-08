import 'dotenv/config'
import { PrismaClient } from './../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Four duplicate sibling pairs sit under Paints, each a leftover of the second
// catalogue seeding. In every pair one side is live and holds the product while
// the other is an empty twin. Only the empty twin goes.
//
// Primer is the exception worth the extra step: its deeper side is the one the
// calculator targets (Paints > Primer > Wall Primer), so the product moves
// there and the shallow twin is removed. That also makes the `primer` output
// resolve to a real product instead of nothing.
const MOVES: Array<{ fromSlug: string; toSlug: string; why: string }> = [
  {
    fromSlug: 'paints-finishing/primer',
    toSlug: 'wall-primer',
    why: 'Wall primer belongs under Paints > Primer > Wall Primer, which is what the calculator maps to.',
  },
]

const DELETE_SUBTREES = [
  'exterior-paints',
  'texture-paints',
  'wood--metal-coatings',
  'paints-finishing/primer',
]

const APPLY = process.argv.includes('--apply')

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

  const pool = new Pool({ connectionString })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    const categories = await prisma.category.findMany({ select: { id: true, name: true, slug: true, parentId: true, published: true } })
    const bySlug = new Map(categories.map((node) => [node.slug, node]))
    const byId = new Map(categories.map((node) => [node.id, node]))
    const childrenOf = (id: string) => categories.filter((node) => node.parentId === id)
    const subtree = (id: string): string[] => [id, ...childrenOf(id).flatMap((child) => subtree(child.id))]
    const pathOf = (id: string) => {
      const parts: string[] = []
      let cursor = byId.get(id)
      const seen = new Set<string>()
      while (cursor && !seen.has(cursor.id)) {
        seen.add(cursor.id)
        parts.unshift(cursor.name)
        cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined
      }
      return parts.join(' > ')
    }

    console.log('MOVES')
    for (const move of MOVES) {
      const from = bySlug.get(move.fromSlug)
      const to = bySlug.get(move.toSlug)
      if (!from || !to) {
        console.log(`  SKIP  ${move.fromSlug} -> ${move.toSlug}  (slug not found)`)
        continue
      }
      const products = await prisma.product.findMany({ where: { categories: { some: { id: from.id } } }, select: { id: true, name: true } })
      console.log(`  ${pathOf(from.id)}  ->  ${pathOf(to.id)}`)
      for (const product of products) console.log(`      ${product.name}`)
      if (APPLY) {
        for (const product of products) {
          await prisma.product.update({
            where: { id: product.id },
            data: { categories: { disconnect: { id: from.id }, connect: { id: to.id } } },
          })
        }
      }
    }

    console.log('\nDELETIONS')
    const toDelete: string[] = []
    for (const slug of DELETE_SUBTREES) {
      const node = bySlug.get(slug)
      if (!node) {
        console.log(`  SKIP  /${slug}  (not found)`)
        continue
      }
      const ids = subtree(node.id)
      // After the moves above, nothing in these subtrees may hold a product or
      // be a calculator destination. Refuse the whole run if that is not true.
      const productCount = await prisma.product.count({ where: { categories: { some: { id: { in: ids } } } } })
      const mappingCount = await prisma.calculatorProductMapping.count({ where: { categoryId: { in: ids } } })
      const movedAway = MOVES.some((move) => move.fromSlug === slug)
      const effectiveProducts = APPLY ? productCount : movedAway ? 0 : productCount
      if (effectiveProducts > 0 || mappingCount > 0) {
        console.log(`  REFUSE  ${pathOf(node.id)}  — products=${productCount} calculatorMappings=${mappingCount}`)
        process.exitCode = 1
        return
      }
      console.log(`  ${pathOf(node.id)}   /${slug}   (${ids.length} node${ids.length === 1 ? '' : 's'})`)
      for (const id of ids.slice(1)) console.log(`      └ ${byId.get(id)!.name}`)
      toDelete.push(...ids)
    }

    if (!APPLY) {
      console.log(`\nWould move ${MOVES.length} category assignment(s) and delete ${toDelete.length} categories.`)
      console.log('Dry run. Re-run with --apply.')
      return
    }

    // Children first so no parent is removed while still referenced.
    const ordered = [...toDelete].reverse()
    let deleted = 0
    for (const id of ordered) {
      await prisma.category.delete({ where: { id } })
      deleted += 1
    }
    console.log(`\nDeleted categories: ${deleted}`)
    console.log(`Remaining categories: ${await prisma.category.count()}`)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
