import 'dotenv/config'
import { PrismaClient } from './../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Products already carry room and stage tags, so the catalogue implies a first
// draft of the mapping. Seeding from it beats handing staff a blank screen, but
// it is only a draft: what a living room *needs* is broader than what happens
// to be tagged to it today, which is exactly why the link is curated rather
// than derived at read time.
const APPLY = process.argv.includes('--apply')

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

  const pool = new Pool({ connectionString })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    const categories = await prisma.category.findMany({ select: { id: true, name: true, parentId: true, published: true } })
    const byId = new Map(categories.map((node) => [node.id, node]))
    const rootOf = (id: string) => {
      let cursor = byId.get(id)
      const seen = new Set<string>()
      while (cursor?.parentId && !seen.has(cursor.id)) {
        seen.add(cursor.id)
        cursor = byId.get(cursor.parentId)
      }
      return cursor
    }

    const rooms = await prisma.room.findMany({
      where: { parentId: null },
      select: { id: true, name: true, products: { where: { status: 'PUBLISHED' }, select: { categories: { select: { id: true } } } } },
      orderBy: { name: 'asc' },
    })
    const stages = await prisma.stage.findMany({
      where: { parentId: null },
      select: { id: true, name: true, products: { where: { status: 'PUBLISHED' }, select: { categories: { select: { id: true } } } } },
      orderBy: { name: 'asc' },
    })

    let created = 0
    let skipped = 0

    const seedOwner = async (
      ownerType: 'ROOM' | 'STAGE',
      owner: { id: string; name: string; products: Array<{ categories: Array<{ id: string }> }> },
    ) => {
      const roots = new Map<string, string>()
      for (const product of owner.products) {
        for (const category of product.categories) {
          const root = rootOf(category.id)
          if (root?.published) roots.set(root.id, root.name)
        }
      }
      if (roots.size === 0) {
        console.log(`  ${owner.name.padEnd(24)} — no published products tagged, nothing to seed`)
        return
      }
      console.log(`  ${owner.name.padEnd(24)} ${[...roots.values()].sort().join(', ')}`)
      let order = 10
      for (const rootId of roots.keys()) {
        const where = ownerType === 'ROOM'
          ? { roomId_categoryId_mode: { roomId: owner.id, categoryId: rootId, mode: 'INCLUDE' as const } }
          : { stageId_categoryId_mode: { stageId: owner.id, categoryId: rootId, mode: 'INCLUDE' as const } }
        const existing = await prisma.taxonomyCategoryLink.findUnique({ where })
        if (existing) {
          skipped += 1
        } else {
          created += 1
          if (APPLY) {
            await prisma.taxonomyCategoryLink.create({
              data: {
                ownerType,
                roomId: ownerType === 'ROOM' ? owner.id : null,
                stageId: ownerType === 'STAGE' ? owner.id : null,
                categoryId: rootId,
                mode: 'INCLUDE',
                sortOrder: order,
              },
            })
          }
        }
        order += 10
      }
    }

    console.log('ROOMS')
    for (const room of rooms) await seedOwner('ROOM', room)
    console.log('\nSTAGES')
    for (const stage of stages) await seedOwner('STAGE', stage)

    console.log(`\n${APPLY ? 'Created' : 'Would create'}: ${created}   Already present: ${skipped}`)
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
