-- CreateEnum
CREATE TYPE "FulfilmentMode" AS ENUM ('STOCKED', 'PARTNER_STOCK', 'ON_REQUEST');

-- CreateEnum
CREATE TYPE "FulfilmentLocationType" AS ENUM ('WAREHOUSE', 'DEALER_PARTNER', 'SUPPLIER_PARTNER');

-- CreateEnum
CREATE TYPE "InventoryReservationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'CONSUMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockTransferStatus" AS ENUM ('DRAFT', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockCountStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InventoryLedgerType" AS ENUM ('ADJUSTMENT', 'RESERVATION', 'RESERVATION_RELEASE', 'TRANSFER_OUT', 'TRANSFER_IN', 'COUNT_CORRECTION', 'DAMAGE', 'QUARANTINE', 'RETURN');

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "dimension" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitConversion" (
    "id" TEXT NOT NULL,
    "fromUnitId" TEXT NOT NULL,
    "toUnitId" TEXT NOT NULL,
    "multiplier" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseLocation" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dealer" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dealer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carrier" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Carrier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceArea" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PincodeCoverage" (
    "id" TEXT NOT NULL,
    "serviceAreaId" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PincodeCoverage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FulfilmentLocation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FulfilmentLocationType" NOT NULL,
    "mode" "FulfilmentMode" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "warehouseId" TEXT,
    "dealerId" TEXT,
    "supplierId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FulfilmentLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FulfilmentServiceArea" (
    "id" TEXT NOT NULL,
    "fulfilmentLocationId" TEXT NOT NULL,
    "serviceAreaId" TEXT NOT NULL,
    "deliveryCharge" DECIMAL(12,2),
    "minimumOrderValue" DECIMAL(12,2),
    "estimatedLeadDays" INTEGER NOT NULL DEFAULT 2,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FulfilmentServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryBalance" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "fulfilmentLocationId" TEXT NOT NULL,
    "warehouseLocationId" TEXT,
    "physicalQuantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "blockedQuantity" INTEGER NOT NULL DEFAULT 0,
    "damagedQuantity" INTEGER NOT NULL DEFAULT 0,
    "quarantineQuantity" INTEGER NOT NULL DEFAULT 0,
    "inTransitQuantity" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryReservation" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "fulfilmentLocationId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "InventoryReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLedgerEntry" (
    "id" TEXT NOT NULL,
    "balanceId" TEXT NOT NULL,
    "type" "InventoryLedgerType" NOT NULL,
    "physicalDelta" INTEGER NOT NULL DEFAULT 0,
    "reservedDelta" INTEGER NOT NULL DEFAULT 0,
    "blockedDelta" INTEGER NOT NULL DEFAULT 0,
    "damagedDelta" INTEGER NOT NULL DEFAULT 0,
    "quarantineDelta" INTEGER NOT NULL DEFAULT 0,
    "inTransitDelta" INTEGER NOT NULL DEFAULT 0,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "reference" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransfer" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "originLocationId" TEXT NOT NULL,
    "destinationLocationId" TEXT NOT NULL,
    "status" "StockTransferStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransferItem" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockTransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockCount" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "fulfilmentLocationId" TEXT NOT NULL,
    "status" "StockCountStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "countedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockCount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockCountItem" (
    "id" TEXT NOT NULL,
    "stockCountId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "expectedQuantity" INTEGER NOT NULL,
    "countedQuantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockCountItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierProduct" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "supplierSku" TEXT,
    "fulfilmentMode" "FulfilmentMode" NOT NULL DEFAULT 'ON_REQUEST',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPrice" (
    "id" TEXT NOT NULL,
    "supplierProductId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "minimumQuantity" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierLeadTime" (
    "id" TEXT NOT NULL,
    "supplierProductId" TEXT NOT NULL,
    "serviceAreaId" TEXT,
    "minimumDays" INTEGER NOT NULL,
    "maximumDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierLeadTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerProduct" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "price" DECIMAL(12,2),
    "reportedQuantity" INTEGER,
    "confirmedAt" TIMESTAMP(3),
    "leadTimeDays" INTEGER NOT NULL DEFAULT 2,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerServiceArea" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "serviceAreaId" TEXT NOT NULL,
    "deliveryCharge" DECIMAL(12,2),
    "minimumOrderValue" DECIMAL(12,2),
    "estimatedLeadDays" INTEGER NOT NULL DEFAULT 2,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarrierServiceArea" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "serviceAreaId" TEXT NOT NULL,
    "baseCharge" DECIMAL(12,2),
    "perKmCharge" DECIMAL(12,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarrierServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_code_key" ON "Unit"("code");

-- CreateIndex
CREATE INDEX "Unit_active_name_idx" ON "Unit"("active", "name");

-- CreateIndex
CREATE UNIQUE INDEX "UnitConversion_fromUnitId_toUnitId_key" ON "UnitConversion"("fromUnitId", "toUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");

-- CreateIndex
CREATE INDEX "Warehouse_active_city_idx" ON "Warehouse"("active", "city");

-- CreateIndex
CREATE INDEX "WarehouseLocation_warehouseId_active_idx" ON "WarehouseLocation"("warehouseId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseLocation_warehouseId_code_key" ON "WarehouseLocation"("warehouseId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Dealer_code_key" ON "Dealer"("code");

-- CreateIndex
CREATE INDEX "Dealer_active_city_idx" ON "Dealer"("active", "city");

-- CreateIndex
CREATE UNIQUE INDEX "Carrier_code_key" ON "Carrier"("code");

-- CreateIndex
CREATE INDEX "Carrier_active_name_idx" ON "Carrier"("active", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceArea_code_key" ON "ServiceArea"("code");

-- CreateIndex
CREATE INDEX "ServiceArea_active_city_idx" ON "ServiceArea"("active", "city");

-- CreateIndex
CREATE INDEX "PincodeCoverage_pincode_active_idx" ON "PincodeCoverage"("pincode", "active");

-- CreateIndex
CREATE UNIQUE INDEX "PincodeCoverage_serviceAreaId_pincode_key" ON "PincodeCoverage"("serviceAreaId", "pincode");

-- CreateIndex
CREATE UNIQUE INDEX "FulfilmentLocation_code_key" ON "FulfilmentLocation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FulfilmentLocation_warehouseId_key" ON "FulfilmentLocation"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "FulfilmentLocation_dealerId_key" ON "FulfilmentLocation"("dealerId");

-- CreateIndex
CREATE INDEX "FulfilmentLocation_active_type_idx" ON "FulfilmentLocation"("active", "type");

-- CreateIndex
CREATE INDEX "FulfilmentLocation_supplierId_active_idx" ON "FulfilmentLocation"("supplierId", "active");

-- CreateIndex
CREATE INDEX "FulfilmentServiceArea_serviceAreaId_active_idx" ON "FulfilmentServiceArea"("serviceAreaId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "FulfilmentServiceArea_fulfilmentLocationId_serviceAreaId_key" ON "FulfilmentServiceArea"("fulfilmentLocationId", "serviceAreaId");

-- CreateIndex
CREATE INDEX "InventoryBalance_fulfilmentLocationId_updatedAt_idx" ON "InventoryBalance"("fulfilmentLocationId", "updatedAt");

-- CreateIndex
CREATE INDEX "InventoryBalance_variantId_updatedAt_idx" ON "InventoryBalance"("variantId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryBalance_variantId_fulfilmentLocationId_key" ON "InventoryBalance"("variantId", "fulfilmentLocationId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryReservation_reference_key" ON "InventoryReservation"("reference");

-- CreateIndex
CREATE INDEX "InventoryReservation_variantId_status_idx" ON "InventoryReservation"("variantId", "status");

-- CreateIndex
CREATE INDEX "InventoryReservation_fulfilmentLocationId_status_idx" ON "InventoryReservation"("fulfilmentLocationId", "status");

-- CreateIndex
CREATE INDEX "InventoryReservation_status_expiresAt_idx" ON "InventoryReservation"("status", "expiresAt");

CREATE INDEX "InventoryLedgerEntry_balanceId_createdAt_idx" ON "InventoryLedgerEntry"("balanceId", "createdAt");
CREATE INDEX "InventoryLedgerEntry_actorId_createdAt_idx" ON "InventoryLedgerEntry"("actorId", "createdAt");
CREATE INDEX "InventoryLedgerEntry_type_createdAt_idx" ON "InventoryLedgerEntry"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StockTransfer_reference_key" ON "StockTransfer"("reference");

-- CreateIndex
CREATE INDEX "StockTransfer_status_createdAt_idx" ON "StockTransfer"("status", "createdAt");

-- CreateIndex
CREATE INDEX "StockTransfer_originLocationId_status_idx" ON "StockTransfer"("originLocationId", "status");

-- CreateIndex
CREATE INDEX "StockTransfer_destinationLocationId_status_idx" ON "StockTransfer"("destinationLocationId", "status");

-- CreateIndex
CREATE INDEX "StockTransferItem_variantId_idx" ON "StockTransferItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "StockTransferItem_transferId_variantId_key" ON "StockTransferItem"("transferId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "StockCount_reference_key" ON "StockCount"("reference");

-- CreateIndex
CREATE INDEX "StockCount_status_createdAt_idx" ON "StockCount"("status", "createdAt");

-- CreateIndex
CREATE INDEX "StockCount_fulfilmentLocationId_status_idx" ON "StockCount"("fulfilmentLocationId", "status");

-- CreateIndex
CREATE INDEX "StockCountItem_variantId_idx" ON "StockCountItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "StockCountItem_stockCountId_variantId_key" ON "StockCountItem"("stockCountId", "variantId");

-- CreateIndex
CREATE INDEX "SupplierProduct_variantId_active_idx" ON "SupplierProduct"("variantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProduct_supplierId_variantId_key" ON "SupplierProduct"("supplierId", "variantId");

-- CreateIndex
CREATE INDEX "SupplierPrice_supplierProductId_validFrom_validUntil_idx" ON "SupplierPrice"("supplierProductId", "validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "SupplierLeadTime_supplierProductId_serviceAreaId_idx" ON "SupplierLeadTime"("supplierProductId", "serviceAreaId");

-- CreateIndex
CREATE INDEX "DealerProduct_variantId_active_idx" ON "DealerProduct"("variantId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "DealerProduct_dealerId_variantId_key" ON "DealerProduct"("dealerId", "variantId");

-- CreateIndex
CREATE INDEX "DealerServiceArea_serviceAreaId_active_idx" ON "DealerServiceArea"("serviceAreaId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "DealerServiceArea_dealerId_serviceAreaId_key" ON "DealerServiceArea"("dealerId", "serviceAreaId");

-- CreateIndex
CREATE INDEX "CarrierServiceArea_serviceAreaId_active_idx" ON "CarrierServiceArea"("serviceAreaId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "CarrierServiceArea_carrierId_serviceAreaId_key" ON "CarrierServiceArea"("carrierId", "serviceAreaId");

-- AddForeignKey
ALTER TABLE "UnitConversion" ADD CONSTRAINT "UnitConversion_fromUnitId_fkey" FOREIGN KEY ("fromUnitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitConversion" ADD CONSTRAINT "UnitConversion_toUnitId_fkey" FOREIGN KEY ("toUnitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseLocation" ADD CONSTRAINT "WarehouseLocation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PincodeCoverage" ADD CONSTRAINT "PincodeCoverage_serviceAreaId_fkey" FOREIGN KEY ("serviceAreaId") REFERENCES "ServiceArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FulfilmentLocation" ADD CONSTRAINT "FulfilmentLocation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FulfilmentLocation" ADD CONSTRAINT "FulfilmentLocation_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FulfilmentLocation" ADD CONSTRAINT "FulfilmentLocation_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FulfilmentServiceArea" ADD CONSTRAINT "FulfilmentServiceArea_fulfilmentLocationId_fkey" FOREIGN KEY ("fulfilmentLocationId") REFERENCES "FulfilmentLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FulfilmentServiceArea" ADD CONSTRAINT "FulfilmentServiceArea_serviceAreaId_fkey" FOREIGN KEY ("serviceAreaId") REFERENCES "ServiceArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_fulfilmentLocationId_fkey" FOREIGN KEY ("fulfilmentLocationId") REFERENCES "FulfilmentLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_warehouseLocationId_fkey" FOREIGN KEY ("warehouseLocationId") REFERENCES "WarehouseLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_fulfilmentLocationId_fkey" FOREIGN KEY ("fulfilmentLocationId") REFERENCES "FulfilmentLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InventoryLedgerEntry" ADD CONSTRAINT "InventoryLedgerEntry_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES "InventoryBalance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryLedgerEntry" ADD CONSTRAINT "InventoryLedgerEntry_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_originLocationId_fkey" FOREIGN KEY ("originLocationId") REFERENCES "FulfilmentLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_destinationLocationId_fkey" FOREIGN KEY ("destinationLocationId") REFERENCES "FulfilmentLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StockTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCount" ADD CONSTRAINT "StockCount_fulfilmentLocationId_fkey" FOREIGN KEY ("fulfilmentLocationId") REFERENCES "FulfilmentLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCountItem" ADD CONSTRAINT "StockCountItem_stockCountId_fkey" FOREIGN KEY ("stockCountId") REFERENCES "StockCount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockCountItem" ADD CONSTRAINT "StockCountItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPrice" ADD CONSTRAINT "SupplierPrice_supplierProductId_fkey" FOREIGN KEY ("supplierProductId") REFERENCES "SupplierProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierLeadTime" ADD CONSTRAINT "SupplierLeadTime_supplierProductId_fkey" FOREIGN KEY ("supplierProductId") REFERENCES "SupplierProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierLeadTime" ADD CONSTRAINT "SupplierLeadTime_serviceAreaId_fkey" FOREIGN KEY ("serviceAreaId") REFERENCES "ServiceArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerProduct" ADD CONSTRAINT "DealerProduct_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerProduct" ADD CONSTRAINT "DealerProduct_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerServiceArea" ADD CONSTRAINT "DealerServiceArea_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "Dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerServiceArea" ADD CONSTRAINT "DealerServiceArea_serviceAreaId_fkey" FOREIGN KEY ("serviceAreaId") REFERENCES "ServiceArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarrierServiceArea" ADD CONSTRAINT "CarrierServiceArea_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarrierServiceArea" ADD CONSTRAINT "CarrierServiceArea_serviceAreaId_fkey" FOREIGN KEY ("serviceAreaId") REFERENCES "ServiceArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Operational invariants are enforced in PostgreSQL as well as the API.
ALTER TABLE "UnitConversion" ADD CONSTRAINT "UnitConversion_multiplier_check" CHECK ("multiplier" > 0);
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_quantities_check" CHECK (
  "physicalQuantity" >= 0 AND "reservedQuantity" >= 0 AND "blockedQuantity" >= 0
  AND "damagedQuantity" >= 0 AND "quarantineQuantity" >= 0 AND "inTransitQuantity" >= 0
  AND "lowStockThreshold" >= 0
  AND "reservedQuantity" + "blockedQuantity" + "damagedQuantity" + "quarantineQuantity" <= "physicalQuantity"
);
ALTER TABLE "InventoryReservation" ADD CONSTRAINT "InventoryReservation_quantity_check" CHECK ("quantity" > 0);
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_distinct_locations_check" CHECK ("originLocationId" <> "destinationLocationId");
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_quantities_check" CHECK ("quantity" > 0 AND "receivedQuantity" >= 0 AND "receivedQuantity" <= "quantity");
ALTER TABLE "StockCountItem" ADD CONSTRAINT "StockCountItem_quantities_check" CHECK ("expectedQuantity" >= 0 AND "countedQuantity" >= 0);
ALTER TABLE "SupplierPrice" ADD CONSTRAINT "SupplierPrice_values_check" CHECK ("price" >= 0 AND "minimumQuantity" >= 1 AND ("validUntil" IS NULL OR "validUntil" >= "validFrom"));
ALTER TABLE "SupplierLeadTime" ADD CONSTRAINT "SupplierLeadTime_days_check" CHECK ("minimumDays" >= 0 AND "maximumDays" >= "minimumDays");
ALTER TABLE "DealerProduct" ADD CONSTRAINT "DealerProduct_values_check" CHECK (("price" IS NULL OR "price" >= 0) AND ("reportedQuantity" IS NULL OR "reportedQuantity" >= 0) AND "leadTimeDays" >= 0);
ALTER TABLE "FulfilmentServiceArea" ADD CONSTRAINT "FulfilmentServiceArea_values_check" CHECK ("estimatedLeadDays" >= 0 AND ("deliveryCharge" IS NULL OR "deliveryCharge" >= 0) AND ("minimumOrderValue" IS NULL OR "minimumOrderValue" >= 0));
ALTER TABLE "DealerServiceArea" ADD CONSTRAINT "DealerServiceArea_values_check" CHECK ("estimatedLeadDays" >= 0 AND ("deliveryCharge" IS NULL OR "deliveryCharge" >= 0) AND ("minimumOrderValue" IS NULL OR "minimumOrderValue" >= 0));
ALTER TABLE "CarrierServiceArea" ADD CONSTRAINT "CarrierServiceArea_values_check" CHECK (("baseCharge" IS NULL OR "baseCharge" >= 0) AND ("perKmCharge" IS NULL OR "perKmCharge" >= 0));

-- Preserve existing variant stock by moving it into one explicit legacy warehouse.
INSERT INTO "Warehouse" ("id", "code", "name", "address", "city", "state", "pincode", "active", "createdAt", "updatedAt")
VALUES ('warehouse_legacy_default', 'LEGACY-KANPUR', 'Kanpur legacy stock', 'Existing stock migrated from variant totals', 'Kanpur', 'Uttar Pradesh', '208001', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "WarehouseLocation" ("id", "warehouseId", "code", "name", "zone", "active", "createdAt", "updatedAt")
VALUES ('warehouse_location_legacy_main', 'warehouse_legacy_default', 'MAIN', 'Main storage', 'Legacy', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "FulfilmentLocation" ("id", "code", "name", "type", "mode", "active", "warehouseId", "createdAt", "updatedAt")
VALUES ('fulfilment_legacy_default', 'LEGACY-KANPUR', 'Kanpur legacy stock', 'WAREHOUSE', 'STOCKED', true, 'warehouse_legacy_default', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "InventoryBalance" (
  "id", "variantId", "fulfilmentLocationId", "warehouseLocationId", "physicalQuantity",
  "reservedQuantity", "blockedQuantity", "damagedQuantity", "quarantineQuantity", "inTransitQuantity",
  "lowStockThreshold", "createdAt", "updatedAt"
)
SELECT
  'balance_legacy_' || "id", "id", 'fulfilment_legacy_default', 'warehouse_location_legacy_main',
  "stockQuantity", "reservedQuantity", 0, 0, 0, 0, "lowStockThreshold", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "ProductVariant";

-- Existing primary supplier assignments become explicit supplier-product records.
INSERT INTO "SupplierProduct" (
  "id", "supplierId", "variantId", "supplierSku", "fulfilmentMode", "active", "createdAt", "updatedAt"
)
SELECT 'supplier_product_legacy_' || "id", "supplierId", "id", "sku", 'ON_REQUEST', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "ProductVariant";

-- Standard controlled units. Existing free-text variant units remain unchanged and can be mapped progressively.
INSERT INTO "Unit" ("id", "code", "name", "symbol", "dimension", "active", "createdAt", "updatedAt") VALUES
  ('unit_each', 'EACH', 'Each', 'ea', 'COUNT', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('unit_bag', 'BAG', 'Bag', 'bag', 'COUNT', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('unit_kg', 'KG', 'Kilogram', 'kg', 'MASS', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('unit_tonne', 'TONNE', 'Metric tonne', 't', 'MASS', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('unit_piece', 'PIECE', 'Piece', 'pc', 'COUNT', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('unit_sqft', 'SQ_FT', 'Square foot', 'sq ft', 'AREA', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('unit_litre', 'LITRE', 'Litre', 'L', 'VOLUME', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('unit_meter', 'METER', 'Meter', 'm', 'LENGTH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "UnitConversion" ("id", "fromUnitId", "toUnitId", "multiplier", "createdAt", "updatedAt") VALUES
  ('conversion_tonne_kg', 'unit_tonne', 'unit_kg', 1000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
