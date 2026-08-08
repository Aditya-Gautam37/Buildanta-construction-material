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
  sortOrder: number
}

function normalized(name: string) {
  return name.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim()
}

function heading(title: string) {
  console.log(`\n${title}\n${'-'.repeat(title.length)}`)
}

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

  const pool = new Pool({ connectionString })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    const [categories, publishedProducts] = await Promise.all([
      prisma.category.findMany({
        select: { id: true, name: true, slug: true, parentId: true, published: true, sortOrder: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.product.findMany({
        where: { status: 'PUBLISHED' },
        select: { id: true, name: true, categories: { select: { id: true } } },
      }),
    ])

    const byId = new Map(categories.map((node) => [node.id, node as Node]))
    const childrenOf = new Map<string | null, Node[]>()
    for (const node of categories) {
      const siblings = childrenOf.get(node.parentId) ?? []
      siblings.push(node)
      childrenOf.set(node.parentId, siblings)
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

    const directProducts = new Map<string, string[]>()
    for (const product of publishedProducts) {
      for (const category of product.categories) {
        const names = directProducts.get(category.id) ?? []
        names.push(product.name)
        directProducts.set(category.id, names)
      }
    }

    const subtreeCount = new Map<string, number>()
    const countSubtree = (node: Node): number => {
      const cached = subtreeCount.get(node.id)
      if (cached !== undefined) return cached
      subtreeCount.set(node.id, 0)
      const own = (directProducts.get(node.id) ?? []).length
      const below = (childrenOf.get(node.id) ?? []).reduce((sum, child) => sum + countSubtree(child), 0)
      const total = own + below
      subtreeCount.set(node.id, total)
      return total
    }
    for (const node of categories) countSubtree(node as Node)

    const roots = childrenOf.get(null) ?? []

    console.log(`Categories: ${categories.length} (${categories.filter((node) => node.published).length} published)`)
    console.log(`Root categories: ${roots.length}`)
    console.log(`Published products: ${publishedProducts.length}`)

    const collisions: Array<{ parent: string; name: string; nodes: Node[] }> = []
    const similar: Array<{ parent: string; a: Node; b: Node }> = []
    for (const [parentId, siblings] of childrenOf) {
      const parentLabel = parentId ? pathOf(byId.get(parentId)!) : '(root)'
      const groups = new Map<string, Node[]>()
      for (const sibling of siblings) {
        const key = normalized(sibling.name)
        groups.set(key, [...(groups.get(key) ?? []), sibling])
      }
      for (const [key, group] of groups) {
        if (group.length > 1) collisions.push({ parent: parentLabel, name: key, nodes: group })
      }
      const keys = [...groups.keys()]
      for (let i = 0; i < keys.length; i += 1) {
        for (let j = i + 1; j < keys.length; j += 1) {
          const [a, b] = [keys[i]!, keys[j]!]
          const contained = a.includes(b) || b.includes(a)
          if (contained && groups.get(a)!.length === 1 && groups.get(b)!.length === 1) {
            similar.push({ parent: parentLabel, a: groups.get(a)![0]!, b: groups.get(b)![0]! })
          }
        }
      }
    }

    heading(`1. Duplicate sibling names — merge candidates (${collisions.length})`)
    if (collisions.length === 0) console.log('None.')
    for (const collision of collisions) {
      console.log(`\n  under ${collision.parent}`)
      for (const node of collision.nodes) {
        const children = (childrenOf.get(node.id) ?? []).length
        console.log(
          `    ${node.name}  slug=/${node.slug}  children=${children}  direct=${(directProducts.get(node.id) ?? []).length}  subtree=${subtreeCount.get(node.id) ?? 0}  ${node.published ? '' : '[unpublished] '}id=${node.id}`,
        )
      }
    }

    const slashed = categories.filter((node) => node.slug.includes('/'))
    heading(`2. Slugs containing "/" — unreachable at /categories/[slug] (${slashed.length})`)
    if (slashed.length === 0) console.log('None.')
    for (const node of slashed) {
      console.log(`    /${node.slug}  <-  ${pathOf(node as Node)}  subtree=${subtreeCount.get(node.id) ?? 0}`)
    }

    const emptyRoots = roots.filter((node) => (subtreeCount.get(node.id) ?? 0) === 0)
    const emptyOthers = categories.filter(
      (node) => node.parentId !== null && (subtreeCount.get(node.id) ?? 0) === 0,
    )
    heading(`3. No published product in subtree — hidden by the wizard (${emptyRoots.length} roots, ${emptyOthers.length} deeper)`)
    if (emptyRoots.length === 0) console.log('Roots: none, every department reaches a product.')
    for (const node of emptyRoots) console.log(`    ROOT  ${node.name}  slug=/${node.slug}  children=${(childrenOf.get(node.id) ?? []).length}`)
    if (emptyOthers.length > 0) {
      console.log(`\n  Deeper nodes (${emptyOthers.length}):`)
      for (const node of emptyOthers) console.log(`    ${pathOf(node as Node)}  slug=/${node.slug}`)
    }

    heading(`4. Similar sibling names — review, not necessarily wrong (${similar.length})`)
    if (similar.length === 0) console.log('None.')
    for (const pair of similar) {
      console.log(`  under ${pair.parent}`)
      console.log(`    "${pair.a.name}" (/${pair.a.slug}, subtree=${subtreeCount.get(pair.a.id) ?? 0})  vs  "${pair.b.name}" (/${pair.b.slug}, subtree=${subtreeCount.get(pair.b.id) ?? 0})`)
    }

    const strandedProducts = publishedProducts.filter(
      (product) => product.categories.length === 0 || product.categories.every((category) => byId.get(category.id)?.published === false),
    )
    heading(`5. Published products unreachable through the category tree (${strandedProducts.length})`)
    if (strandedProducts.length === 0) console.log('None.')
    for (const product of strandedProducts) {
      console.log(`    ${product.name}  ${product.categories.length === 0 ? '(no category assigned)' : '(all assigned categories unpublished)'}`)
    }

    heading('Summary')
    console.log(
      JSON.stringify(
        {
          categories: categories.length,
          publishedProducts: publishedProducts.length,
          duplicateSiblingGroups: collisions.length,
          slashedSlugs: slashed.length,
          emptyRootCategories: emptyRoots.length,
          emptyDeeperCategories: emptyOthers.length,
          similarSiblingPairs: similar.length,
          strandedProducts: strandedProducts.length,
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
