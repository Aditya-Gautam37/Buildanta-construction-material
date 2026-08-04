CREATE TYPE "QuoteRequestStatus" AS ENUM ('NEW', 'REVIEWING', 'QUOTED', 'ACCEPTED', 'CLOSED');
CREATE TYPE "SupplierSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "QuoteRequest" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "requirement" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "deliveryPincode" TEXT NOT NULL,
  "requiredBy" TEXT,
  "projectType" TEXT,
  "notes" TEXT,
  "status" "QuoteRequestStatus" NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupplierSubmission" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "brand" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "price" DECIMAL(12,2) NOT NULL,
  "stock" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "status" "SupplierSubmissionStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupplierSubmission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuoteRequest_reference_key" ON "QuoteRequest"("reference");
CREATE INDEX "QuoteRequest_status_createdAt_idx" ON "QuoteRequest"("status", "createdAt");
CREATE INDEX "QuoteRequest_email_idx" ON "QuoteRequest"("email");
CREATE UNIQUE INDEX "SupplierSubmission_reference_key" ON "SupplierSubmission"("reference");
CREATE INDEX "SupplierSubmission_status_createdAt_idx" ON "SupplierSubmission"("status", "createdAt");
CREATE INDEX "SupplierSubmission_email_idx" ON "SupplierSubmission"("email");
