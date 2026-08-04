import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"
import { prisma } from "@workspace/db"

const confirmation = "REMOVE_DEMO_DATA"
const apply = process.argv.includes("--apply")

const preservedTables = new Set([
  "_prisma_migrations",
  "User",
  "Category",
  "Stage",
  "Room",
  "Unit",
  "UnitConversion",
])

type TableNameRow = { table_name: string }
type CountRow = { count: bigint }
type StorageObject = { bucket: string; objectPath: string }

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

function jsonReplacer(_key: string, value: unknown) {
  return typeof value === "bigint" ? value.toString() : value
}

function storageObjectFromUrl(value: string): StorageObject | null {
  try {
    const url = new URL(value)
    const marker = "/storage/v1/object/public/"
    const index = url.pathname.indexOf(marker)
    if (index < 0) return null
    const [bucket, ...parts] = url.pathname.slice(index + marker.length).split("/")
    if (!bucket || parts.length === 0) return null
    return { bucket: decodeURIComponent(bucket), objectPath: parts.map(decodeURIComponent).join("/") }
  } catch {
    return null
  }
}

async function tableNames() {
  const rows = await prisma.$queryRaw<TableNameRow[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `
  return rows.map((row) => row.table_name)
}

async function tableCount(table: string) {
  const rows = await prisma.$queryRawUnsafe<CountRow[]>(
    `SELECT COUNT(*)::bigint AS count FROM ${quoteIdentifier(table)}`,
  )
  return Number(rows[0]?.count ?? 0)
}

async function referencedStorageObjects() {
  const rows = await prisma.$queryRaw<Array<{ url: string | null }>>`
    SELECT src AS url FROM "ProductImage"
    UNION ALL SELECT logo AS url FROM "Brand"
    UNION ALL SELECT "photoUrl" AS url FROM "Professional"
    UNION ALL SELECT "imageUrl" AS url FROM "HomepageSlide"
    UNION ALL SELECT "imageUrl" AS url FROM "Category"
  `
  const unique = new Map<string, StorageObject>()
  for (const row of rows) {
    if (!row.url) continue
    const parsed = storageObjectFromUrl(row.url)
    if (!parsed) continue
    unique.set(`${parsed.bucket}/${parsed.objectPath}`, parsed)
  }
  return [...unique.values()]
}

async function backup(tables: string[]) {
  const data: Record<string, unknown[]> = {}
  for (const table of tables) {
    if (table === "_prisma_migrations") continue
    data[table] = await prisma.$queryRawUnsafe<unknown[]>(
      `SELECT * FROM ${quoteIdentifier(table)}`,
    )
  }
  const backupDirectory = path.resolve(process.cwd(), "../..", "backups")
  await mkdir(backupDirectory, { recursive: true })
  const timestamp = new Date().toISOString().replaceAll(":", "-")
  const backupPath = path.join(backupDirectory, `before-real-data-reset-${timestamp}.json`)
  await writeFile(
    backupPath,
    JSON.stringify({ createdAt: new Date().toISOString(), data }, jsonReplacer, 2),
    "utf8",
  )
  return backupPath
}

async function removeStorageObjects(objects: StorageObject[]) {
  if (objects.length === 0) return 0
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !secretKey) {
    throw new Error("Supabase URL and server secret key are required to remove demo storage objects.")
  }
  const storage = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const byBucket = new Map<string, string[]>()
  for (const object of objects) {
    const paths = byBucket.get(object.bucket) ?? []
    paths.push(object.objectPath)
    byBucket.set(object.bucket, paths)
  }
  let removed = 0
  for (const [bucket, paths] of byBucket) {
    for (let index = 0; index < paths.length; index += 100) {
      const batch = paths.slice(index, index + 100)
      const { data, error } = await storage.storage.from(bucket).remove(batch)
      if (error) throw new Error(`Could not clean ${bucket}: ${error.message}`)
      removed += data?.length ?? 0
    }
  }
  return removed
}

async function main() {
  const tables = await tableNames()
  const businessTables = tables.filter((table) => !preservedTables.has(table))
  const populated: Array<{ table: string; records: number }> = []
  for (const table of businessTables) {
    const records = await tableCount(table)
    if (records > 0) populated.push({ table, records })
  }
  const storageObjects = await referencedStorageObjects()

  console.log(JSON.stringify({
    mode: apply ? "apply" : "audit",
    preservedTables: [...preservedTables],
    populatedBusinessTables: populated,
    referencedStorageObjects: storageObjects.length,
  }, null, 2))

  if (!apply) {
    console.log(`Audit only. Set CONFIRM_REAL_DATA_RESET=${confirmation} and add --apply to continue.`)
    return
  }
  if (process.env.CONFIRM_REAL_DATA_RESET !== confirmation) {
    throw new Error(`Refusing cleanup without CONFIRM_REAL_DATA_RESET=${confirmation}.`)
  }

  const backupPath = await backup(tables)
  const truncateList = businessTables.map(quoteIdentifier).join(", ")
  await prisma.$transaction(async (transaction) => {
    if (truncateList) {
      await transaction.$executeRawUnsafe(`TRUNCATE TABLE ${truncateList} RESTART IDENTITY CASCADE`)
    }
    await transaction.category.updateMany({
      data: { imageUrl: null, featured: false },
    })
  }, { timeout: 120_000 })

  const removedStorageObjects = await removeStorageObjects(storageObjects)
  const remaining = await Promise.all(businessTables.map(async (table) => ({
    table,
    records: await tableCount(table),
  })))
  const notEmpty = remaining.filter((item) => item.records > 0)
  if (notEmpty.length > 0) {
    throw new Error(`Cleanup verification failed: ${JSON.stringify(notEmpty)}`)
  }

  console.log(JSON.stringify({
    status: "complete",
    backupPath,
    removedDatabaseRecords: populated.reduce((total, item) => total + item.records, 0),
    removedStorageObjects,
    preserved: {
      users: await tableCount("User"),
      categories: await tableCount("Category"),
      stages: await tableCount("Stage"),
      rooms: await tableCount("Room"),
      units: await tableCount("Unit"),
    },
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
