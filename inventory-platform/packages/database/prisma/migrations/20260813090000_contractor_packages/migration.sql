-- Contractor rate cards: the packages a contractor advertises, each with a
-- per-square-foot rate, its inclusions and the material brands used. Purely
-- additive — no existing table, column or row is touched.

-- CreateTable
CREATE TABLE "ContractorPackage" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "ratePerSqFt" DECIMAL(12,2) NOT NULL,
    "inclusions" TEXT[],
    "bestFor" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractorPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractorPackageMaterial" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ContractorPackageMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContractorPackage_professionalId_name_key" ON "ContractorPackage"("professionalId", "name");

-- CreateIndex
CREATE INDEX "ContractorPackage_professionalId_published_sortOrder_idx" ON "ContractorPackage"("professionalId", "published", "sortOrder");

-- CreateIndex
CREATE INDEX "ContractorPackageMaterial_packageId_sortOrder_idx" ON "ContractorPackageMaterial"("packageId", "sortOrder");

-- AddForeignKey
ALTER TABLE "ContractorPackage" ADD CONSTRAINT "ContractorPackage_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractorPackageMaterial" ADD CONSTRAINT "ContractorPackageMaterial_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ContractorPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
