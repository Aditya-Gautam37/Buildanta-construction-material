-- CreateTable
CREATE TABLE "HomepageSlide" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageProduct" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "badge" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomepageSlide_active_sortOrder_idx" ON "HomepageSlide"("active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "HomepageProduct_productId_key" ON "HomepageProduct"("productId");

-- CreateIndex
CREATE INDEX "HomepageProduct_sortOrder_idx" ON "HomepageProduct"("sortOrder");

-- AddForeignKey
ALTER TABLE "HomepageProduct" ADD CONSTRAINT "HomepageProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
