CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED');
CREATE TYPE "VariantStatus" AS ENUM ('ACTIVE', 'DISCONTINUED');
CREATE TYPE "StockTransactionType" AS ENUM ('PURCHASE_RECEIVED', 'CUSTOMER_SALE', 'DAMAGED', 'CUSTOMER_RETURN', 'SUPPLIER_RETURN', 'MANUAL_CORRECTION', 'RESERVED', 'RESERVATION_RELEASED');

ALTER TABLE "Product"
  ADD COLUMN "bulkPrice" DECIMAL(12,2),
  ADD COLUMN "gstPercent" DECIMAL(5,2),
  ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'unit',
  ADD COLUMN "minimumOrderQuantity" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "deliveryInfo" TEXT,
  ADD COLUMN "returnEligible" BOOLEAN,
  ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN "publishedAt" TIMESTAMP(3);

UPDATE "Product" SET "publishedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP) WHERE "status" = 'PUBLISHED';
ALTER TABLE "Product" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

ALTER TABLE "ProductVariant"
  ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'unit',
  ADD COLUMN "minimumOrderQuantity" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "stockQuantity" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "stockTracked" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "status" "VariantStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE TABLE "StockTransaction" (
  "id" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "stockDelta" INTEGER NOT NULL DEFAULT 0,
  "reservedDelta" INTEGER NOT NULL DEFAULT 0,
  "previousStock" INTEGER NOT NULL,
  "updatedStock" INTEGER NOT NULL,
  "previousReserved" INTEGER NOT NULL,
  "updatedReserved" INTEGER NOT NULL,
  "type" "StockTransactionType" NOT NULL,
  "reason" TEXT NOT NULL,
  "reference" TEXT,
  "actorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Product_status_updatedAt_idx" ON "Product"("status", "updatedAt");
CREATE INDEX "ProductVariant_productId_status_idx" ON "ProductVariant"("productId", "status");
CREATE INDEX "ProductVariant_stockQuantity_lowStockThreshold_idx" ON "ProductVariant"("stockQuantity", "lowStockThreshold");
CREATE INDEX "StockTransaction_variantId_createdAt_idx" ON "StockTransaction"("variantId", "createdAt");
CREATE INDEX "StockTransaction_actorId_createdAt_idx" ON "StockTransaction"("actorId", "createdAt");
CREATE INDEX "StockTransaction_type_createdAt_idx" ON "StockTransaction"("type", "createdAt");

ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Product" ADD CONSTRAINT "Product_minimumOrderQuantity_check" CHECK ("minimumOrderQuantity" >= 1);
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_minimumOrderQuantity_check" CHECK ("minimumOrderQuantity" >= 1);
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_stockQuantity_check" CHECK ("stockQuantity" >= 0);
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_reservedQuantity_check" CHECK ("reservedQuantity" >= 0 AND "reservedQuantity" <= "stockQuantity");
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_lowStockThreshold_check" CHECK ("lowStockThreshold" >= 0);
