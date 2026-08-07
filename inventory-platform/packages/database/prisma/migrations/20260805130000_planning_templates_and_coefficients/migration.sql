-- Managed regional profiles, room/point/fixture planning templates and audited planning coefficients.

CREATE TYPE "RoomType" AS ENUM ('BEDROOM', 'LIVING_ROOM', 'KITCHEN', 'BATHROOM', 'TOILET', 'DINING_ROOM', 'STUDY', 'UTILITY', 'BALCONY', 'STAIRCASE', 'CORRIDOR', 'GARAGE', 'OTHER');
CREATE TYPE "ElectricalPointType" AS ENUM ('LIGHT_POINT', 'FAN_POINT', 'SOCKET_5A', 'SOCKET_15A', 'SOCKET_20A_AC', 'SOCKET_20A_GEYSER', 'TV_POINT', 'DATA_POINT', 'DOORBELL', 'EXHAUST_FAN_POINT', 'DB_FEEDER', 'OTHER');
CREATE TYPE "ElectricalCircuitPurpose" AS ENUM ('LIGHTING', 'POWER_SOCKET', 'AC', 'GEYSER', 'KITCHEN_APPLIANCE', 'PUMP_MOTOR', 'DB_FEEDER', 'OTHER');
CREATE TYPE "PlumbingSystemType" AS ENUM ('COLD_WATER', 'HOT_WATER', 'SOIL', 'WASTE', 'VENT', 'RAINWATER');
CREATE TYPE "PlumbingFixtureType" AS ENUM ('WASH_BASIN', 'WC', 'SHOWER', 'BATHTUB', 'KITCHEN_SINK', 'UTILITY_SINK', 'FLOOR_DRAIN', 'HOSE_BIB', 'RAINWATER_OUTLET', 'OTHER');
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');
CREATE TYPE "PlanningCoefficientStatus" AS ENUM ('DRAFT', 'APPROVED', 'PUBLISHED', 'RETIRED');

CREATE TABLE "RegionalProfile" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'IN',
  "state" TEXT NOT NULL,
  "city" TEXT,
  "district" TEXT,
  "seismicZone" TEXT,
  "windZoneMPerS" DECIMAL(10,2),
  "soilBearingCapacityKNM2" DECIMAL(10,2),
  "notes" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RegionalProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoomTemplate" (
  "id" TEXT NOT NULL,
  "regionalProfileId" TEXT,
  "roomType" "RoomType" NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "typicalAreaSqFtMin" DECIMAL(10,2),
  "typicalAreaSqFtMax" DECIMAL(10,2),
  "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
  "version" INTEGER NOT NULL DEFAULT 1,
  "effectiveFrom" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdById" TEXT,
  "publishedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RoomTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ElectricalPointTemplate" (
  "id" TEXT NOT NULL,
  "roomTemplateId" TEXT NOT NULL,
  "pointType" "ElectricalPointType" NOT NULL,
  "purpose" "ElectricalCircuitPurpose" NOT NULL DEFAULT 'OTHER',
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "oneWayRouteM" DECIMAL(10,2) NOT NULL,
  "numberOfConductors" INTEGER NOT NULL DEFAULT 2,
  "earthConductorCount" INTEGER NOT NULL DEFAULT 1,
  "conductorSizeSqmm" DECIMAL(6,2) NOT NULL,
  "earthConductorSizeSqmm" DECIMAL(6,2),
  "notes" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ElectricalPointTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlumbingFixtureTemplate" (
  "id" TEXT NOT NULL,
  "roomTemplateId" TEXT NOT NULL,
  "fixtureType" "PlumbingFixtureType" NOT NULL,
  "system" "PlumbingSystemType" NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "diameterMm" DECIMAL(6,2) NOT NULL,
  "oneWayRouteM" DECIMAL(10,2) NOT NULL,
  "notes" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlumbingFixtureTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanningCoefficient" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "materialKey" TEXT NOT NULL,
  "stageId" TEXT,
  "applicableBuildingUse" TEXT,
  "applicableStructureSystem" TEXT,
  "regionalProfileId" TEXT,
  "unit" TEXT NOT NULL,
  "minValue" DECIMAL(18,6) NOT NULL,
  "maxValue" DECIMAL(18,6) NOT NULL,
  "value" DECIMAL(18,6) NOT NULL,
  "sensitivityLow" DECIMAL(18,6),
  "sensitivityHigh" DECIMAL(18,6),
  "rationale" TEXT NOT NULL,
  "sourceReference" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "effectiveDate" TIMESTAMP(3),
  "reviewDate" TIMESTAMP(3),
  "expiryDate" TIMESTAMP(3),
  "status" "PlanningCoefficientStatus" NOT NULL DEFAULT 'DRAFT',
  "createdById" TEXT,
  "approvedById" TEXT,
  "publishedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlanningCoefficient_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RegionalProfile_code_key" ON "RegionalProfile"("code");
CREATE INDEX "RegionalProfile_active_state_city_idx" ON "RegionalProfile"("active", "state", "city");
CREATE UNIQUE INDEX "RoomTemplate_code_key" ON "RoomTemplate"("code");
CREATE INDEX "RoomTemplate_roomType_status_idx" ON "RoomTemplate"("roomType", "status");
CREATE INDEX "RoomTemplate_regionalProfileId_roomType_status_idx" ON "RoomTemplate"("regionalProfileId", "roomType", "status");
CREATE INDEX "ElectricalPointTemplate_roomTemplateId_pointType_idx" ON "ElectricalPointTemplate"("roomTemplateId", "pointType");
CREATE INDEX "PlumbingFixtureTemplate_roomTemplateId_fixtureType_system_idx" ON "PlumbingFixtureTemplate"("roomTemplateId", "fixtureType", "system");
CREATE UNIQUE INDEX "PlanningCoefficient_code_version_key" ON "PlanningCoefficient"("code", "version");
CREATE INDEX "PlanningCoefficient_materialKey_status_idx" ON "PlanningCoefficient"("materialKey", "status");
CREATE INDEX "PlanningCoefficient_regionalProfileId_status_idx" ON "PlanningCoefficient"("regionalProfileId", "status");
CREATE INDEX "PlanningCoefficient_stageId_status_idx" ON "PlanningCoefficient"("stageId", "status");

ALTER TABLE "RoomTemplate" ADD CONSTRAINT "RoomTemplate_regionalProfileId_fkey" FOREIGN KEY ("regionalProfileId") REFERENCES "RegionalProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoomTemplate" ADD CONSTRAINT "RoomTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoomTemplate" ADD CONSTRAINT "RoomTemplate_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ElectricalPointTemplate" ADD CONSTRAINT "ElectricalPointTemplate_roomTemplateId_fkey" FOREIGN KEY ("roomTemplateId") REFERENCES "RoomTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlumbingFixtureTemplate" ADD CONSTRAINT "PlumbingFixtureTemplate_roomTemplateId_fkey" FOREIGN KEY ("roomTemplateId") REFERENCES "RoomTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanningCoefficient" ADD CONSTRAINT "PlanningCoefficient_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlanningCoefficient" ADD CONSTRAINT "PlanningCoefficient_regionalProfileId_fkey" FOREIGN KEY ("regionalProfileId") REFERENCES "RegionalProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlanningCoefficient" ADD CONSTRAINT "PlanningCoefficient_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlanningCoefficient" ADD CONSTRAINT "PlanningCoefficient_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlanningCoefficient" ADD CONSTRAINT "PlanningCoefficient_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DO $$
DECLARE
  table_name text;
  private_tables text[] := ARRAY['RegionalProfile', 'RoomTemplate', 'ElectricalPointTemplate', 'PlumbingFixtureTemplate', 'PlanningCoefficient'];
BEGIN
  FOREACH table_name IN ARRAY private_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon', table_name);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM authenticated', table_name);
  END LOOP;
END $$;
