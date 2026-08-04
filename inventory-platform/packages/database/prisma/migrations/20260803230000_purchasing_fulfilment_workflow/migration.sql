-- CreateEnum
CREATE TYPE "PurchaseRequisitionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupplierRFQStatus" AS ENUM ('DRAFT', 'SENT', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SupplierResponseStatus" AS ENUM ('SUBMITTED', 'SELECTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PurchaseApprovalDecision" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'SENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GoodsReceiptStatus" AS ENUM ('DRAFT', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SupplierReturnStatus" AS ENUM ('DRAFT', 'APPROVED', 'DISPATCHED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PickingListStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'PICKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryScheduleStatus" AS ENUM ('PLANNED', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('DRAFT', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReturnRequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'INSPECTED', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReturnInspectionDecision" AS ENUM ('RESTOCK', 'DAMAGE', 'REJECT');

-- CreateEnum
CREATE TYPE "ReplacementStatus" AS ENUM ('APPROVED', 'PREPARING', 'DISPATCHED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CreditNoteStatus" AS ENUM ('DRAFT', 'ISSUED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PurchaseRequisition" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "PurchaseRequisitionStatus" NOT NULL DEFAULT 'DRAFT',
    "requiredBy" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "internalNotes" TEXT,
    "createdById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "decisionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequisitionItem" (
    "id" TEXT NOT NULL,
    "purchaseRequisitionId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "targetLocationId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCode" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequisitionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierRFQ" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "purchaseRequisitionId" TEXT,
    "status" "SupplierRFQStatus" NOT NULL DEFAULT 'DRAFT',
    "responseDueAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierRFQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierRFQItem" (
    "id" TEXT NOT NULL,
    "supplierRfqId" TEXT NOT NULL,
    "purchaseRequisitionItemId" TEXT,
    "variantId" TEXT NOT NULL,
    "targetLocationId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierRFQItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierRFQResponse" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "supplierRfqId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" "SupplierResponseStatus" NOT NULL DEFAULT 'SUBMITTED',
    "validUntil" TIMESTAMP(3) NOT NULL,
    "freightTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierRFQResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierRFQResponseItem" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "supplierRfqItemId" TEXT NOT NULL,
    "offeredQuantity" INTEGER NOT NULL,
    "unitCost" DECIMAL(14,2) NOT NULL,
    "gstPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "leadTimeDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierRFQResponseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierResponseId" TEXT,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "expectedAt" TIMESTAMP(3),
    "subtotal" DECIMAL(14,2) NOT NULL,
    "gstTotal" DECIMAL(14,2) NOT NULL,
    "freightTotal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(14,2) NOT NULL,
    "paymentTerms" TEXT,
    "internalNotes" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "targetLocationId" TEXT NOT NULL,
    "orderedQuantity" INTEGER NOT NULL,
    "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
    "unitCode" TEXT NOT NULL,
    "unitCost" DECIMAL(14,2) NOT NULL,
    "gstPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderApprovalHistory" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "decision" "PurchaseApprovalDecision" NOT NULL,
    "reason" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrderApprovalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "fulfilmentLocationId" TEXT NOT NULL,
    "status" "GoodsReceiptStatus" NOT NULL DEFAULT 'DRAFT',
    "supplierDocument" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "postedAt" TIMESTAMP(3),
    "postedById" TEXT,
    "qualityNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptItem" (
    "id" TEXT NOT NULL,
    "goodsReceiptId" TEXT NOT NULL,
    "purchaseOrderItemId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "receivedQuantity" INTEGER NOT NULL,
    "acceptedQuantity" INTEGER NOT NULL,
    "rejectedQuantity" INTEGER NOT NULL DEFAULT 0,
    "damagedQuantity" INTEGER NOT NULL DEFAULT 0,
    "shortageQuantity" INTEGER NOT NULL DEFAULT 0,
    "excessQuantity" INTEGER NOT NULL DEFAULT 0,
    "batchNumber" TEXT,
    "lotNumber" TEXT,
    "manufacturedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "inspectionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoodsReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierReturn" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "goodsReceiptId" TEXT,
    "fulfilmentLocationId" TEXT NOT NULL,
    "status" "SupplierReturnStatus" NOT NULL DEFAULT 'DRAFT',
    "reason" TEXT NOT NULL,
    "approvedById" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierReturnItem" (
    "id" TEXT NOT NULL,
    "supplierReturnId" TEXT NOT NULL,
    "purchaseOrderItemId" TEXT,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "fromDamaged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickingList" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "fulfilmentLocationId" TEXT NOT NULL,
    "status" "PickingListStatus" NOT NULL DEFAULT 'DRAFT',
    "assignedToId" TEXT,
    "pickedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickingListItem" (
    "id" TEXT NOT NULL,
    "pickingListId" TEXT NOT NULL,
    "salesOrderItemId" TEXT NOT NULL,
    "requestedQuantity" INTEGER NOT NULL,
    "pickedQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PickingListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliverySchedule" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "carrierId" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" "DeliveryScheduleStatus" NOT NULL DEFAULT 'PLANNED',
    "deliveryAddress" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliverySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispatch" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "pickingListId" TEXT,
    "deliveryScheduleId" TEXT,
    "carrierId" TEXT,
    "status" "DispatchStatus" NOT NULL DEFAULT 'DRAFT',
    "vehicleNumber" TEXT,
    "trackingReference" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchItem" (
    "id" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "salesOrderItemId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "fulfilmentLocationId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryChallan" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryChallan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryStatusHistory" (
    "id" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "fromStatus" "DispatchStatus",
    "toStatus" "DispatchStatus" NOT NULL,
    "notes" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofOfDelivery" (
    "id" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "receivedBy" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "photoUrl" TEXT,
    "signatureUrl" TEXT,
    "notes" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProofOfDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnRequest" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "dispatchId" TEXT,
    "status" "ReturnRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT NOT NULL,
    "customerNotes" TEXT,
    "internalNotes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "inspectedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnItem" (
    "id" TEXT NOT NULL,
    "returnRequestId" TEXT NOT NULL,
    "salesOrderItemId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "fulfilmentLocationId" TEXT NOT NULL,
    "requestedQuantity" INTEGER NOT NULL,
    "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnInspection" (
    "id" TEXT NOT NULL,
    "returnItemId" TEXT NOT NULL,
    "decision" "ReturnInspectionDecision" NOT NULL,
    "restockQuantity" INTEGER NOT NULL DEFAULT 0,
    "damagedQuantity" INTEGER NOT NULL DEFAULT 0,
    "rejectedQuantity" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "inspectedById" TEXT,
    "inspectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Replacement" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "returnRequestId" TEXT NOT NULL,
    "status" "ReplacementStatus" NOT NULL DEFAULT 'APPROVED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Replacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReplacementItem" (
    "id" TEXT NOT NULL,
    "replacementId" TEXT NOT NULL,
    "returnItemId" TEXT NOT NULL,
    "salesOrderItemId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "fulfilmentLocationId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReplacementItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditNote" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "returnRequestId" TEXT NOT NULL,
    "status" "CreditNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "amount" DECIMAL(14,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "issuedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequisition_reference_key" ON "PurchaseRequisition"("reference");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_status_createdAt_idx" ON "PurchaseRequisition"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PurchaseRequisition_requiredBy_status_idx" ON "PurchaseRequisition"("requiredBy", "status");

-- CreateIndex
CREATE INDEX "PurchaseRequisitionItem_purchaseRequisitionId_idx" ON "PurchaseRequisitionItem"("purchaseRequisitionId");

-- CreateIndex
CREATE INDEX "PurchaseRequisitionItem_variantId_targetLocationId_idx" ON "PurchaseRequisitionItem"("variantId", "targetLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierRFQ_reference_key" ON "SupplierRFQ"("reference");

-- CreateIndex
CREATE INDEX "SupplierRFQ_status_createdAt_idx" ON "SupplierRFQ"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SupplierRFQ_purchaseRequisitionId_idx" ON "SupplierRFQ"("purchaseRequisitionId");

-- CreateIndex
CREATE INDEX "SupplierRFQItem_supplierRfqId_idx" ON "SupplierRFQItem"("supplierRfqId");

-- CreateIndex
CREATE INDEX "SupplierRFQItem_variantId_targetLocationId_idx" ON "SupplierRFQItem"("variantId", "targetLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierRFQResponse_reference_key" ON "SupplierRFQResponse"("reference");

-- CreateIndex
CREATE INDEX "SupplierRFQResponse_status_validUntil_idx" ON "SupplierRFQResponse"("status", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierRFQResponse_supplierRfqId_supplierId_key" ON "SupplierRFQResponse"("supplierRfqId", "supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierRFQResponseItem_responseId_supplierRfqItemId_key" ON "SupplierRFQResponseItem"("responseId", "supplierRfqItemId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_reference_key" ON "PurchaseOrder"("reference");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_createdAt_idx" ON "PurchaseOrder"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplierId_status_idx" ON "PurchaseOrder"("supplierId", "status");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_variantId_targetLocationId_idx" ON "PurchaseOrderItem"("variantId", "targetLocationId");

-- CreateIndex
CREATE INDEX "PurchaseOrderApprovalHistory_purchaseOrderId_createdAt_idx" ON "PurchaseOrderApprovalHistory"("purchaseOrderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceipt_reference_key" ON "GoodsReceipt"("reference");

-- CreateIndex
CREATE INDEX "GoodsReceipt_purchaseOrderId_status_idx" ON "GoodsReceipt"("purchaseOrderId", "status");

-- CreateIndex
CREATE INDEX "GoodsReceipt_fulfilmentLocationId_receivedAt_idx" ON "GoodsReceipt"("fulfilmentLocationId", "receivedAt");

-- CreateIndex
CREATE INDEX "GoodsReceiptItem_variantId_batchNumber_idx" ON "GoodsReceiptItem"("variantId", "batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceiptItem_goodsReceiptId_purchaseOrderItemId_key" ON "GoodsReceiptItem"("goodsReceiptId", "purchaseOrderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierReturn_reference_key" ON "SupplierReturn"("reference");

-- CreateIndex
CREATE INDEX "SupplierReturn_status_createdAt_idx" ON "SupplierReturn"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SupplierReturn_supplierId_idx" ON "SupplierReturn"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierReturnItem_supplierReturnId_idx" ON "SupplierReturnItem"("supplierReturnId");

-- CreateIndex
CREATE UNIQUE INDEX "PickingList_reference_key" ON "PickingList"("reference");

-- CreateIndex
CREATE INDEX "PickingList_salesOrderId_status_idx" ON "PickingList"("salesOrderId", "status");

-- CreateIndex
CREATE INDEX "PickingList_fulfilmentLocationId_status_idx" ON "PickingList"("fulfilmentLocationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PickingListItem_pickingListId_salesOrderItemId_key" ON "PickingListItem"("pickingListId", "salesOrderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliverySchedule_reference_key" ON "DeliverySchedule"("reference");

-- CreateIndex
CREATE INDEX "DeliverySchedule_salesOrderId_scheduledFor_idx" ON "DeliverySchedule"("salesOrderId", "scheduledFor");

-- CreateIndex
CREATE INDEX "DeliverySchedule_status_scheduledFor_idx" ON "DeliverySchedule"("status", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "Dispatch_reference_key" ON "Dispatch"("reference");

-- CreateIndex
CREATE INDEX "Dispatch_salesOrderId_status_idx" ON "Dispatch"("salesOrderId", "status");

-- CreateIndex
CREATE INDEX "Dispatch_status_createdAt_idx" ON "Dispatch"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DispatchItem_salesOrderItemId_idx" ON "DispatchItem"("salesOrderItemId");

-- CreateIndex
CREATE INDEX "DispatchItem_reservationId_idx" ON "DispatchItem"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchItem_dispatchId_salesOrderItemId_key" ON "DispatchItem"("dispatchId", "salesOrderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryChallan_number_key" ON "DeliveryChallan"("number");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryChallan_dispatchId_key" ON "DeliveryChallan"("dispatchId");

-- CreateIndex
CREATE INDEX "DeliveryStatusHistory_dispatchId_createdAt_idx" ON "DeliveryStatusHistory"("dispatchId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProofOfDelivery_dispatchId_key" ON "ProofOfDelivery"("dispatchId");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnRequest_reference_key" ON "ReturnRequest"("reference");

-- CreateIndex
CREATE INDEX "ReturnRequest_status_createdAt_idx" ON "ReturnRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ReturnRequest_salesOrderId_idx" ON "ReturnRequest"("salesOrderId");

-- CreateIndex
CREATE INDEX "ReturnItem_variantId_fulfilmentLocationId_idx" ON "ReturnItem"("variantId", "fulfilmentLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnItem_returnRequestId_salesOrderItemId_key" ON "ReturnItem"("returnRequestId", "salesOrderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnInspection_returnItemId_key" ON "ReturnInspection"("returnItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Replacement_reference_key" ON "Replacement"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Replacement_returnRequestId_key" ON "Replacement"("returnRequestId");

-- CreateIndex
CREATE INDEX "Replacement_status_createdAt_idx" ON "Replacement"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ReplacementItem_replacementId_idx" ON "ReplacementItem"("replacementId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditNote_reference_key" ON "CreditNote"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "CreditNote_returnRequestId_key" ON "CreditNote"("returnRequestId");

-- CreateIndex
CREATE INDEX "CreditNote_status_createdAt_idx" ON "CreditNote"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "PurchaseRequisitionItem" ADD CONSTRAINT "PurchaseRequisitionItem_purchaseRequisitionId_fkey" FOREIGN KEY ("purchaseRequisitionId") REFERENCES "PurchaseRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisitionItem" ADD CONSTRAINT "PurchaseRequisitionItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequisitionItem" ADD CONSTRAINT "PurchaseRequisitionItem_targetLocationId_fkey" FOREIGN KEY ("targetLocationId") REFERENCES "FulfilmentLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierRFQ" ADD CONSTRAINT "SupplierRFQ_purchaseRequisitionId_fkey" FOREIGN KEY ("purchaseRequisitionId") REFERENCES "PurchaseRequisition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierRFQItem" ADD CONSTRAINT "SupplierRFQItem_supplierRfqId_fkey" FOREIGN KEY ("supplierRfqId") REFERENCES "SupplierRFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierRFQItem" ADD CONSTRAINT "SupplierRFQItem_purchaseRequisitionItemId_fkey" FOREIGN KEY ("purchaseRequisitionItemId") REFERENCES "PurchaseRequisitionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierRFQItem" ADD CONSTRAINT "SupplierRFQItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierRFQItem" ADD CONSTRAINT "SupplierRFQItem_targetLocationId_fkey" FOREIGN KEY ("targetLocationId") REFERENCES "FulfilmentLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierRFQResponse" ADD CONSTRAINT "SupplierRFQResponse_supplierRfqId_fkey" FOREIGN KEY ("supplierRfqId") REFERENCES "SupplierRFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierRFQResponse" ADD CONSTRAINT "SupplierRFQResponse_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierRFQResponseItem" ADD CONSTRAINT "SupplierRFQResponseItem_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "SupplierRFQResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierRFQResponseItem" ADD CONSTRAINT "SupplierRFQResponseItem_supplierRfqItemId_fkey" FOREIGN KEY ("supplierRfqItemId") REFERENCES "SupplierRFQItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierResponseId_fkey" FOREIGN KEY ("supplierResponseId") REFERENCES "SupplierRFQResponse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_targetLocationId_fkey" FOREIGN KEY ("targetLocationId") REFERENCES "FulfilmentLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderApprovalHistory" ADD CONSTRAINT "PurchaseOrderApprovalHistory_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_fulfilmentLocationId_fkey" FOREIGN KEY ("fulfilmentLocationId") REFERENCES "FulfilmentLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReturn" ADD CONSTRAINT "SupplierReturn_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReturn" ADD CONSTRAINT "SupplierReturn_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReturn" ADD CONSTRAINT "SupplierReturn_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReturn" ADD CONSTRAINT "SupplierReturn_fulfilmentLocationId_fkey" FOREIGN KEY ("fulfilmentLocationId") REFERENCES "FulfilmentLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReturnItem" ADD CONSTRAINT "SupplierReturnItem_supplierReturnId_fkey" FOREIGN KEY ("supplierReturnId") REFERENCES "SupplierReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReturnItem" ADD CONSTRAINT "SupplierReturnItem_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReturnItem" ADD CONSTRAINT "SupplierReturnItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingList" ADD CONSTRAINT "PickingList_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingList" ADD CONSTRAINT "PickingList_fulfilmentLocationId_fkey" FOREIGN KEY ("fulfilmentLocationId") REFERENCES "FulfilmentLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingListItem" ADD CONSTRAINT "PickingListItem_pickingListId_fkey" FOREIGN KEY ("pickingListId") REFERENCES "PickingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickingListItem" ADD CONSTRAINT "PickingListItem_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverySchedule" ADD CONSTRAINT "DeliverySchedule_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverySchedule" ADD CONSTRAINT "DeliverySchedule_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_pickingListId_fkey" FOREIGN KEY ("pickingListId") REFERENCES "PickingList"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_deliveryScheduleId_fkey" FOREIGN KEY ("deliveryScheduleId") REFERENCES "DeliverySchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchItem" ADD CONSTRAINT "DispatchItem_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchItem" ADD CONSTRAINT "DispatchItem_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchItem" ADD CONSTRAINT "DispatchItem_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "InventoryReservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchItem" ADD CONSTRAINT "DispatchItem_fulfilmentLocationId_fkey" FOREIGN KEY ("fulfilmentLocationId") REFERENCES "FulfilmentLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryChallan" ADD CONSTRAINT "DeliveryChallan_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryStatusHistory" ADD CONSTRAINT "DeliveryStatusHistory_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofOfDelivery" ADD CONSTRAINT "ProofOfDelivery_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES "Dispatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_fulfilmentLocationId_fkey" FOREIGN KEY ("fulfilmentLocationId") REFERENCES "FulfilmentLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnInspection" ADD CONSTRAINT "ReturnInspection_returnItemId_fkey" FOREIGN KEY ("returnItemId") REFERENCES "ReturnItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Replacement" ADD CONSTRAINT "Replacement_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplacementItem" ADD CONSTRAINT "ReplacementItem_replacementId_fkey" FOREIGN KEY ("replacementId") REFERENCES "Replacement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplacementItem" ADD CONSTRAINT "ReplacementItem_returnItemId_fkey" FOREIGN KEY ("returnItemId") REFERENCES "ReturnItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplacementItem" ADD CONSTRAINT "ReplacementItem_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplacementItem" ADD CONSTRAINT "ReplacementItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplacementItem" ADD CONSTRAINT "ReplacementItem_fulfilmentLocationId_fkey" FOREIGN KEY ("fulfilmentLocationId") REFERENCES "FulfilmentLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "ReturnRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Phase 3 quantity and accounting invariants.
ALTER TABLE "PurchaseRequisitionItem" ADD CONSTRAINT "PurchaseRequisitionItem_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "SupplierRFQItem" ADD CONSTRAINT "SupplierRFQItem_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "SupplierRFQResponseItem" ADD CONSTRAINT "SupplierRFQResponseItem_values_valid" CHECK ("offeredQuantity" > 0 AND "unitCost" >= 0 AND "gstPercent" >= 0 AND "gstPercent" <= 100 AND "leadTimeDays" >= 0);
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_totals_nonnegative" CHECK ("subtotal" >= 0 AND "gstTotal" >= 0 AND "freightTotal" >= 0 AND "grandTotal" >= 0);
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_values_valid" CHECK ("orderedQuantity" > 0 AND "receivedQuantity" >= 0 AND "unitCost" >= 0 AND "gstPercent" >= 0 AND "gstPercent" <= 100 AND "lineTotal" >= 0);
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_quantities_valid" CHECK (
  "receivedQuantity" > 0 AND
  "acceptedQuantity" >= 0 AND
  "rejectedQuantity" >= 0 AND
  "damagedQuantity" >= 0 AND
  "shortageQuantity" >= 0 AND
  "excessQuantity" >= 0 AND
  "acceptedQuantity" + "rejectedQuantity" + "damagedQuantity" = "receivedQuantity"
);
ALTER TABLE "SupplierReturnItem" ADD CONSTRAINT "SupplierReturnItem_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "PickingListItem" ADD CONSTRAINT "PickingListItem_quantities_valid" CHECK ("requestedQuantity" > 0 AND "pickedQuantity" >= 0 AND "pickedQuantity" <= "requestedQuantity");
ALTER TABLE "DispatchItem" ADD CONSTRAINT "DispatchItem_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_quantities_valid" CHECK ("requestedQuantity" > 0 AND "receivedQuantity" >= 0 AND "receivedQuantity" <= "requestedQuantity");
ALTER TABLE "ReturnInspection" ADD CONSTRAINT "ReturnInspection_quantities_valid" CHECK ("restockQuantity" >= 0 AND "damagedQuantity" >= 0 AND "rejectedQuantity" >= 0);
ALTER TABLE "ReplacementItem" ADD CONSTRAINT "ReplacementItem_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_amount_nonnegative" CHECK ("amount" >= 0);

-- These operational tables are server-only. The Inventory API is the policy
-- boundary; Supabase browser roles receive no direct table privileges.
DO $$
DECLARE
  protected_table text;
BEGIN
  FOREACH protected_table IN ARRAY ARRAY[
    'PurchaseRequisition', 'PurchaseRequisitionItem', 'SupplierRFQ', 'SupplierRFQItem',
    'SupplierRFQResponse', 'SupplierRFQResponseItem', 'PurchaseOrder', 'PurchaseOrderItem',
    'PurchaseOrderApprovalHistory', 'GoodsReceipt', 'GoodsReceiptItem', 'SupplierReturn',
    'SupplierReturnItem', 'PickingList', 'PickingListItem', 'DeliverySchedule', 'Dispatch',
    'DispatchItem', 'DeliveryChallan', 'DeliveryStatusHistory', 'ProofOfDelivery',
    'ReturnRequest', 'ReturnItem', 'ReturnInspection', 'Replacement', 'ReplacementItem', 'CreditNote'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', protected_table);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', protected_table);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', protected_table);
  END LOOP;
END $$;
