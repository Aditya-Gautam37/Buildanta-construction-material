import 'dotenv/config'
import { PrismaClient } from './../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

type Node = {
  id: string
  name: string
  slug: string
  parentId: string | null
  published: boolean
}

function normalized(name: string) {
  return name.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim()
}

// Tree B was seeded with hierarchical slugs; tree A predates it and is flat.
// The slug shape is the only reliable discriminator, since both hang off the
// same eleven roots.
function isTreeB(node: Node) {
  return node.slug.includes('/')
}

function heading(title: string) {
  console.log(`\n${'='.repeat(title.length)}\n${title}\n${'='.repeat(title.length)}`)
}

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

  const pool = new Pool({ connectionString })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    const [categories, products] = await Promise.all([
      prisma.category.findMany({
        select: { id: true, name: true, slug: true, parentId: true, published: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.product.findMany({
        where: { status: 'PUBLISHED' },
        select: { id: true, name: true, brand: { select: { name: true } }, categories: { select: { id: true } } },
      }),
    ])

    const byId = new Map(categories.map((node) => [node.id, node as Node]))
    const childrenOf = new Map<string | null, Node[]>()
    for (const node of categories) {
      childrenOf.set(node.parentId, [...(childrenOf.get(node.parentId) ?? []), node as Node])
    }

    const rootOf = (node: Node): Node => {
      let cursor = node
      const seen = new Set<string>()
      while (cursor.parentId && !seen.has(cursor.id)) {
        seen.add(cursor.id)
        const parent = byId.get(cursor.parentId)
        if (!parent) break
        cursor = parent
      }
      return cursor
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

    const productsOn = new Map<string, Array<{ name: string; brand: string }>>()
    for (const product of products) {
      for (const category of product.categories) {
        productsOn.set(category.id, [
          ...(productsOn.get(category.id) ?? []),
          { name: product.name, brand: product.brand.name },
        ])
      }
    }

    const treeA = categories.filter((node) => node.parentId && !isTreeB(node as Node)) as Node[]
    const treeB = categories.filter((node) => node.parentId && isTreeB(node as Node)) as Node[]
    const bWithProducts = treeB.filter((node) => (productsOn.get(node.id) ?? []).length > 0)

    console.log(`Tree A nodes (flat slug):   ${treeA.length}`)
    console.log(`Tree B nodes (pathed slug): ${treeB.length}`)
    console.log(`Tree B nodes holding products: ${bWithProducts.length}`)
    console.log(`Published products: ${products.length}`)

    // Candidate targets are tree A nodes with the same normalized name. Same-root
    // matches are strongly preferred; a cross-root match usually means the two
    // trees disagree about which department owns the material.
    const aByName = new Map<string, Node[]>()
    for (const node of treeA) {
      const key = normalized(node.name)
      aByName.set(key, [...(aByName.get(key) ?? []), node])
    }

    const confident: Array<{ from: Node; to: Node; count: number }> = []
    const ambiguous: Array<{ from: Node; options: Node[]; count: number }> = []
    const unmatched: Array<{ from: Node; count: number }> = []

    for (const node of bWithProducts) {
      const count = (productsOn.get(node.id) ?? []).length
      const candidates = aByName.get(normalized(node.name)) ?? []
      const sameRoot = candidates.filter((candidate) => rootOf(candidate).id === rootOf(node).id)
      const pool = sameRoot.length > 0 ? sameRoot : candidates
      if (pool.length === 1) confident.push({ from: node, to: pool[0]!, count })
      else if (pool.length > 1) ambiguous.push({ from: node, options: pool, count })
      else unmatched.push({ from: node, count })
    }

    heading(`A. Confident matches — same name, same department (${confident.length})`)
    for (const row of confident) {
      console.log(`\n  ${row.count} product${row.count === 1 ? '' : 's'}`)
      console.log(`    from  ${pathOf(row.from)}   /${row.from.slug}`)
      console.log(`    to    ${pathOf(row.to)}   /${row.to.slug}${row.to.published ? '' : '  [needs publishing]'}`)
    }

    heading(`B. Ambiguous — several tree A nodes share the name (${ambiguous.length})`)
    for (const row of ambiguous) {
      console.log(`\n  ${row.count} product${row.count === 1 ? '' : 's'}  from  ${pathOf(row.from)}   /${row.from.slug}`)
      for (const option of row.options) console.log(`    option  ${pathOf(option)}   /${option.slug}`)
    }

    heading(`C. No tree A equivalent — needs a decision (${unmatched.length})`)
    for (const row of unmatched) {
      console.log(`\n  ${row.count} product${row.count === 1 ? '' : 's'}  ${pathOf(row.from)}   /${row.from.slug}`)
      for (const product of (productsOn.get(row.from.id) ?? []).slice(0, 4)) {
        console.log(`      - ${product.brand} ${product.name}`)
      }
      const siblings = (childrenOf.get(row.from.parentId) ?? []).filter((node) => !isTreeB(node))
      if (siblings.length > 0) {
        console.log(`      tree A siblings available here: ${siblings.map((node) => node.name).join(', ')}`)
      }
    }

    // The bigger problem is not the two trees. Most products were never filed
    // into a subcategory at all, so a drill-down has nowhere to descend to.
    const roots = childrenOf.get(null) ?? []
    const rootStranded = roots
      .map((root) => ({
        root,
        products: productsOn.get(root.id) ?? [],
        treeAChildren: (childrenOf.get(root.id) ?? []).filter((node) => !isTreeB(node)),
      }))
      .filter((row) => row.products.length > 0)
      .sort((a, b) => b.products.length - a.products.length)

    heading(`D. Products filed directly on a department, with no subcategory (${rootStranded.reduce((sum, row) => sum + row.products.length, 0)})`)
    for (const row of rootStranded) {
      console.log(`\n  ${row.root.name} — ${row.products.length} products sitting at the top`)
      console.log(`    tree A subcategories available to file them into (${row.treeAChildren.length}):`)
      console.log(`      ${row.treeAChildren.map((node) => node.name).join(', ') || 'NONE — this department has no tree A structure'}`)
      for (const product of row.products.slice(0, 3)) console.log(`    e.g. ${product.brand} ${product.name}`)
      if (row.products.length > 3) console.log(`    ...and ${row.products.length - 3} more`)
    }

    heading('Summary')
    const covered = confident.reduce((sum, row) => sum + row.count, 0)
    const needsChoice = ambiguous.reduce((sum, row) => sum + row.count, 0)
    const needsDecision = unmatched.reduce((sum, row) => sum + row.count, 0)
    console.log(
      JSON.stringify(
        {
          treeANodes: treeA.length,
          treeBNodes: treeB.length,
          confidentMappings: confident.length,
          ambiguousMappings: ambiguous.length,
          unmatchedNodes: unmatched.length,
          productAssignmentsAutoMapped: covered,
          productAssignmentsNeedingAChoice: needsChoice,
          productAssignmentsNeedingADecision: needsDecision,
        },
        null,
        2,
      ),
    )
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
