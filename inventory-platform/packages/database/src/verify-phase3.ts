import "dotenv/config"
import { PrismaClient } from "./../generated/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const assert: (value: unknown, message: string) => asserts value = (
  value,
  message
) => {
  if (!value) throw new Error(`Phase 3 verification failed: ${message}`)
}

type Snapshot = Record<string, unknown>

function number(snapshot: Snapshot, key: string) {
  const value = snapshot[key]
  assert(typeof value === "number", `ledger snapshot is missing numeric ${key}`)
  return value
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL environment variable is not set")

  const pool = new Pool({ connectionString: url })
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })
  try {
    const [
      warehouses,
      requisition,
      rfq,
      purchaseOrder,
      receipt,
      dispatch,
      returnRequest,
      ledger,
      badBalances,
    ] = await Promise.all([
      prisma.warehouse.count({
        where: {
          code: { in: ["DEMO-KANPUR-EAST", "DEMO-KANPUR-SOUTH"] },
          active: true,
        },
      }),
      prisma.purchaseRequisition.findUnique({
        where: { reference: "DEMO-PR-001" },
        include: { items: true },
      }),
      prisma.supplierRFQ.findUnique({
        where: { reference: "DEMO-RFQ-001" },
        include: { items: true, responses: { include: { items: true } } },
      }),
      prisma.purchaseOrder.findUnique({
        where: { reference: "DEMO-PO-001" },
        include: { items: true, approvalHistory: true },
      }),
      prisma.goodsReceipt.findUnique({
        where: { reference: "DEMO-GRN-001" },
        include: { items: true },
      }),
      prisma.dispatch.findUnique({
        where: { reference: "DEMO-DSP-001" },
        include: {
          items: true,
          challan: true,
          proofOfDelivery: true,
          history: true,
        },
      }),
      prisma.returnRequest.findUnique({
        where: { reference: "DEMO-RET-001" },
        include: {
          items: { include: { inspection: true } },
          replacement: { include: { items: true } },
        },
      }),
      prisma.inventoryLedgerEntry.findMany({
        where: {
          reference: { in: ["DEMO-GRN-001", "DEMO-DSP-001", "DEMO-RET-001"] },
        },
        orderBy: { createdAt: "asc" },
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

    assert(warehouses === 2, "both labelled DEMO warehouses must exist")
    assert(
      requisition?.status === "APPROVED" && requisition.items.length === 1,
      "approved DEMO purchase requisition is incomplete"
    )
    assert(
      rfq?.status === "CLOSED" &&
        rfq.responses.length === 1 &&
        rfq.responses[0]?.status === "SELECTED",
      "closed DEMO supplier comparison is incomplete"
    )
    assert(
      purchaseOrder?.status === "RECEIVED" &&
        purchaseOrder.items[0]?.receivedQuantity ===
          purchaseOrder.items[0]?.orderedQuantity,
      "DEMO purchase order was not fully received"
    )
    assert(
      purchaseOrder.approvalHistory.length === 3,
      "DEMO purchase order approval history is incomplete"
    )
    assert(
      receipt?.status === "POSTED" &&
        receipt.items[0]?.acceptedQuantity === 10 &&
        receipt.items[0]?.rejectedQuantity === 1 &&
        receipt.items[0]?.damagedQuantity === 1,
      "DEMO goods receipt quality quantities are incorrect"
    )
    assert(
      dispatch?.status === "DELIVERED" &&
        dispatch.items.length === 1 &&
        dispatch.challan &&
        dispatch.proofOfDelivery &&
        dispatch.history.length === 3,
      "DEMO dispatch, challan or proof of delivery is incomplete"
    )
    assert(
      returnRequest?.status === "RESOLVED" &&
        returnRequest.items[0]?.inspection?.decision === "RESTOCK",
      "DEMO return inspection is incomplete"
    )
    assert(
      returnRequest.replacement?.status === "APPROVED" &&
        returnRequest.replacement.items.length === 1,
      "DEMO replacement is incomplete"
    )
    assert(
      ledger.some((entry) => entry.type === "GOODS_RECEIPT") &&
        ledger.some((entry) => entry.type === "DISPATCH") &&
        ledger.filter((entry) => entry.type === "CUSTOMER_RETURN").length === 2,
      "DEMO business-document ledger entries are incomplete"
    )
    assert(badBalances.length === 0, "negative stock bucket found")

    const deltas = [
      ["physicalQuantity", "physicalDelta"],
      ["reservedQuantity", "reservedDelta"],
      ["blockedQuantity", "blockedDelta"],
      ["damagedQuantity", "damagedDelta"],
      ["quarantineQuantity", "quarantineDelta"],
      ["inTransitQuantity", "inTransitDelta"],
    ] as const
    for (const entry of ledger) {
      const before = entry.before as Snapshot
      const after = entry.after as Snapshot
      for (const [quantity, delta] of deltas) {
        assert(
          number(before, quantity) + entry[delta] === number(after, quantity),
          `${entry.reference} ${quantity} does not reconcile with its ledger delta`
        )
      }
    }

    const tables = [
      "PurchaseRequisition",
      "PurchaseRequisitionItem",
      "SupplierRFQ",
      "SupplierRFQItem",
      "SupplierRFQResponse",
      "SupplierRFQResponseItem",
      "PurchaseOrder",
      "PurchaseOrderItem",
      "PurchaseOrderApprovalHistory",
      "GoodsReceipt",
      "GoodsReceiptItem",
      "SupplierReturn",
      "SupplierReturnItem",
      "PickingList",
      "PickingListItem",
      "DeliverySchedule",
      "Dispatch",
      "DispatchItem",
      "DeliveryChallan",
      "DeliveryStatusHistory",
      "ProofOfDelivery",
      "ReturnRequest",
      "ReturnItem",
      "ReturnInspection",
      "Replacement",
      "ReplacementItem",
      "CreditNote",
    ]
    const rls = await prisma.$queryRaw<
      Array<{ relname: string; relrowsecurity: boolean }>
    >`SELECT c.relname,c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=ANY(${tables})`
    assert(
      rls.length === tables.length &&
        rls.every((table) => table.relrowsecurity),
      "all Phase 3 tables must have RLS"
    )
    const grants = await prisma.$queryRaw<
      Array<{ table_name: string }>
    >`SELECT table_name FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name=ANY(${tables}) AND grantee IN ('anon','authenticated')`
    assert(grants.length === 0, "browser roles have direct Phase 3 grants")

    console.log(
      JSON.stringify({
        phase: 3,
        demoWarehouses: warehouses,
        purchaseOrder: purchaseOrder.reference,
        goodsReceipt: receipt.reference,
        dispatch: dispatch.reference,
        returnRequest: returnRequest.reference,
        ledgerEntries: ledger.length,
        rlsProtectedTables: rls.length,
        result: "passed",
      })
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
