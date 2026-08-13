-- Know Your Material: verified, admin-published product knowledge used to
-- ground the AI assistant. One row per Product (not per variant) — coverage
-- rate, mixing ratio, curing time and safety are formulation properties that
-- don't change between pack sizes of the same product.

-- CreateEnum
CREATE TYPE "KnowledgeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RelatedMaterialRole" AS ENUM ('PRIMER', 'SEALANT', 'ADHESIVE', 'GROUT', 'CLEANER', 'MESH', 'PUTTY', 'WATERPROOFING_LAYER', 'APPLICATION_TOOL', 'PROTECTIVE_EQUIPMENT', 'SUPPORTING_MATERIAL', 'OTHER');

-- CreateTable
CREATE TABLE "MaterialKnowledge" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "KnowledgeStatus" NOT NULL DEFAULT 'DRAFT',
    "summary" TEXT,
    "useCases" TEXT[],
    "suitableSurfaces" TEXT[],
    "unsuitableSurfaces" TEXT[],
    "preparationSteps" TEXT[],
    "applicationSteps" TEXT[],
    "sequenceNote" TEXT,
    "mixingInstructions" TEXT,
    "requiredTools" TEXT[],
    "coverageValue" DECIMAL(12,4),
    "coverageUnit" TEXT,
    "coverageConditions" TEXT,
    "numberOfCoats" INTEGER,
    "dryingCuringInfo" TEXT,
    "safetyPrecautions" TEXT[],
    "commonMistakes" TEXT[],
    "professionalTips" TEXT[],
    "technicalDataSheetUrl" TEXT,
    "sourceUrl" TEXT,
    "sourceTitle" TEXT,
    "sourceRevision" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialKnowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialRelatedProduct" (
    "id" TEXT NOT NULL,
    "materialKnowledgeId" TEXT NOT NULL,
    "relatedProductId" TEXT NOT NULL,
    "role" "RelatedMaterialRole" NOT NULL,
    "reason" TEXT NOT NULL,
    "sequenceNote" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialRelatedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaterialKnowledge_productId_key" ON "MaterialKnowledge"("productId");

-- CreateIndex
CREATE INDEX "MaterialKnowledge_status_updatedAt_idx" ON "MaterialKnowledge"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialRelatedProduct_knowledgeId_relatedProductId_key" ON "MaterialRelatedProduct"("materialKnowledgeId", "relatedProductId");

-- CreateIndex
CREATE INDEX "MaterialRelatedProduct_relatedProductId_idx" ON "MaterialRelatedProduct"("relatedProductId");

-- AddForeignKey
ALTER TABLE "MaterialKnowledge" ADD CONSTRAINT "MaterialKnowledge_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialKnowledge" ADD CONSTRAINT "MaterialKnowledge_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRelatedProduct" ADD CONSTRAINT "MaterialRelatedProduct_materialKnowledgeId_fkey" FOREIGN KEY ("materialKnowledgeId") REFERENCES "MaterialKnowledge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRelatedProduct" ADD CONSTRAINT "MaterialRelatedProduct_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
