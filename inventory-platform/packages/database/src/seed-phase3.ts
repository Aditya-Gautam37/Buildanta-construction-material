import {
  DeliveryScheduleStatus,
  DispatchStatus,
  GoodsReceiptStatus,
  InventoryLedgerType,
  InventoryReservationStatus,
  PaymentStatus,
  PickingListStatus,
  PrismaClient,
  PurchaseApprovalDecision,
  PurchaseOrderStatus,
  PurchaseRequisitionStatus,
  QuotationApprovalStatus,
  QuotationStatus,
  ReplacementStatus,
  ReturnInspectionDecision,
  ReturnRequestStatus,
  SalesOrderStatus,
  SupplierResponseStatus,
  SupplierRFQStatus,
} from "./../generated/client"

type Phase3SeedContext = {
  supplierId: string
  variantId: string
  fulfilmentLocationId: string
  carrierId: string
}

type BalanceSnapshot = {
  physicalQuantity: number
  reservedQuantity: number
  blockedQuantity: number
  damagedQuantity: number
  quarantineQuantity: number
  inTransitQuantity: number
}

function snapshot(balance: BalanceSnapshot) {
  return {
    physicalQuantity: balance.physicalQuantity,
    reservedQuantity: balance.reservedQuantity,
    blockedQuantity: balance.blockedQuantity,
    damagedQuantity: balance.damagedQuantity,
    quarantineQuantity: balance.quarantineQuantity,
    inTransitQuantity: balance.inTransitQuantity,
  }
}

export async function seedPhase3Operations(
  prisma: PrismaClient,
  context: Phase3SeedContext
) {
  await seedProcurementJourney(prisma, context)
  await seedDeliveryAndReturnJourney(prisma, context)
}

async function seedProcurementJourney(
  prisma: PrismaClient,
  context: Phase3SeedContext
) {
  const existing = await prisma.purchaseRequisition.findUnique({
    where: { reference: "DEMO-PR-001" },
  })
  if (existing) return

  await prisma.$transaction(async (tx) => {
    const requisition = await tx.purchaseRequisition.create({
      data: {
        reference: "DEMO-PR-001",
        status: PurchaseRequisitionStatus.APPROVED,
        requiredBy: new Date("2026-08-10T00:00:00.000Z"),
        reason: "DEMO replenishment for the Kanpur catalogue.",
        internalNotes: "DEMO data only - not a real purchase request.",
        submittedAt: new Date("2026-08-01T04:00:00.000Z"),
        decidedAt: new Date("2026-08-01T05:00:00.000Z"),
        decisionReason: "DEMO approved for workflow testing.",
        items: {
          create: {
            variantId: context.variantId,
            targetLocationId: context.fulfilmentLocationId,
            quantity: 12,
            unitCode: "BOX",
            notes: "DEMO purchase line.",
          },
        },
      },
      include: { items: true },
    })
    const requisitionItem = requisition.items[0]
    if (!requisitionItem)
      throw new Error("The DEMO requisition line was not created.")

    const rfq = await tx.supplierRFQ.create({
      data: {
        reference: "DEMO-RFQ-001",
        purchaseRequisitionId: requisition.id,
        status: SupplierRFQStatus.CLOSED,
        responseDueAt: new Date("2026-08-02T12:00:00.000Z"),
        sentAt: new Date("2026-08-01T06:00:00.000Z"),
        closedAt: new Date("2026-08-02T06:00:00.000Z"),
        notes: "DEMO supplier comparison request.",
        items: {
          create: {
            purchaseRequisitionItemId: requisitionItem.id,
            variantId: context.variantId,
            targetLocationId: context.fulfilmentLocationId,
            quantity: 12,
            unitCode: "BOX",
          },
        },
      },
      include: { items: true },
    })
    const rfqItem = rfq.items[0]
    if (!rfqItem) throw new Error("The DEMO supplier RFQ line was not created.")

    const response = await tx.supplierRFQResponse.create({
      data: {
        reference: "DEMO-SR-001",
        supplierRfqId: rfq.id,
        supplierId: context.supplierId,
        status: SupplierResponseStatus.SELECTED,
        validUntil: new Date("2099-12-31T23:59:59.000Z"),
        freightTotal: 500,
        notes: "DEMO selected supplier response.",
        items: {
          create: {
            supplierRfqItemId: rfqItem.id,
            offeredQuantity: 12,
            unitCost: 900,
            gstPercent: 18,
            leadTimeDays: 3,
          },
        },
      },
    })

    const purchaseOrder = await tx.purchaseOrder.create({
      data: {
        reference: "DEMO-PO-001",
        supplierId: context.supplierId,
        supplierResponseId: response.id,
        status: PurchaseOrderStatus.RECEIVED,
        expectedAt: new Date("2026-08-04T09:00:00.000Z"),
        subtotal: 10800,
        gstTotal: 1944,
        freightTotal: 500,
        grandTotal: 13244,
        paymentTerms: "DEMO: 30 days after accepted receipt.",
        internalNotes: "DEMO purchase order - not a real supplier commitment.",
        approvedAt: new Date("2026-08-02T07:00:00.000Z"),
        sentAt: new Date("2026-08-02T08:00:00.000Z"),
        items: {
          create: {
            variantId: context.variantId,
            targetLocationId: context.fulfilmentLocationId,
            orderedQuantity: 12,
            receivedQuantity: 12,
            unitCode: "BOX",
            unitCost: 900,
            gstPercent: 18,
            lineTotal: 12744,
          },
        },
        approvalHistory: {
          create: [
            {
              decision: PurchaseApprovalDecision.SUBMITTED,
              reason: "DEMO order created from the selected supplier response.",
            },
            {
              decision: PurchaseApprovalDecision.APPROVED,
              reason: "DEMO purchase approval.",
            },
            {
              decision: PurchaseApprovalDecision.SENT,
              reason: "DEMO purchase order sent.",
            },
          ],
        },
      },
      include: { items: true },
    })
    const purchaseOrderItem = purchaseOrder.items[0]
    if (!purchaseOrderItem)
      throw new Error("The DEMO purchase-order line was not created.")

    const receipt = await tx.goodsReceipt.create({
      data: {
        reference: "DEMO-GRN-001",
        purchaseOrderId: purchaseOrder.id,
        fulfilmentLocationId: context.fulfilmentLocationId,
        status: GoodsReceiptStatus.POSTED,
        supplierDocument: "DEMO-SUPPLIER-CHALLAN-001",
        receivedAt: new Date("2026-08-03T06:30:00.000Z"),
        postedAt: new Date("2026-08-03T07:00:00.000Z"),
        qualityNotes: "DEMO receipt: 10 accepted, 1 rejected and 1 damaged.",
        items: {
          create: {
            purchaseOrderItemId: purchaseOrderItem.id,
            variantId: context.variantId,
            receivedQuantity: 12,
            acceptedQuantity: 10,
            rejectedQuantity: 1,
            damagedQuantity: 1,
            shortageQuantity: 0,
            excessQuantity: 0,
            batchNumber: "DEMO-BATCH-001",
            lotNumber: "DEMO-LOT-001",
            manufacturedAt: new Date("2026-07-01T00:00:00.000Z"),
            inspectionNotes: "DEMO quality inspection completed.",
          },
        },
      },
    })

    const balance = await tx.inventoryBalance.findUniqueOrThrow({
      where: {
        variantId_fulfilmentLocationId: {
          variantId: context.variantId,
          fulfilmentLocationId: context.fulfilmentLocationId,
        },
      },
    })
    const before = snapshot(balance)
    const updated = await tx.inventoryBalance.update({
      where: { id: balance.id },
      data: {
        physicalQuantity: { increment: 12 },
        damagedQuantity: { increment: 1 },
        quarantineQuantity: { increment: 1 },
      },
    })
    await tx.inventoryLedgerEntry.create({
      data: {
        balanceId: balance.id,
        type: InventoryLedgerType.GOODS_RECEIPT,
        physicalDelta: 12,
        damagedDelta: 1,
        quarantineDelta: 1,
        before,
        after: snapshot(updated),
        reason: "DEMO approved goods receipt posted.",
        reference: receipt.reference,
      },
    })
  })
}

async function seedDeliveryAndReturnJourney(
  prisma: PrismaClient,
  context: Phase3SeedContext
) {
  await ensureDemoFulfilmentOrder(prisma, context)
  const existing = await prisma.dispatch.findUnique({
    where: { reference: "DEMO-DSP-001" },
  })
  if (existing) return

  await prisma.$transaction(async (tx) => {
    const order = await tx.salesOrder.findUnique({
      where: { reference: "DEMO-SO-FULFILMENT-001" },
      include: { items: { include: { reservation: true } } },
    })
    if (
      !order ||
      !order.items.length ||
      order.items.some(
        (item) =>
          !item.reservation ||
          item.reservation.status !== InventoryReservationStatus.ACTIVE
      )
    ) {
      throw new Error(
        "The DEMO accepted sales order must have active reservations before Phase 3 data can be seeded."
      )
    }

    const pickedAt = new Date("2026-08-03T08:00:00.000Z")
    const deliveredAt = new Date("2026-08-03T12:30:00.000Z")
    const picking = await tx.pickingList.create({
      data: {
        reference: "DEMO-PICK-001",
        salesOrderId: order.id,
        fulfilmentLocationId: context.fulfilmentLocationId,
        status: PickingListStatus.PICKED,
        pickedAt,
        items: {
          create: order.items.map((item) => ({
            salesOrderItemId: item.id,
            requestedQuantity: item.quantity,
            pickedQuantity: item.quantity,
          })),
        },
      },
    })
    const schedule = await tx.deliverySchedule.create({
      data: {
        reference: "DEMO-DELIVERY-001",
        salesOrderId: order.id,
        carrierId: context.carrierId,
        scheduledFor: deliveredAt,
        status: DeliveryScheduleStatus.COMPLETED,
        deliveryAddress:
          "DEMO delivery address, Kanpur - not a real customer location.",
        contactName: "DEMO Project Customer",
        contactPhone: "+91 90000 03001",
        notes: "DEMO completed delivery schedule.",
      },
    })
    const dispatch = await tx.dispatch.create({
      data: {
        reference: "DEMO-DSP-001",
        salesOrderId: order.id,
        pickingListId: picking.id,
        deliveryScheduleId: schedule.id,
        carrierId: context.carrierId,
        status: DispatchStatus.DELIVERED,
        vehicleNumber: "DEMO-UP78-AA-0001",
        trackingReference: "DEMO-TRACK-001",
        dispatchedAt: pickedAt,
        deliveredAt,
        items: {
          create: order.items.map((item) => ({
            salesOrderItemId: item.id,
            reservationId: item.reservation!.id,
            fulfilmentLocationId: item.fulfilmentLocationId,
            quantity: item.quantity,
          })),
        },
        challan: {
          create: { number: "DEMO-DC-001", notes: "DEMO delivery challan." },
        },
        history: {
          create: [
            {
              toStatus: DispatchStatus.DRAFT,
              notes: "DEMO dispatch prepared.",
            },
            {
              fromStatus: DispatchStatus.DRAFT,
              toStatus: DispatchStatus.DISPATCHED,
              notes: "DEMO stock dispatched.",
            },
            {
              fromStatus: DispatchStatus.DISPATCHED,
              toStatus: DispatchStatus.DELIVERED,
              notes: "DEMO delivery completed.",
            },
          ],
        },
        proofOfDelivery: {
          create: {
            receivedBy: "DEMO Project Customer",
            receivedAt: deliveredAt,
            notes: "DEMO proof of delivery.",
          },
        },
      },
    })

    for (const item of order.items) {
      const balance = await tx.inventoryBalance.findUniqueOrThrow({
        where: {
          variantId_fulfilmentLocationId: {
            variantId: item.variantId,
            fulfilmentLocationId: item.fulfilmentLocationId,
          },
        },
      })
      if (
        balance.physicalQuantity < item.quantity ||
        balance.reservedQuantity < item.quantity
      ) {
        throw new Error(
          "The DEMO balance does not have enough physical and reserved stock for dispatch."
        )
      }
      const before = snapshot(balance)
      const updated = await tx.inventoryBalance.update({
        where: { id: balance.id },
        data: {
          physicalQuantity: { decrement: item.quantity },
          reservedQuantity: { decrement: item.quantity },
        },
      })
      await tx.inventoryLedgerEntry.create({
        data: {
          balanceId: balance.id,
          type: InventoryLedgerType.DISPATCH,
          physicalDelta: -item.quantity,
          reservedDelta: -item.quantity,
          before,
          after: snapshot(updated),
          reason: "DEMO dispatch consumed reserved stock.",
          reference: dispatch.reference,
        },
      })
      await tx.inventoryReservation.update({
        where: { id: item.reservation!.id },
        data: { status: InventoryReservationStatus.CONSUMED },
      })
    }

    const returnedOrderItem = order.items[0]
    if (!returnedOrderItem)
      throw new Error(
        "The DEMO sales order does not contain a returnable item."
      )
    const returnRequest = await tx.returnRequest.create({
      data: {
        reference: "DEMO-RET-001",
        salesOrderId: order.id,
        dispatchId: dispatch.id,
        status: ReturnRequestStatus.RESOLVED,
        reason: "DEMO return after delivery for workflow verification.",
        customerNotes: "DEMO data only.",
        internalNotes: "DEMO inspected and approved for replacement.",
        requestedAt: new Date("2026-08-03T13:00:00.000Z"),
        approvedAt: new Date("2026-08-03T13:30:00.000Z"),
        receivedAt: new Date("2026-08-03T14:30:00.000Z"),
        inspectedAt: new Date("2026-08-03T15:00:00.000Z"),
        resolvedAt: new Date("2026-08-03T15:00:00.000Z"),
        items: {
          create: {
            salesOrderItemId: returnedOrderItem.id,
            variantId: returnedOrderItem.variantId,
            fulfilmentLocationId: returnedOrderItem.fulfilmentLocationId,
            requestedQuantity: 1,
            receivedQuantity: 1,
          },
        },
      },
      include: { items: true },
    })
    const returnItem = returnRequest.items[0]
    if (!returnItem) throw new Error("The DEMO return line was not created.")
    const returnedBalance = await tx.inventoryBalance.findUniqueOrThrow({
      where: {
        variantId_fulfilmentLocationId: {
          variantId: returnedOrderItem.variantId,
          fulfilmentLocationId: returnedOrderItem.fulfilmentLocationId,
        },
      },
    })
    const returnBefore = snapshot(returnedBalance)
    const quarantined = await tx.inventoryBalance.update({
      where: { id: returnedBalance.id },
      data: {
        physicalQuantity: { increment: 1 },
        quarantineQuantity: { increment: 1 },
      },
    })
    await tx.inventoryLedgerEntry.create({
      data: {
        balanceId: returnedBalance.id,
        type: InventoryLedgerType.CUSTOMER_RETURN,
        physicalDelta: 1,
        quarantineDelta: 1,
        before: returnBefore,
        after: snapshot(quarantined),
        reason: "DEMO customer return received into quarantine.",
        reference: returnRequest.reference,
      },
    })
    const inspected = await tx.inventoryBalance.update({
      where: { id: returnedBalance.id },
      data: { quarantineQuantity: { decrement: 1 } },
    })
    await tx.inventoryLedgerEntry.create({
      data: {
        balanceId: returnedBalance.id,
        type: InventoryLedgerType.CUSTOMER_RETURN,
        quarantineDelta: -1,
        before: snapshot(quarantined),
        after: snapshot(inspected),
        reason: "DEMO return inspection: RESTOCK.",
        reference: returnRequest.reference,
      },
    })
    await tx.returnInspection.create({
      data: {
        returnItemId: returnItem.id,
        decision: ReturnInspectionDecision.RESTOCK,
        restockQuantity: 1,
        notes: "DEMO item passed inspection.",
      },
    })
    await tx.replacement.create({
      data: {
        reference: "DEMO-RPL-001",
        returnRequestId: returnRequest.id,
        status: ReplacementStatus.APPROVED,
        notes: "DEMO replacement approved for workflow testing.",
        items: {
          create: {
            returnItemId: returnItem.id,
            salesOrderItemId: returnedOrderItem.id,
            variantId: returnedOrderItem.variantId,
            fulfilmentLocationId: returnedOrderItem.fulfilmentLocationId,
            quantity: 1,
          },
        },
      },
    })
    await tx.salesOrder.update({
      where: { id: order.id },
      data: { status: SalesOrderStatus.RETURNED },
    })
  })
}

async function ensureDemoFulfilmentOrder(
  prisma: PrismaClient,
  context: Phase3SeedContext
) {
  const existing = await prisma.salesOrder.findUnique({
    where: { reference: "DEMO-SO-FULFILMENT-001" },
  })
  if (existing) return

  await prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUniqueOrThrow({
      where: { id: context.variantId },
      select: { productId: true },
    })
    const validUntil = new Date("2099-12-31T23:59:59.000Z")
    const quotation = await tx.quotation.create({
      data: {
        reference: "DEMO-BQ-FULFILMENT-001",
        customerName: "DEMO Fulfilment Customer",
        customerEmail: "phase3.customer@example.invalid",
        customerPhone: "+91 90000 03002",
        company: "DEMO Delivery Project",
        deliveryPincode: "208001",
        projectType: "DEMO residential construction",
        customerNotes: "DEMO data only - not a real customer request.",
        internalNotes: "DEMO Phase 3 fulfilment workflow record.",
        status: QuotationStatus.ACCEPTED,
        currentRevisionNumber: 1,
        expiresAt: validUntil,
        acceptedAt: new Date("2026-08-03T07:00:00.000Z"),
        items: {
          create: {
            productId: variant.productId,
            variantId: context.variantId,
            description: "DEMO porcelain floor tile delivery",
            quantity: 2,
            unitCode: "BOX",
          },
        },
        history: {
          create: {
            toStatus: QuotationStatus.ACCEPTED,
            reason: "Created by the idempotent Phase 3 demonstration seed.",
          },
        },
      },
      include: { items: true },
    })
    const quotationItem = quotation.items[0]
    if (!quotationItem)
      throw new Error("The DEMO fulfilment quotation line was not created.")
    const revision = await tx.quotationRevision.create({
      data: {
        quotationId: quotation.id,
        number: 1,
        validUntil,
        subtotal: 2598,
        gstTotal: 467.64,
        freightTotal: 500,
        discountTotal: 0,
        marginTotal: 400,
        grandTotal: 3565.64,
        customerNotes: "DEMO quotation for fulfilment testing only.",
        internalNotes: "DEMO stock allocation.",
        sentAt: new Date("2026-08-03T06:30:00.000Z"),
        items: {
          create: {
            quotationItemId: quotationItem.id,
            variantId: context.variantId,
            fulfilmentLocationId: context.fulfilmentLocationId,
            description: quotationItem.description,
            quantity: 2,
            unitCode: "BOX",
            unitPrice: 1299,
            gstPercent: 18,
            discountAmount: 0,
            lineSubtotal: 2598,
            gstAmount: 467.64,
            lineTotal: 3065.64,
            estimatedLeadDays: 2,
          },
        },
        approvals: {
          create: {
            quotationId: quotation.id,
            status: QuotationApprovalStatus.APPROVED,
            reason: "DEMO fulfilment quotation approved.",
            decidedAt: new Date("2026-08-03T06:45:00.000Z"),
          },
        },
      },
    })
    const order = await tx.salesOrder.create({
      data: {
        reference: "DEMO-SO-FULFILMENT-001",
        quotationId: quotation.id,
        revisionId: revision.id,
        status: SalesOrderStatus.CONFIRMED,
        paymentTerms: "DEMO: payment terms to be confirmed.",
        paymentStatus: PaymentStatus.PENDING,
        customerName: quotation.customerName,
        customerEmail: quotation.customerEmail,
        customerPhone: quotation.customerPhone,
        deliveryPincode: quotation.deliveryPincode,
        subtotal: 2598,
        gstTotal: 467.64,
        freightTotal: 500,
        discountTotal: 0,
        grandTotal: 3565.64,
        reservedUntil: validUntil,
        items: {
          create: {
            quotationItemId: quotationItem.id,
            variantId: context.variantId,
            fulfilmentLocationId: context.fulfilmentLocationId,
            description: quotationItem.description,
            quantity: 2,
            unitCode: "BOX",
            unitPrice: 1299,
            gstPercent: 18,
            discountAmount: 0,
            lineSubtotal: 2598,
            gstAmount: 467.64,
            lineTotal: 3065.64,
          },
        },
      },
      include: { items: true },
    })
    const orderItem = order.items[0]
    if (!orderItem)
      throw new Error("The DEMO fulfilment order line was not created.")
    const balance = await tx.inventoryBalance.findUniqueOrThrow({
      where: {
        variantId_fulfilmentLocationId: {
          variantId: context.variantId,
          fulfilmentLocationId: context.fulfilmentLocationId,
        },
      },
    })
    const before = snapshot(balance)
    const updated = await tx.inventoryBalance.update({
      where: { id: balance.id },
      data: { reservedQuantity: { increment: 2 } },
    })
    await tx.inventoryReservation.create({
      data: {
        reference: "DEMO-RES-FULFILMENT-001",
        variantId: context.variantId,
        fulfilmentLocationId: context.fulfilmentLocationId,
        quantity: 2,
        status: InventoryReservationStatus.ACTIVE,
        expiresAt: validUntil,
        notes: "DEMO reservation for the fulfilment journey.",
        salesOrderItemId: orderItem.id,
      },
    })
    await tx.inventoryLedgerEntry.create({
      data: {
        balanceId: balance.id,
        type: InventoryLedgerType.RESERVATION,
        reservedDelta: 2,
        before,
        after: snapshot(updated),
        reason: "DEMO fulfilment order reservation.",
        reference: order.reference,
      },
    })
  })
}
