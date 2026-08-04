-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWING', 'QUOTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CLOSED');

-- CreateEnum
CREATE TYPE "QuotationApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SalesOrderStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'EXPIRED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'REFUNDED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'CATALOG_MANAGER';
ALTER TYPE "UserRole" ADD VALUE 'SALES';
ALTER TYPE "UserRole" ADD VALUE 'WAREHOUSE_MANAGER';
ALTER TYPE "UserRole" ADD VALUE 'PROCUREMENT';
ALTER TYPE "UserRole" ADD VALUE 'FINANCE';
ALTER TYPE "UserRole" ADD VALUE 'SUPPORT';

-- AlterTable
ALTER TABLE "InventoryReservation" ADD COLUMN     "salesOrderItemId" TEXT;

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "sourceQuoteRequestId" TEXT,
    "customerUserId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "company" TEXT,
    "deliveryPincode" TEXT NOT NULL,
    "requiredBy" TIMESTAMP(3),
    "projectType" TEXT,
    "customerNotes" TEXT,
    "internalNotes" TEXT,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "currentRevisionNumber" INTEGER NOT NULL DEFAULT 0,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unitCode" TEXT NOT NULL,
    "customerNotes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationRevision" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "gstTotal" DECIMAL(14,2) NOT NULL,
    "freightTotal" DECIMAL(14,2) NOT NULL,
    "discountTotal" DECIMAL(14,2) NOT NULL,
    "marginTotal" DECIMAL(14,2),
    "grandTotal" DECIMAL(14,2) NOT NULL,
    "customerNotes" TEXT,
    "internalNotes" TEXT,
    "createdById" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotationRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationRevisionItem" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "quotationItemId" TEXT NOT NULL,
    "variantId" TEXT,
    "fulfilmentLocationId" TEXT,
    "supplierProductId" TEXT,
    "dealerProductId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL,
    "unitCode" TEXT NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "gstPercent" DECIMAL(5,2) NOT NULL,
    "discountAmount" DECIMAL(14,2) NOT NULL,
    "lineSubtotal" DECIMAL(14,2) NOT NULL,
    "gstAmount" DECIMAL(14,2) NOT NULL,
    "lineTotal" DECIMAL(14,2) NOT NULL,
    "estimatedLeadDays" INTEGER,
    "isAlternative" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotationRevisionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationStatusHistory" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "fromStatus" "QuotationStatus",
    "toStatus" "QuotationStatus" NOT NULL,
    "reason" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationApproval" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "status" "QuotationApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "requestedById" TEXT,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotationApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrder" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "status" "SalesOrderStatus" NOT NULL DEFAULT 'CONFIRMED',
    "paymentTerms" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "deliveryPincode" TEXT NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "gstTotal" DECIMAL(14,2) NOT NULL,
    "freightTotal" DECIMAL(14,2) NOT NULL,
    "discountTotal" DECIMAL(14,2) NOT NULL,
    "grandTotal" DECIMAL(14,2) NOT NULL,
    "reservedUntil" TIMESTAMP(3),
    "createdById" TEXT,
    "cancelledById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderItem" (
    "id" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "quotationItemId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "fulfilmentLocationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCode" TEXT NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "gstPercent" DECIMAL(5,2) NOT NULL,
    "discountAmount" DECIMAL(14,2) NOT NULL,
    "lineSubtotal" DECIMAL(14,2) NOT NULL,
    "gstAmount" DECIMAL(14,2) NOT NULL,
    "lineTotal" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_reference_key" ON "Quotation"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_sourceQuoteRequestId_key" ON "Quotation"("sourceQuoteRequestId");

-- CreateIndex
CREATE INDEX "Quotation_status_createdAt_idx" ON "Quotation"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Quotation_customerEmail_createdAt_idx" ON "Quotation"("customerEmail", "createdAt");

-- CreateIndex
CREATE INDEX "Quotation_deliveryPincode_status_idx" ON "Quotation"("deliveryPincode", "status");

-- CreateIndex
CREATE INDEX "Quotation_createdById_createdAt_idx" ON "Quotation"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "QuotationItem_quotationId_sortOrder_idx" ON "QuotationItem"("quotationId", "sortOrder");

-- CreateIndex
CREATE INDEX "QuotationItem_productId_idx" ON "QuotationItem"("productId");

-- CreateIndex
CREATE INDEX "QuotationItem_variantId_idx" ON "QuotationItem"("variantId");

-- CreateIndex
CREATE INDEX "QuotationRevision_validUntil_idx" ON "QuotationRevision"("validUntil");

-- CreateIndex
CREATE INDEX "QuotationRevision_createdById_createdAt_idx" ON "QuotationRevision"("createdById", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuotationRevision_quotationId_number_key" ON "QuotationRevision"("quotationId", "number");

-- CreateIndex
CREATE INDEX "QuotationRevisionItem_variantId_idx" ON "QuotationRevisionItem"("variantId");

-- CreateIndex
CREATE INDEX "QuotationRevisionItem_fulfilmentLocationId_idx" ON "QuotationRevisionItem"("fulfilmentLocationId");

-- CreateIndex
CREATE INDEX "QuotationRevisionItem_supplierProductId_idx" ON "QuotationRevisionItem"("supplierProductId");

-- CreateIndex
CREATE INDEX "QuotationRevisionItem_dealerProductId_idx" ON "QuotationRevisionItem"("dealerProductId");

-- CreateIndex
CREATE UNIQUE INDEX "QuotationRevisionItem_revisionId_quotationItemId_key" ON "QuotationRevisionItem"("revisionId", "quotationItemId");

-- CreateIndex
CREATE INDEX "QuotationStatusHistory_quotationId_createdAt_idx" ON "QuotationStatusHistory"("quotationId", "createdAt");

-- CreateIndex
CREATE INDEX "QuotationStatusHistory_actorId_createdAt_idx" ON "QuotationStatusHistory"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "QuotationApproval_quotationId_status_idx" ON "QuotationApproval"("quotationId", "status");

-- CreateIndex
CREATE INDEX "QuotationApproval_revisionId_status_idx" ON "QuotationApproval"("revisionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_reference_key" ON "SalesOrder"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_quotationId_key" ON "SalesOrder"("quotationId");

-- CreateIndex
CREATE INDEX "SalesOrder_status_createdAt_idx" ON "SalesOrder"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SalesOrder_customerEmail_createdAt_idx" ON "SalesOrder"("customerEmail", "createdAt");

-- CreateIndex
CREATE INDEX "SalesOrder_reservedUntil_status_idx" ON "SalesOrder"("reservedUntil", "status");

-- CreateIndex
CREATE INDEX "SalesOrderItem_variantId_idx" ON "SalesOrderItem"("variantId");

-- CreateIndex
CREATE INDEX "SalesOrderItem_fulfilmentLocationId_idx" ON "SalesOrderItem"("fulfilmentLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrderItem_salesOrderId_quotationItemId_key" ON "SalesOrderItem"("salesOrderId", "quotationItemId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryReservation_salesOrderItemId_key" ON "InventoryReservation"("salesOrderItemId");

-- AddForeignKey
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_sourceQuoteRequestId_fkey" FOREIGN KEY ("sourceQuoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRevision" ADD CONSTRAINT "QuotationRevision_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRevision" ADD CONSTRAINT "QuotationRevision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRevisionItem" ADD CONSTRAINT "QuotationRevisionItem_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "QuotationRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRevisionItem" ADD CONSTRAINT "QuotationRevisionItem_quotationItemId_fkey" FOREIGN KEY ("quotationItemId") REFERENCES "QuotationItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRevisionItem" ADD CONSTRAINT "QuotationRevisionItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRevisionItem" ADD CONSTRAINT "QuotationRevisionItem_fulfilmentLocationId_fkey" FOREIGN KEY ("fulfilmentLocationId") REFERENCES "FulfilmentLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRevisionItem" ADD CONSTRAINT "QuotationRevisionItem_supplierProductId_fkey" FOREIGN KEY ("supplierProductId") REFERENCES "SupplierProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRevisionItem" ADD CONSTRAINT "QuotationRevisionItem_dealerProductId_fkey" FOREIGN KEY ("dealerProductId") REFERENCES "DealerProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationStatusHistory" ADD CONSTRAINT "QuotationStatusHistory_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationStatusHistory" ADD CONSTRAINT "QuotationStatusHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationApproval" ADD CONSTRAINT "QuotationApproval_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationApproval" ADD CONSTRAINT "QuotationApproval_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "QuotationRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationApproval" ADD CONSTRAINT "QuotationApproval_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationApproval" ADD CONSTRAINT "QuotationApproval_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "QuotationRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_quotationItemId_fkey" FOREIGN KEY ("quotationItemId") REFERENCES "QuotationItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_fulfilmentLocationId_fkey" FOREIGN KEY ("fulfilmentLocationId") REFERENCES "FulfilmentLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enforce commercial workflow invariants at the database boundary.
ALTER TABLE "QuotationItem"
  ADD CONSTRAINT "QuotationItem_quantity_positive" CHECK ("quantity" > 0);

ALTER TABLE "QuotationRevision"
  ADD CONSTRAINT "QuotationRevision_totals_nonnegative" CHECK (
    "subtotal" >= 0 AND "gstTotal" >= 0 AND "freightTotal" >= 0
    AND "discountTotal" >= 0 AND "grandTotal" >= 0
    AND ("marginTotal" IS NULL OR "marginTotal" >= 0)
  );

ALTER TABLE "QuotationRevisionItem"
  ADD CONSTRAINT "QuotationRevisionItem_values_valid" CHECK (
    "quantity" > 0 AND "unitPrice" >= 0 AND "gstPercent" >= 0
    AND "discountAmount" >= 0 AND "lineSubtotal" >= 0
    AND "gstAmount" >= 0 AND "lineTotal" >= 0
  );

ALTER TABLE "SalesOrder"
  ADD CONSTRAINT "SalesOrder_totals_nonnegative" CHECK (
    "subtotal" >= 0 AND "gstTotal" >= 0 AND "freightTotal" >= 0
    AND "discountTotal" >= 0 AND "grandTotal" >= 0
  );

ALTER TABLE "SalesOrderItem"
  ADD CONSTRAINT "SalesOrderItem_values_valid" CHECK (
    "quantity" > 0 AND "unitPrice" >= 0 AND "gstPercent" >= 0
    AND "discountAmount" >= 0 AND "lineSubtotal" >= 0
    AND "gstAmount" >= 0 AND "lineTotal" >= 0
  );

-- Preserve every legacy enquiry while making Quotation the canonical workflow.
INSERT INTO "Quotation" (
  "id", "reference", "sourceQuoteRequestId", "customerName", "customerEmail",
  "customerPhone", "company", "deliveryPincode", "requiredBy", "projectType",
  "customerNotes", "internalNotes", "status", "currentRevisionNumber",
  "acceptedAt", "createdAt", "updatedAt"
)
SELECT
  'legacy-quotation-' || q."id",
  q."reference",
  q."id",
  q."name",
  lower(q."email"),
  q."phone",
  NULLIF(q."company", ''),
  q."deliveryPincode",
  CASE WHEN q."requiredBy" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN q."requiredBy"::timestamp ELSE NULL END,
  q."projectType",
  q."notes",
  'Imported from legacy QuoteRequest. Historical records retain their original status and may predate the sales-order workflow.',
  CASE q."status"
    WHEN 'NEW' THEN 'SUBMITTED'::"QuotationStatus"
    WHEN 'REVIEWING' THEN 'REVIEWING'::"QuotationStatus"
    WHEN 'QUOTED' THEN 'QUOTED'::"QuotationStatus"
    WHEN 'ACCEPTED' THEN 'ACCEPTED'::"QuotationStatus"
    WHEN 'CLOSED' THEN 'CLOSED'::"QuotationStatus"
  END,
  0,
  CASE WHEN q."status" = 'ACCEPTED' THEN q."updatedAt" ELSE NULL END,
  q."createdAt",
  q."updatedAt"
FROM "QuoteRequest" q
ON CONFLICT ("sourceQuoteRequestId") DO NOTHING;

INSERT INTO "QuotationItem" (
  "id", "quotationId", "description", "quantity", "unitCode", "sortOrder",
  "createdAt", "updatedAt"
)
SELECT
  'legacy-quotation-item-' || q."id",
  'legacy-quotation-' || q."id",
  q."requirement",
  q."quantity"::decimal(14,3),
  'unit',
  0,
  q."createdAt",
  q."updatedAt"
FROM "QuoteRequest" q
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "QuotationStatusHistory" (
  "id", "quotationId", "fromStatus", "toStatus", "reason", "createdAt"
)
SELECT
  'legacy-quotation-history-' || q."id",
  'legacy-quotation-' || q."id",
  NULL,
  CASE q."status"
    WHEN 'NEW' THEN 'SUBMITTED'::"QuotationStatus"
    WHEN 'REVIEWING' THEN 'REVIEWING'::"QuotationStatus"
    WHEN 'QUOTED' THEN 'QUOTED'::"QuotationStatus"
    WHEN 'ACCEPTED' THEN 'ACCEPTED'::"QuotationStatus"
    WHEN 'CLOSED' THEN 'CLOSED'::"QuotationStatus"
  END,
  'Imported from legacy QuoteRequest',
  q."createdAt"
FROM "QuoteRequest" q
ON CONFLICT ("id") DO NOTHING;

-- These operational tables are private to trusted API/server connections.
DO $$
DECLARE
  table_name text;
  private_tables text[] := ARRAY[
    'Quotation', 'QuotationItem', 'QuotationRevision', 'QuotationRevisionItem',
    'QuotationStatusHistory', 'QuotationApproval', 'SalesOrder', 'SalesOrderItem'
  ];
BEGIN
  FOREACH table_name IN ARRAY private_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon', table_name);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM authenticated', table_name);
  END LOOP;
END $$;
