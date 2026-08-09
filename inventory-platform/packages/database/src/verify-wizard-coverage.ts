import 'dotenv/config'
import { PrismaClient } from './../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

/**
 * The launch gate for the guided wizard.
 *
 * The wizard hides branches with no stock so a shopper never taps into a dead
 * end. That is a good rule for shoppers and a dangerous one for staff: a
 * mapping can look correct in the admin while being invisible in the shop. This
 * reports the difference, so the silence is deliberate rather than accidental.
 *
 * Exit code 1 when a live room or stage would render nothing at all, since that
 * is a broken entry point rather than a thin one.
 */
async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

  const pool = new Pool({ connectionString })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true, parentId: true, published: true },
    })
    const byId = new Map(categories.map((node) => [node.id, node]))
    const childrenOf = (id: string) => categories.filter((node) => node.parentId === id)

    const products = await prisma.product.findMany({
      where: { status: 'PUBLISHED', variants: { some: { status: 'ACTIVE' } } },
      select: { categories: { select: { id: true } } },
    })
    const stocked = new Set(products.flatMap((product) => product.categories.map((category) => category.id)))

    const subtreeStocked = (rootId: string, excluded: Set<string>): boolean => {
      if (excluded.has(rootId)) return false
      const node = byId.get(rootId)
      if (!node?.published) return false
      if (stocked.has(rootId)) return true
      return childrenOf(rootId).some((child) => subtreeStocked(child.id, excluded))
    }

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

    const [rooms, stages] = await Promise.all([
      prisma.room.findMany({ where: { parentId: null }, select: { id: true, name: true, slug: true, categoryLinks: true }, orderBy: { name: 'asc' } }),
      prisma.stage.findMany({ where: { parentId: null }, select: { id: true, name: true, slug: true, categoryLinks: true }, orderBy: { name: 'asc' } }),
    ])

    const silent: string[] = []
    const empty: string[] = []
    const unmapped: string[] = []

    const check = (kind: string, owner: { name: string; slug: string; categoryLinks: Array<{ categoryId: string; mode: string }> }) => {
      const excluded = new Set(owner.categoryLinks.filter((link) => link.mode === 'EXCLUDE').map((link) => link.categoryId))
      const includes = owner.categoryLinks.filter((link) => link.mode === 'INCLUDE')
      if (includes.length === 0) {
        unmapped.push(`${kind} ${owner.name} (/${owner.slug})`)
        return
      }
      const visible = includes.filter((link) => subtreeStocked(link.categoryId, excluded))
      for (const link of includes) {
        if (!visible.includes(link)) silent.push(`${kind} ${owner.name}  ->  ${pathOf(link.categoryId)}`)
      }
      if (visible.length === 0) empty.push(`${kind} ${owner.name} (/${owner.slug}) — mapped to ${includes.length}, none reachable`)
    }

    rooms.forEach((room) => check('room', room))
    stages.forEach((stage) => check('stage', stage))

    const mappings = await prisma.calculatorProductMapping.findMany({ select: { outputKey: true, categoryId: true } })
    const outputs = new Map<string, string | null>()
    for (const mapping of mappings) if (!outputs.has(mapping.outputKey)) outputs.set(mapping.outputKey, mapping.categoryId)
    const unpriced = [...outputs.entries()].filter(([, categoryId]) => !categoryId || !subtreeStocked(categoryId, new Set()))

    console.log(`Rooms checked:  ${rooms.length}`)
    console.log(`Stages checked: ${stages.length}`)
    console.log(`Calculator outputs: ${outputs.size}`)

    console.log(`\nBLOCKING — live entry points that would render nothing (${empty.length})`)
    empty.forEach((line) => console.log(`  ${line}`))
    if (empty.length === 0) console.log('  none')

    console.log(`\nNOT BLOCKING — owners with no mapping at all (${unmapped.length})`)
    unmapped.forEach((line) => console.log(`  ${line}`))
    if (unmapped.length === 0) console.log('  none')

    console.log(`\nNOT BLOCKING — mapped departments hidden for want of stock (${silent.length})`)
    silent.forEach((line) => console.log(`  ${line}`))
    if (silent.length === 0) console.log('  none')

    console.log(`\nNOT BLOCKING — calculator outputs that cannot price yet (${unpriced.length} of ${outputs.size})`)
    unpriced.forEach(([key, categoryId]) => console.log(`  ${key.padEnd(30)} ${categoryId ? pathOf(categoryId) : 'NO CATEGORY'}`))

    console.log(`\n${empty.length === 0 ? 'GATE PASSED' : 'GATE FAILED'}`)
    if (empty.length > 0) process.exitCode = 1
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
