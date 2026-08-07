-- Adds direct-purchase eligibility to ProductVariant and a persistent Cart/CartItem model,
-- the first vertical slice of the hybrid (cart + negotiated quotation) commerce platform.

CREATE TYPE "PurchaseMode" AS ENUM ('DIRECT_ONLY', 'QUOTE_ONLY', 'DIRECT_AND_QUOTE');
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'ABANDONED', 'EXPIRED');

ALTER TABLE "ProductVariant" ADD COLUMN "purchaseMode" "PurchaseMode" NOT NULL DEFAULT 'QUOTE_ONLY';
ALTER TABLE "ProductVariant" ADD COLUMN "maxDirectQuantity" INTEGER;
ALTER TABLE "ProductVariant" ADD COLUMN "bulkQuoteThreshold" INTEGER;
ALTER TABLE "ProductVariant" ADD COLUMN "quantityIncrement" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ProductVariant" ADD COLUMN "directCheckoutEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProductVariant" ADD COLUMN "manualDeliveryPricingEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "Cart" (
  "id" TEXT NOT NULL,
  "customerId" TEXT,
  "guestToken" TEXT,
  "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "conversionIdempotencyKey" TEXT,
  "convertedAt" TIMESTAMP(3),
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CartItem" (
  "id" TEXT NOT NULL,
  "cartId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPriceSnapshot" DECIMAL(12,2),
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Quotation" ADD COLUMN "sourceCartId" TEXT;

CREATE UNIQUE INDEX "Cart_guestToken_key" ON "Cart"("guestToken");
CREATE INDEX "Cart_customerId_status_idx" ON "Cart"("customerId", "status");
CREATE INDEX "Cart_guestToken_idx" ON "Cart"("guestToken");
CREATE INDEX "Cart_status_lastActivityAt_idx" ON "Cart"("status", "lastActivityAt");
CREATE UNIQUE INDEX "CartItem_cartId_variantId_key" ON "CartItem"("cartId", "variantId");
CREATE INDEX "CartItem_variantId_idx" ON "CartItem"("variantId");
CREATE UNIQUE INDEX "Quotation_sourceCartId_key" ON "Quotation"("sourceCartId");

ALTER TABLE "Cart" ADD CONSTRAINT "Cart_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_sourceCartId_fkey" FOREIGN KEY ("sourceCartId") REFERENCES "Cart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DO $$
DECLARE
  table_name text;
  private_tables text[] := ARRAY['Cart', 'CartItem'];
BEGIN
  FOREACH table_name IN ARRAY private_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon', table_name);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM authenticated', table_name);
  END LOOP;
END $$;
