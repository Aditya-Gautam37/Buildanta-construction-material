-- Package enquiries: a customer asking a contractor for a real quotation,
-- starting from an advertised package.
--
-- Purely additive: one new enum and one new table. No existing table, column
-- or row is touched.
--
-- The rate, package name and computed amount are snapshotted at submission so
-- a later price change cannot rewrite what a customer was shown. packageId is
-- nullable with ON DELETE SET NULL for the same reason: deleting a package
-- must not delete the record of people who enquired about it.

-- CreateEnum
CREATE TYPE "PackageEnquiryStatus" AS ENUM ('SUBMITTED', 'REVIEWING', 'PROFESSIONAL_CONTACTED', 'CALLBACK_SCHEDULED', 'SITE_VISIT_SCHEDULED', 'QUOTATION_PREPARED', 'CLOSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PackageEnquiry" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "packageId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "projectLocation" TEXT,
    "plotDimensions" TEXT,
    "areaSqFt" DECIMAL(12,2) NOT NULL,
    "floors" INTEGER,
    "constructionType" TEXT,
    "expectedStart" TEXT,
    "requirement" TEXT,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "packageNameSnapshot" TEXT NOT NULL,
    "rateSnapshot" DECIMAL(12,2) NOT NULL,
    "rateBasisSnapshot" "PackageRateBasis" NOT NULL,
    "amountSnapshot" DECIMAL(14,2) NOT NULL,
    "status" "PackageEnquiryStatus" NOT NULL DEFAULT 'SUBMITTED',
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PackageEnquiry_reference_key" ON "PackageEnquiry"("reference");

-- CreateIndex
CREATE INDEX "PackageEnquiry_professionalId_status_createdAt_idx" ON "PackageEnquiry"("professionalId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PackageEnquiry_status_createdAt_idx" ON "PackageEnquiry"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "PackageEnquiry" ADD CONSTRAINT "PackageEnquiry_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageEnquiry" ADD CONSTRAINT "PackageEnquiry_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ContractorPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
