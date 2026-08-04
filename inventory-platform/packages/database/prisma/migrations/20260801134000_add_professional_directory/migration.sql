-- CreateEnum
CREATE TYPE "ProfessionalType" AS ENUM ('CONTRACTOR', 'INTERIOR_DESIGNER', 'BUILDER', 'ARCHITECT', 'PRODUCT_OWNER');

-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ProfessionalType" NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "photoUrl" TEXT,
    "location" TEXT NOT NULL,
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "portfolioUrl" TEXT,
    "services" TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Professional_slug_key" ON "Professional"("slug");

-- CreateIndex
CREATE INDEX "Professional_type_published_sortOrder_idx" ON "Professional"("type", "published", "sortOrder");

-- CreateIndex
CREATE INDEX "Professional_published_featured_idx" ON "Professional"("published", "featured");
