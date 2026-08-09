import 'dotenv/config'
import { PrismaClient } from './../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Mirrors CategoriesService.slugPart so anything created here is
// indistinguishable from a category created through the admin UI.
function slugPart(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

type Planned = {
  parentPath: string[]
  name: string
  description: string
  sortOrder: number
  children?: Array<{ name: string; description: string; sortOrder: number }>
}

const PLAN: Planned[] = [
  {
    parentPath: ['Plumbing & Sanitary'],
    name: 'Water Supply Pipes',
    description: 'CPVC and UPVC pipes for hot and cold water supply lines.',
    sortOrder: 10,
  },
  {
    parentPath: ['Plumbing & Sanitary'],
    name: 'Soil & Waste Pipes',
    description: 'UPVC soil, waste and rainwater drainage pipes.',
    sortOrder: 20,
  },
  {
    parentPath: ['Plumbing & Sanitary'],
    name: 'Pipe Fittings',
    description: 'Elbows, tees, couplers, reducers and bends for supply and drainage lines.',
    sortOrder: 30,
  },
  {
    parentPath: ['Plumbing & Sanitary'],
    name: 'Valves & Taps',
    description: 'Ball valves, gate valves, stop cocks and bib taps.',
    sortOrder: 40,
  },
  {
    parentPath: ['Plumbing & Sanitary'],
    name: 'Water Tanks',
    description: 'Overhead and underground water storage tanks.',
    sortOrder: 50,
  },
  {
    parentPath: ['Cement & Structure', 'Bricks'],
    name: 'Block Jointing Adhesive',
    description: 'Thin-bed adhesive mortar for AAC and concrete block masonry.',
    sortOrder: 70,
  },
  {
    parentPath: ['Tiles & Flooring'],
    name: 'Tile Adhesives & Grouts',
    description: 'Bonding and jointing materials for tile installation.',
    sortOrder: 60,
    children: [
      { name: 'Tile Adhesive', description: 'Cement and polymer based tile bonding adhesives.', sortOrder: 10 },
      { name: 'Tile Grout', description: 'Cementitious and epoxy grouts for tile joints.', sortOrder: 20 },
    ],
  },
  {
    parentPath: ['Paints'],
    name: 'Wall Putty',
    description: 'Cement and acrylic wall putty for levelling interior and exterior surfaces before painting.',
    sortOrder: 55,
  },
  {
    parentPath: ['Electrical', 'Wires & Cables'],
    name: 'Earth Continuity Wire',
    description: 'Green earth continuity conductors for residential wiring circuits.',
    sortOrder: 40,
  },
]

const APPLY = process.argv.includes('--apply')

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

  const pool = new Pool({ connectionString })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true, parentId: true },
    })

    const resolvePath = (path: string[]) => {
      let parentId: string | null = null
      let node: { id: string; name: string; slug: string } | undefined
      for (const segment of path) {
        node = categories.find((candidate) => candidate.name === segment && candidate.parentId === parentId)
        if (!node) return undefined
        parentId = node.id
      }
      return node
    }

    let created = 0
    let skipped = 0
    const missingParents: string[] = []

    for (const item of PLAN) {
      const parent = resolvePath(item.parentPath)
      if (!parent) {
        missingParents.push(`${item.parentPath.join(' > ')} (wanted for "${item.name}")`)
        continue
      }

      const slug = `${parent.slug}/${slugPart(item.name)}`
      const existing = categories.find((candidate) => candidate.slug === slug)
      if (existing) {
        console.log(`  skip    ${item.parentPath.join(' > ')} > ${item.name}  — already exists`)
        skipped += 1
      } else {
        console.log(`  ${APPLY ? 'CREATE' : 'would'}  ${item.parentPath.join(' > ')} > ${item.name}   /${slug}`)
        if (APPLY) {
          const node = await prisma.category.create({
            data: {
              name: item.name,
              slug,
              description: item.description,
              parentId: parent.id,
              sortOrder: item.sortOrder,
              published: true,
            },
            select: { id: true, name: true, slug: true, parentId: true },
          })
          categories.push(node)
        }
        created += 1
      }

      for (const child of item.children ?? []) {
        const parentNode = categories.find((candidate) => candidate.slug === slug)
        const childSlug = `${slug}/${slugPart(child.name)}`
        if (categories.find((candidate) => candidate.slug === childSlug)) {
          console.log(`  skip      └ ${child.name}  — already exists`)
          skipped += 1
          continue
        }
        console.log(`  ${APPLY ? 'CREATE' : 'would'}    └ ${child.name}   /${childSlug}`)
        if (APPLY && parentNode) {
          const node = await prisma.category.create({
            data: {
              name: child.name,
              slug: childSlug,
              description: child.description,
              parentId: parentNode.id,
              sortOrder: child.sortOrder,
              published: true,
            },
            select: { id: true, name: true, slug: true, parentId: true },
          })
          categories.push(node)
        }
        created += 1
      }
    }

    if (missingParents.length > 0) {
      console.log('\n  PARENT NOT FOUND — nothing created for these:')
      for (const entry of missingParents) console.log(`    ${entry}`)
    }

    console.log(`\n${APPLY ? 'Created' : 'Would create'}: ${created}   Skipped (already present): ${skipped}`)
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
