-- Links rooms and stages to categories so the guided shopping wizard can answer
-- "what does a living room need". INCLUDE rows carry the mapping and its order;
-- EXCLUDE rows hide one subcategory from one owner at any depth.

CREATE TYPE "TaxonomyOwnerType" AS ENUM ('ROOM', 'STAGE');
CREATE TYPE "TaxonomyLinkMode" AS ENUM ('INCLUDE', 'EXCLUDE');

ALTER TABLE "Room" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Stage" ADD COLUMN "imageUrl" TEXT;

CREATE TABLE "TaxonomyCategoryLink" (
    "id" TEXT NOT NULL,
    "ownerType" "TaxonomyOwnerType" NOT NULL,
    "roomId" TEXT,
    "stageId" TEXT,
    "categoryId" TEXT NOT NULL,
    "mode" "TaxonomyLinkMode" NOT NULL DEFAULT 'INCLUDE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxonomyCategoryLink_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TaxonomyCategoryLink_ownerType_mode_sortOrder_idx" ON "TaxonomyCategoryLink"("ownerType", "mode", "sortOrder");
CREATE INDEX "TaxonomyCategoryLink_categoryId_idx" ON "TaxonomyCategoryLink"("categoryId");
CREATE UNIQUE INDEX "TaxonomyCategoryLink_roomId_categoryId_mode_key" ON "TaxonomyCategoryLink"("roomId", "categoryId", "mode");
CREATE UNIQUE INDEX "TaxonomyCategoryLink_stageId_categoryId_mode_key" ON "TaxonomyCategoryLink"("stageId", "categoryId", "mode");

ALTER TABLE "TaxonomyCategoryLink" ADD CONSTRAINT "TaxonomyCategoryLink_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaxonomyCategoryLink" ADD CONSTRAINT "TaxonomyCategoryLink_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaxonomyCategoryLink" ADD CONSTRAINT "TaxonomyCategoryLink_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Exactly one owner, matching ownerType. Without this a row could name both a
-- room and a stage, or neither, and the wizard would silently read nothing.
ALTER TABLE "TaxonomyCategoryLink" ADD CONSTRAINT "TaxonomyCategoryLink_owner_matches_type" CHECK (
  ("ownerType" = 'ROOM' AND "roomId" IS NOT NULL AND "stageId" IS NULL)
  OR ("ownerType" = 'STAGE' AND "stageId" IS NOT NULL AND "roomId" IS NULL)
);

-- Same treatment as every other catalogue table: reachable through the API, not
-- through the public Data API.
ALTER TABLE public."TaxonomyCategoryLink" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."TaxonomyCategoryLink" FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public."TaxonomyCategoryLink" FROM authenticated;

ALTER INDEX "CalculatorProductMapping_calculatorVersionId_outputKey_active_i" RENAME TO "CalculatorProductMapping_calculatorVersionId_outputKey_acti_idx";
ALTER INDEX "CalculatorProductMapping_calculatorVersionId_outputKey_qualityT" RENAME TO "CalculatorProductMapping_calculatorVersionId_outputKey_qual_key";
