-- Rich category merchandising and controlled ordering.
ALTER TABLE "Category"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "imageUrl" TEXT,
  ADD COLUMN "icon" TEXT,
  ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "seoTitle" TEXT,
  ADD COLUMN "seoDescription" TEXT;

-- Product galleries can now choose and order a primary image.
ALTER TABLE "ProductImage"
  ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "primary" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Category_parentId_published_sortOrder_idx"
  ON "Category"("parentId", "published", "sortOrder");
CREATE INDEX "Category_published_featured_sortOrder_idx"
  ON "Category"("published", "featured", "sortOrder");
CREATE INDEX "ProductImage_productId_primary_sortOrder_idx"
  ON "ProductImage"("productId", "primary", "sortOrder");
