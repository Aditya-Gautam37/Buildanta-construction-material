import 'dotenv/config'
import { PrismaClient } from './../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Hand-checked, not token-matched. The automatic matcher paired windows with
// window grills and interior putty with exterior putty, so every row here was
// read against the real category tree.
//
// Sizes and gauges are deliberately absent: a 40 mm waste pipe and a 32 mm
// waste pipe resolve to the same category and differ by variant attribute.
// Keyed by slug, not name: "Primer" exists twice under Paints and "AAC Blocks"
// twice under Cement & Structure. Slugs are unique, so a typo fails loudly
// instead of silently selecting the wrong folder.
const TARGETS: Record<string, string> = {
  aac_block_adhesive: 'bricks/block-jointing-adhesive',
  aac_blocks: 'aac-blocks',
  aggregate: 'aggregates',
  bricks: 'red-clay-bricks',
  cement: 'cement-structure/cement',
  doors: 'doors-windows/doors',
  electrical_earth_wire_1p5sqmm: 'electrical/wires-cables/earth-continuity-wire',
  electrical_earth_wire_2p5sqmm: 'electrical/wires-cables/earth-continuity-wire',
  electrical_earth_wire_4sqmm: 'electrical/wires-cables/earth-continuity-wire',
  electrical_wire: 'electrical/wires-cables/copper-wires',
  electrical_wire_1p5sqmm: 'electrical/wires-cables/copper-wires',
  electrical_wire_2p5sqmm: 'electrical/wires-cables/copper-wires',
  electrical_wire_4sqmm: 'electrical/wires-cables/copper-wires',
  floor_tiles: 'tiles-flooring/floor-tiles',
  grout: 'tiles-flooring/tile-adhesives-and-grouts/tile-grout',
  paint: 'paints-finishing/interior/emulsion',
  plumbing_cold_water_15mm: 'plumbing-sanitary/water-supply-pipes',
  plumbing_hot_water_15mm: 'plumbing-sanitary/water-supply-pipes',
  plumbing_pipe: 'plumbing-sanitary/water-supply-pipes',
  plumbing_soil_110mm: 'plumbing-sanitary/soil-and-waste-pipes',
  plumbing_waste_32mm: 'plumbing-sanitary/soil-and-waste-pipes',
  plumbing_waste_40mm: 'plumbing-sanitary/soil-and-waste-pipes',
  plumbing_waste_50mm: 'plumbing-sanitary/soil-and-waste-pipes',
  primer: 'wall-primer',
  putty: 'paints/wall-putty',
  pvc_conduit: 'pvc-conduits',
  sanitary_fixture_set: 'sanitaryware-bathware',
  sand: 'sand',
  tile_adhesive: 'tiles-flooring/tile-adhesives-and-grouts/tile-adhesive',
  tiles: 'tiles-flooring/floor-tiles',
  tmt_rebar: 'steel-tmt/tmt-bars',
  wall_tiles: 'tiles-flooring/wall-tiles',
  windows: 'doors-windows/windows',
}

// Both were deferred until a human decided. Wall putty now has its own
// category rather than being forced into Exterior Putty, which is a different
// product. A bathroom fixture set spans WC, basin and taps, so it maps to the
// department itself: the broadest correct answer, from which the wizard
// narrows, rather than a leaf that would be wrong two times in three.
const DEFERRED: Record<string, string> = {}

const APPLY = process.argv.includes('--apply')

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

  const pool = new Pool({ connectionString })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    const categories = await prisma.category.findMany({ select: { id: true, name: true, slug: true, parentId: true } })
    const bySlug = new Map(categories.map((node) => [node.slug, node]))
    const byId = new Map(categories.map((node) => [node.id, node]))
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

    const mappings = await prisma.calculatorProductMapping.findMany({
      select: { id: true, outputKey: true, qualityTier: true, categoryId: true },
      orderBy: [{ outputKey: 'asc' }, { qualityTier: 'asc' }],
    })

    const byKey = new Map<string, typeof mappings>()
    for (const mapping of mappings) {
      byKey.set(mapping.outputKey, [...(byKey.get(mapping.outputKey) ?? []), mapping])
    }

    let updated = 0
    let unchanged = 0
    const unresolved: string[] = []

    for (const [outputKey, rows] of [...byKey.entries()].sort()) {
      if (DEFERRED[outputKey]) continue
      const slug = TARGETS[outputKey]
      if (!slug) {
        unresolved.push(`${outputKey} — no target defined`)
        continue
      }
      const target = bySlug.get(slug)
      if (!target) {
        unresolved.push(`${outputKey} — no category with slug /${slug}`)
        continue
      }

      const pending = rows.filter((row) => row.categoryId !== target.id)
      console.log(`  ${outputKey.padEnd(30)} -> ${pathOf(target.id)}   (${pending.length}/${rows.length} rows)`)
      unchanged += rows.length - pending.length
      if (APPLY && pending.length > 0) {
        await prisma.calculatorProductMapping.updateMany({
          where: { id: { in: pending.map((row) => row.id) } },
          data: { categoryId: target.id },
        })
      }
      updated += pending.length
    }

    if (Object.keys(DEFERRED).length > 0) {
      console.log('\n  DEFERRED — left pointing at the old target, needs your decision:')
      for (const [key, reason] of Object.entries(DEFERRED)) {
        console.log(`    ${key}: ${reason}`)
      }
    }
    if (unresolved.length > 0) {
      console.log('\n  UNRESOLVED:')
      for (const entry of unresolved) console.log(`    ${entry}`)
    }

    console.log(`\n${APPLY ? 'Updated' : 'Would update'}: ${updated}   Already correct: ${unchanged}   Deferred keys: ${Object.keys(DEFERRED).length}`)
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
