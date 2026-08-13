-- Extends contractor packages into a structured, comparable model.
--
-- EXPAND ONLY. The old columns (published, inclusions, materials.detail) are
-- deliberately left in place: production is still serving traffic with code
-- that reads them, and dropping them here would break every professional page
-- between running this migration and deploying the new code.
--
-- They are emptied of meaning, not of data: everything is copied forward first.
-- A separate contract migration removes them once the new code is live.
--   published(bool)    -> status(enum)
--   inclusions(text[]) -> ContractorPackageInclusion rows
--   materials.detail   -> materials.specification

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PackageRateBasis" AS ENUM ('PLOT_AREA', 'BUILT_UP_AREA');

-- CreateEnum
CREATE TYPE "PackageInclusionCategory" AS ENUM ('STRUCTURE', 'PLASTER', 'ELECTRICAL', 'PLUMBING', 'FLOORING', 'WINDOWS', 'DOORS', 'KITCHEN', 'BATHROOM', 'PAINT', 'CEILING', 'ELEVATION', 'WATER_TANK', 'RAILING', 'OTHER');

-- Add new columns. slug is nullable initially so existing rows can be backfilled.
ALTER TABLE "ContractorPackage"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "summary" TEXT,
  ADD COLUMN "rateBasis" "PackageRateBasis" NOT NULL DEFAULT 'PLOT_AREA',
  ADD COLUMN "exampleArea" DECIMAL(12,2),
  ADD COLUMN "exampleCost" DECIMAL(14,2),
  ADD COLUMN "exclusions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "terms" TEXT,
  ADD COLUMN "validFrom" TIMESTAMP(3),
  ADD COLUMN "validUntil" TIMESTAMP(3),
  ADD COLUMN "status" "PackageStatus" NOT NULL DEFAULT 'DRAFT';

-- Backfill status from the boolean it replaces.
UPDATE "ContractorPackage" SET "status" = 'PUBLISHED' WHERE "published" = true;

-- Backfill slug from name: lowercase, non-alphanumerics to hyphens, trimmed.
UPDATE "ContractorPackage"
SET "slug" = trim(both '-' from regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'))
WHERE "slug" IS NULL;

-- Guard against a name that slugifies to nothing (e.g. only punctuation).
UPDATE "ContractorPackage" SET "slug" = 'package-' || left("id", 8) WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "ContractorPackage" ALTER COLUMN "slug" SET NOT NULL;

-- The old boolean keeps working for currently-deployed code, but new rows
-- written by the new code will not set it, so it needs a default.
ALTER TABLE "ContractorPackage" ALTER COLUMN "published" SET DEFAULT false;

-- CreateTable
CREATE TABLE "ContractorPackageInclusion" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "category" "PackageInclusionCategory" NOT NULL DEFAULT 'OTHER',
    "label" TEXT NOT NULL,
    "description" TEXT,
    "allowanceAmount" DECIMAL(12,2),
    "allowanceUnit" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ContractorPackageInclusion_pkey" PRIMARY KEY ("id")
);

-- Move each inclusion string into its own row, preserving order. Category is
-- OTHER so staff re-categorise deliberately, rather than the migration guessing
-- and being confidently wrong.
INSERT INTO "ContractorPackageInclusion" ("id", "packageId", "category", "label", "sortOrder")
SELECT
    md5(random()::text || clock_timestamp()::text || p."id" || item.ordinality::text),
    p."id",
    'OTHER',
    item.value,
    (item.ordinality - 1)::int
FROM "ContractorPackage" p
CROSS JOIN LATERAL unnest(p."inclusions") WITH ORDINALITY AS item(value, ordinality)
WHERE p."inclusions" IS NOT NULL AND array_length(p."inclusions", 1) > 0;

-- Materials: copy detail into specification rather than renaming, so live code
-- reading detail keeps working. detail becomes nullable because the new code
-- will no longer write it.
ALTER TABLE "ContractorPackageMaterial"
  ADD COLUMN "specification" TEXT,
  ADD COLUMN "preferredBrands" TEXT,
  ADD COLUMN "substitutionNote" TEXT;

UPDATE "ContractorPackageMaterial" SET "specification" = "detail" WHERE "specification" IS NULL;

ALTER TABLE "ContractorPackageMaterial" ALTER COLUMN "specification" SET NOT NULL;
ALTER TABLE "ContractorPackageMaterial" ALTER COLUMN "detail" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ContractorPackage_professionalId_slug_key" ON "ContractorPackage"("professionalId", "slug");

-- CreateIndex
CREATE INDEX "ContractorPackage_professionalId_status_sortOrder_idx" ON "ContractorPackage"("professionalId", "status", "sortOrder");

-- CreateIndex
CREATE INDEX "ContractorPackageInclusion_packageId_sortOrder_idx" ON "ContractorPackageInclusion"("packageId", "sortOrder");

-- AddForeignKey
ALTER TABLE "ContractorPackageInclusion" ADD CONSTRAINT "ContractorPackageInclusion_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "ContractorPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
