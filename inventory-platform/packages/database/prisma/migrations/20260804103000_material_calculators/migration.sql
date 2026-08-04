-- Versioned, API-only construction material calculators and immutable estimate snapshots.

CREATE TYPE "CalculatorType" AS ENUM ('CEMENT_CONCRETE', 'BRICKS_BLOCKS', 'TILES_FLOORING', 'PAINT', 'WATERPROOFING', 'TMT_REBAR', 'BUILDING_BUDGET');
CREATE TYPE "CalculatorDefinitionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED');
CREATE TYPE "CalculatorVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');
CREATE TYPE "CalculatorQualityTier" AS ENUM ('ECONOMY', 'STANDARD', 'PREMIUM');
CREATE TYPE "MaterialEstimateStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'EXPIRED', 'CANCELLED');

CREATE TABLE "CalculatorDefinition" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" "CalculatorType" NOT NULL,
  "description" TEXT NOT NULL,
  "instructions" TEXT,
  "imageUrl" TEXT,
  "icon" TEXT,
  "disclaimer" TEXT NOT NULL,
  "status" "CalculatorDefinitionStatus" NOT NULL DEFAULT 'DRAFT',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CalculatorDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CalculatorVersion" (
  "id" TEXT NOT NULL,
  "definitionId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "formulaKey" TEXT NOT NULL,
  "configuration" JSONB NOT NULL,
  "status" "CalculatorVersionStatus" NOT NULL DEFAULT 'DRAFT',
  "effectiveFrom" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdById" TEXT,
  "publishedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CalculatorVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CalculatorProductMapping" (
  "id" TEXT NOT NULL,
  "calculatorVersionId" TEXT NOT NULL,
  "outputKey" TEXT NOT NULL,
  "qualityTier" "CalculatorQualityTier" NOT NULL DEFAULT 'STANDARD',
  "categoryId" TEXT,
  "productId" TEXT,
  "variantId" TEXT,
  "expectedUnit" TEXT NOT NULL,
  "conversionFactor" DECIMAL(18,6) NOT NULL DEFAULT 1,
  "packageSize" DECIMAL(18,6),
  "priority" INTEGER NOT NULL DEFAULT 0,
  "preferred" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CalculatorProductMapping_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MaterialEstimate" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "definitionId" TEXT NOT NULL,
  "calculatorVersionId" TEXT NOT NULL,
  "customerUserId" TEXT,
  "sessionReference" TEXT,
  "deliveryPincode" TEXT NOT NULL,
  "qualityTier" "CalculatorQualityTier" NOT NULL DEFAULT 'STANDARD',
  "inputs" JSONB NOT NULL,
  "results" JSONB NOT NULL,
  "assumptions" JSONB NOT NULL,
  "subtotal" DECIMAL(14,2),
  "gstTotal" DECIMAL(14,2),
  "deliveryTotal" DECIMAL(14,2),
  "valueLow" DECIMAL(14,2),
  "valueHigh" DECIMAL(14,2),
  "priceValidUntil" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "status" "MaterialEstimateStatus" NOT NULL DEFAULT 'ACTIVE',
  "quotationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MaterialEstimate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MaterialEstimateItem" (
  "id" TEXT NOT NULL,
  "estimateId" TEXT NOT NULL,
  "outputKey" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "rawQuantity" DECIMAL(18,6) NOT NULL,
  "wastageQuantity" DECIMAL(18,6) NOT NULL DEFAULT 0,
  "purchaseQuantity" DECIMAL(18,6) NOT NULL,
  "unitCode" TEXT NOT NULL,
  "packageSize" DECIMAL(18,6),
  "productId" TEXT,
  "variantId" TEXT,
  "availabilityLabel" TEXT NOT NULL,
  "leadTimeLabel" TEXT,
  "unitPrice" DECIMAL(14,2),
  "gstPercent" DECIMAL(5,2),
  "lineSubtotal" DECIMAL(14,2),
  "gstAmount" DECIMAL(14,2),
  "lineTotal" DECIMAL(14,2),
  "mappingSnapshot" JSONB NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MaterialEstimateItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CalculatorAuditEvent" (
  "id" TEXT NOT NULL,
  "definitionId" TEXT NOT NULL,
  "versionId" TEXT,
  "action" TEXT NOT NULL,
  "reason" TEXT,
  "before" JSONB,
  "after" JSONB,
  "actorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalculatorAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CalculatorDefinition_slug_key" ON "CalculatorDefinition"("slug");
CREATE UNIQUE INDEX "CalculatorDefinition_type_key" ON "CalculatorDefinition"("type");
CREATE INDEX "CalculatorDefinition_status_sortOrder_idx" ON "CalculatorDefinition"("status", "sortOrder");
CREATE UNIQUE INDEX "CalculatorVersion_definitionId_version_key" ON "CalculatorVersion"("definitionId", "version");
CREATE INDEX "CalculatorVersion_definitionId_status_version_idx" ON "CalculatorVersion"("definitionId", "status", "version");
CREATE INDEX "CalculatorVersion_formulaKey_status_idx" ON "CalculatorVersion"("formulaKey", "status");
CREATE UNIQUE INDEX "CalculatorProductMapping_calculatorVersionId_outputKey_qualityTier_priority_key" ON "CalculatorProductMapping"("calculatorVersionId", "outputKey", "qualityTier", "priority");
CREATE INDEX "CalculatorProductMapping_calculatorVersionId_outputKey_active_idx" ON "CalculatorProductMapping"("calculatorVersionId", "outputKey", "active");
CREATE INDEX "CalculatorProductMapping_productId_variantId_idx" ON "CalculatorProductMapping"("productId", "variantId");
CREATE UNIQUE INDEX "MaterialEstimate_reference_key" ON "MaterialEstimate"("reference");
CREATE UNIQUE INDEX "MaterialEstimate_quotationId_key" ON "MaterialEstimate"("quotationId");
CREATE INDEX "MaterialEstimate_definitionId_status_createdAt_idx" ON "MaterialEstimate"("definitionId", "status", "createdAt");
CREATE INDEX "MaterialEstimate_deliveryPincode_createdAt_idx" ON "MaterialEstimate"("deliveryPincode", "createdAt");
CREATE INDEX "MaterialEstimate_sessionReference_status_idx" ON "MaterialEstimate"("sessionReference", "status");
CREATE INDEX "MaterialEstimate_customerUserId_createdAt_idx" ON "MaterialEstimate"("customerUserId", "createdAt");
CREATE INDEX "MaterialEstimateItem_estimateId_sortOrder_idx" ON "MaterialEstimateItem"("estimateId", "sortOrder");
CREATE INDEX "MaterialEstimateItem_productId_variantId_idx" ON "MaterialEstimateItem"("productId", "variantId");
CREATE INDEX "CalculatorAuditEvent_definitionId_createdAt_idx" ON "CalculatorAuditEvent"("definitionId", "createdAt");
CREATE INDEX "CalculatorAuditEvent_versionId_createdAt_idx" ON "CalculatorAuditEvent"("versionId", "createdAt");
CREATE INDEX "CalculatorAuditEvent_actorId_createdAt_idx" ON "CalculatorAuditEvent"("actorId", "createdAt");

ALTER TABLE "CalculatorVersion" ADD CONSTRAINT "CalculatorVersion_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "CalculatorDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalculatorVersion" ADD CONSTRAINT "CalculatorVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalculatorVersion" ADD CONSTRAINT "CalculatorVersion_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalculatorProductMapping" ADD CONSTRAINT "CalculatorProductMapping_calculatorVersionId_fkey" FOREIGN KEY ("calculatorVersionId") REFERENCES "CalculatorVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalculatorProductMapping" ADD CONSTRAINT "CalculatorProductMapping_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalculatorProductMapping" ADD CONSTRAINT "CalculatorProductMapping_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalculatorProductMapping" ADD CONSTRAINT "CalculatorProductMapping_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaterialEstimate" ADD CONSTRAINT "MaterialEstimate_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "CalculatorDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaterialEstimate" ADD CONSTRAINT "MaterialEstimate_calculatorVersionId_fkey" FOREIGN KEY ("calculatorVersionId") REFERENCES "CalculatorVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MaterialEstimate" ADD CONSTRAINT "MaterialEstimate_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaterialEstimateItem" ADD CONSTRAINT "MaterialEstimateItem_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "MaterialEstimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaterialEstimateItem" ADD CONSTRAINT "MaterialEstimateItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MaterialEstimateItem" ADD CONSTRAINT "MaterialEstimateItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalculatorAuditEvent" ADD CONSTRAINT "CalculatorAuditEvent_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "CalculatorDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalculatorAuditEvent" ADD CONSTRAINT "CalculatorAuditEvent_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "CalculatorVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalculatorAuditEvent" ADD CONSTRAINT "CalculatorAuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DO $$
DECLARE
  table_name text;
  private_tables text[] := ARRAY['CalculatorDefinition', 'CalculatorVersion', 'CalculatorProductMapping', 'MaterialEstimate', 'MaterialEstimateItem', 'CalculatorAuditEvent'];
BEGIN
  FOREACH table_name IN ARRAY private_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon', table_name);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM authenticated', table_name);
  END LOOP;
END $$;
