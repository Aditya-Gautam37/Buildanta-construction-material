import 'dotenv/config'
import { PrismaClient } from './../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

/**
 * Artwork for the guided wizard, served from the storefront's public directory.
 *
 * Every wizard option without an image renders as a letter placeholder, which
 * reads as unfinished rather than minimal. Keyed by slug, because category
 * names repeat across the tree and a name match would put a toilet in the
 * cement department.
 */
const CATEGORY_IMAGES: Record<string, string> = {
  'plumbing-sanitary/water-supply-pipes': '/categories/water-supply-pipes.png',
  'tiles-flooring/tile-adhesives-and-grouts/tile-adhesive': '/categories/tile-adhesive.png',
  'electrical/wires-cables/copper-wires': '/categories/copper-wires.png',
  'distribution-board': '/categories/distribution-board.png',
  'sanitaryware-bathware/toilets': '/categories/toilets.png',
  'waterproofing/walls': '/categories/wall-waterproofing.png',
  'false-ceiling-drywall/boards/gypsum': '/categories/gypsum-boards.png',
  'ceiling-systems': '/categories/ceiling-systems.png',
  'tiles-flooring/floor-tiles/glossy': '/categories/glossy-floor-tiles.png',
  'tiles-flooring/natural-stone': '/categories/natural-stone.png',
  'paints-finishing/interior/emulsion': '/categories/interior-emulsion.png',
}

/**
 * Room artwork already sits in the storefront, but only in a hardcoded map
 * keyed by name — which already fails silently, because the room is called
 * "Living room" and the map says "Living Room". Moving it into the database
 * makes it staff-editable and removes that whole class of mismatch.
 */
const ROOM_IMAGES: Record<string, string> = {
  'living-room': '/livingroom.jpg',
  bedroom: '/bedroom.jpg',
  kitchen: '/kitchen.jpg',
  bathroom: '/bathroom.jpg',
  'study--home-office': '/images/buildanta-v2/room-study-v2.webp',
  'balcony--terrace': '/images/buildanta-v2/room-balcony-v2.webp',
}

const APPLY = process.argv.includes('--apply')

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

  const pool = new Pool({ connectionString })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    let updated = 0
    const missing: string[] = []

    console.log('CATEGORIES')
    for (const [slug, imageUrl] of Object.entries(CATEGORY_IMAGES)) {
      const node = await prisma.category.findUnique({ where: { slug }, select: { id: true, name: true, imageUrl: true } })
      if (!node) {
        missing.push(`category /${slug}`)
        continue
      }
      if (node.imageUrl === imageUrl) {
        console.log(`  ok      ${node.name}`)
        continue
      }
      console.log(`  ${APPLY ? 'SET' : 'would'}     ${node.name.padEnd(28)} ${imageUrl}`)
      if (APPLY) await prisma.category.update({ where: { id: node.id }, data: { imageUrl } })
      updated += 1
    }

    console.log('\nROOMS')
    for (const [slug, imageUrl] of Object.entries(ROOM_IMAGES)) {
      const node = await prisma.room.findUnique({ where: { slug }, select: { id: true, name: true, imageUrl: true } })
      if (!node) {
        missing.push(`room /${slug}`)
        continue
      }
      if (node.imageUrl === imageUrl) {
        console.log(`  ok      ${node.name}`)
        continue
      }
      console.log(`  ${APPLY ? 'SET' : 'would'}     ${node.name.padEnd(28)} ${imageUrl}`)
      if (APPLY) await prisma.room.update({ where: { id: node.id }, data: { imageUrl } })
      updated += 1
    }

    if (missing.length > 0) {
      console.log('\n  NOT FOUND — nothing set for these:')
      for (const entry of missing) console.log(`    ${entry}`)
    }

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
