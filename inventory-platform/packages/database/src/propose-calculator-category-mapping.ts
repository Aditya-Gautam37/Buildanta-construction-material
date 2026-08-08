import 'dotenv/config'
import { PrismaClient } from './../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

type Node = { id: string; name: string; slug: string; parentId: string | null; published: boolean }

const STOPWORDS = new Set(['and', 'the', 'set', 'mm', 'm', 'kg', 'litre', 'l', 'piece', 'bag', 'm3'])

function tokens(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((token) => token.length > 1 && !STOPWORDS.has(token))
}

// Demo product names carry the material, wrapped in seeding noise.
function materialName(productName: string) {
  return productName
    .replace(/^Buildanta Calculator /, '')
    .replace(/ - (Economy|Standard|Premium)$/, '')
    .replace(/ [—-] \d+.*$/, '')
    .trim()
}

function isTreeB(node: Node) {
  return node.slug.includes('/')
}

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

  const pool = new Pool({ connectionString })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    const [categories, mappings] = await Promise.all([
      prisma.category.findMany({ select: { id: true, name: true, slug: true, parentId: true, published: true } }),
      prisma.calculatorProductMapping.findMany({
        select: {
          outputKey: true,
          qualityTier: true,
          expectedUnit: true,
          variant: { select: { product: { select: { name: true, categories: { select: { id: true, name: true } } } } } },
        },
      }),
    ])

    const byId = new Map(categories.map((node) => [node.id, node as Node]))
    const descendantsOf = (rootId: string) => {
      const out: Node[] = []
      const walk = (id: string) => {
        for (const node of categories.filter((candidate) => candidate.parentId === id)) {
          out.push(node as Node)
          walk(node.id)
        }
      }
      walk(rootId)
      return out
    }
    const pathOf = (node: Node) => {
      const parts: string[] = []
      let cursor: Node | undefined = node
      const seen = new Set<string>()
      while (cursor && !seen.has(cursor.id)) {
        seen.add(cursor.id)
        parts.unshift(cursor.name)
        cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined
      }
      return parts.join(' > ')
    }

    type Row = { outputKey: string; unit: string; material: string; root: Node; tiers: number }
    const rows = new Map<string, Row>()
    for (const mapping of mappings) {
      const product = mapping.variant?.product
      if (!product) continue
      const rootCategory = product.categories[0]
      if (!rootCategory) continue
      const existing = rows.get(mapping.outputKey)
      if (existing) {
        existing.tiers += 1
        continue
      }
      rows.set(mapping.outputKey, {
        outputKey: mapping.outputKey,
        unit: mapping.expectedUnit,
        material: materialName(product.name),
        root: byId.get(rootCategory.id)!,
        tiers: 1,
      })
    }

    const good: string[] = []
    const weak: string[] = []
    const missing: string[] = []

    for (const row of [...rows.values()].sort((a, b) => a.outputKey.localeCompare(b.outputKey))) {
      const wanted = tokens(row.material)
      const candidates = descendantsOf(row.root.id)
      const scored = candidates
        .map((node) => {
          const have = tokens(node.name)
          const overlap = wanted.filter((token) => have.includes(token)).length
          // Prefer tree A, prefer leaves, prefer tighter names.
          return { node, score: overlap * 10 - Math.abs(have.length - wanted.length) + (isTreeB(node) ? 0 : 3) }
        })
        .filter((entry) => entry.score > 3)
        .sort((a, b) => b.score - a.score)

      const best = scored[0]
      const label = `${row.outputKey.padEnd(30)} ${row.unit.padEnd(6)} ${row.material}`
      if (!best) {
        missing.push(`  ${label}\n      department: ${row.root.name}  —  no category matches, needs a new one`)
      } else if (best.score >= 13) {
        good.push(`  ${label}\n      -> ${pathOf(best.node)}   /${best.node.slug}${best.node.published ? '' : '  [needs publishing]'}`)
      } else {
        const alternatives = scored.slice(0, 3).map((entry) => `${pathOf(entry.node)} (/${entry.node.slug})`)
        weak.push(`  ${label}\n      best guess: ${alternatives.join('\n      or         ')}`)
      }
    }

    console.log(`Output keys: ${rows.size}   Mappings behind them: ${mappings.length}`)
    console.log(`\n\nA. CONFIDENT — repoint to this category (${good.length})\n${'='.repeat(60)}`)
    console.log(good.join('\n\n') || '  none')
    console.log(`\n\nB. NEEDS A CHOICE — several plausible targets (${weak.length})\n${'='.repeat(60)}`)
    console.log(weak.join('\n\n') || '  none')
    console.log(`\n\nC. NO CATEGORY EXISTS — must be created (${missing.length})\n${'='.repeat(60)}`)
    console.log(missing.join('\n\n') || '  none')
    console.log(`\n\nSummary\n${'='.repeat(60)}`)
    console.log(JSON.stringify({ outputKeys: rows.size, mappings: mappings.length, confident: good.length, needsChoice: weak.length, needsNewCategory: missing.length }, null, 2))
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
