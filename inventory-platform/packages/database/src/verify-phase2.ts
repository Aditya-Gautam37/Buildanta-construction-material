import 'dotenv/config'
import { PrismaClient } from './../generated/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Phase 2 verification failed: ${message}`)
}

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

  const pool = new Pool({ connectionString })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    const demoReferences = [
      'DEMO-BQ-SUBMITTED-001',
      'DEMO-BQ-REVIEWING-001',
      'DEMO-BQ-QUOTED-001',
      'DEMO-BQ-ACCEPTED-001',
    ]
    const [demoQuotations, quoteRequestCount, importedQuoteCount, order, negativeBalances] = await Promise.all([
      prisma.quotation.findMany({
        where: { reference: { in: demoReferences } },
        include: { items: true, revisions: { include: { approvals: true } } },
      }),
      prisma.quoteRequest.count(),
      prisma.quotation.count({ where: { sourceQuoteRequestId: { not: null } } }),
      prisma.salesOrder.findUnique({
        where: { reference: 'DEMO-SO-ACCEPTED-001' },
        include: { items: { include: { reservation: true } }, quotation: true },
      }),
      prisma.inventoryBalance.findMany({
        where: {
          OR: [
            { physicalQuantity: { lt: 0 } },
            { reservedQuantity: { lt: 0 } },
            { blockedQuantity: { lt: 0 } },
            { damagedQuantity: { lt: 0 } },
            { quarantineQuantity: { lt: 0 } },
          ],
        },
        select: { id: true },
      }),
    ])

    assert(demoQuotations.length === demoReferences.length, 'all labelled demo quotation states must exist')
    assert(demoQuotations.every((quotation) => quotation.items.length === 2), 'every demo quotation must contain two lines')
    assert(quoteRequestCount === importedQuoteCount, 'every legacy/public QuoteRequest must map to a canonical Quotation')
    assert(order, 'the accepted demo quotation must have a sales order')
    assert(order.quotation.reference === 'DEMO-BQ-ACCEPTED-001', 'the sales order must reference the accepted quotation')
    assert(order.items.length === 2, 'the accepted sales order must preserve both quotation lines')
    assert(order.items.every((item) => item.reservation && ['ACTIVE', 'CONSUMED'].includes(item.reservation.status)), 'every accepted order line must retain an active or consumed reservation record')
    assert(
      order.items.reduce((sum, item) => sum + item.quantity, 0) ===
        order.items.reduce((sum, item) => sum + (item.reservation?.quantity ?? 0), 0),
      'reserved quantity must equal ordered quantity',
    )
    assert(negativeBalances.length === 0, 'inventory balances must never be negative')

    const protectedTables = [
      'Quotation',
      'QuotationItem',
      'QuotationRevision',
      'QuotationRevisionItem',
      'QuotationStatusHistory',
      'QuotationApproval',
      'SalesOrder',
      'SalesOrderItem',
    ]
    const rlsRows = await prisma.$queryRaw<Array<{ relname: string; relrowsecurity: boolean }>>`
      SELECT c.relname, c.relrowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = ANY(${protectedTables})
    `
    assert(rlsRows.length === protectedTables.length, 'all Phase 2 tables must exist')
    assert(rlsRows.every((row) => row.relrowsecurity), 'RLS must be enabled on every Phase 2 table')

    const publicGrants = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name = ANY(${protectedTables})
        AND grantee IN ('anon', 'authenticated')
    `
    assert(publicGrants.length === 0, 'anon/authenticated roles must not have direct Phase 2 table grants')

    console.log(JSON.stringify({
      phase: 2,
      quotations: demoQuotations.length,
      canonicalQuoteMappings: importedQuoteCount,
      salesOrders: 1,
      reservedOrderLines: order.items.length,
      rlsProtectedTables: rlsRows.length,
      result: 'passed',
    }))
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
