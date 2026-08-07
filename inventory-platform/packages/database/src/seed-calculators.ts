import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
  CalculatorDefinitionStatus,
  CalculatorQualityTier,
  CalculatorType,
  CalculatorVersionStatus,
  PrismaClient,
  ProductStatus,
  VariantStatus,
} from './../generated/client';

const disclaimer = 'This quantity estimate is for preliminary planning. Actual requirements can vary with design, site conditions, workmanship and material specifications. Confirm final quantities with a qualified contractor, architect or engineer.';

type DemoMaterial = {
  key: string;
  name: string;
  category: string;
  categorySlug: string;
  formulaUnit: string;
  purchaseUnit: string;
  price: number;
  packageSize?: number;
  specifications: string[];
};

const demoMaterials: Record<string, DemoMaterial> = {
  cement: { key: 'cement', name: 'Buildanta Calculator Cement — 50 kg', category: 'Cement & Structure', categorySlug: 'cement-structure', formulaUnit: 'bag', purchaseUnit: 'bag', price: 410, packageSize: 1, specifications: ['50 kg bag', 'Demo catalogue mapping', 'Final grade to be confirmed in quotation'] },
  sand: { key: 'sand', name: 'Buildanta Calculator Construction Sand', category: 'Cement & Structure', categorySlug: 'cement-structure', formulaUnit: 'm3', purchaseUnit: 'm3', price: 1650, specifications: ['Sold by cubic metre', 'Demo catalogue mapping', 'Source and grading confirmed in quotation'] },
  aggregate: { key: 'aggregate', name: 'Buildanta Calculator 20 mm Aggregate', category: 'Cement & Structure', categorySlug: 'cement-structure', formulaUnit: 'm3', purchaseUnit: 'm3', price: 1900, specifications: ['20 mm nominal size', 'Sold by cubic metre', 'Demo catalogue mapping'] },
  bricks: { key: 'bricks', name: 'Buildanta Calculator Red Clay Bricks', category: 'Bricks & Blocks', categorySlug: 'bricks-blocks', formulaUnit: 'piece', purchaseUnit: 'piece', price: 11, specifications: ['Standard planning size', 'Sold per piece', 'Demo catalogue mapping'] },
  aac_blocks: { key: 'aac_blocks', name: 'Buildanta Calculator AAC Blocks', category: 'Bricks & Blocks', categorySlug: 'bricks-blocks', formulaUnit: 'piece', purchaseUnit: 'piece', price: 68, specifications: ['Standard planning size', 'Sold per piece', 'Demo catalogue mapping'] },
  aac_block_adhesive: { key: 'aac_block_adhesive', name: 'Buildanta Calculator AAC Block Adhesive', category: 'Bricks & Blocks', categorySlug: 'bricks-blocks', formulaUnit: 'kg', purchaseUnit: 'bag', price: 650, packageSize: 20, specifications: ['20 kg bag', 'Thin-bed AAC block adhesive', 'Coverage confirmed from selected product'] },
  tiles: { key: 'tiles', name: 'Buildanta Calculator Floor Tile 600 × 600 mm', category: 'Tiles & Flooring', categorySlug: 'tiles-flooring', formulaUnit: 'piece', purchaseUnit: 'piece', price: 145, specifications: ['600 × 600 mm', 'Standard finish', 'Demo catalogue mapping'] },
  floor_tiles: { key: 'floor_tiles', name: 'Buildanta Calculator Floor Tile 600 × 600 mm', category: 'Tiles & Flooring', categorySlug: 'tiles-flooring', formulaUnit: 'piece', purchaseUnit: 'piece', price: 145, specifications: ['600 × 600 mm floor tile', 'Standard finish', 'Demo catalogue mapping'] },
  wall_tiles: { key: 'wall_tiles', name: 'Buildanta Calculator Wall Tile 600 × 600 mm', category: 'Tiles & Flooring', categorySlug: 'tiles-flooring', formulaUnit: 'piece', purchaseUnit: 'piece', price: 125, specifications: ['600 × 600 mm wall tile', 'Standard finish', 'Demo catalogue mapping'] },
  tile_adhesive: { key: 'tile_adhesive', name: 'Buildanta Calculator Tile Adhesive', category: 'Tiles & Flooring', categorySlug: 'tiles-flooring', formulaUnit: 'kg', purchaseUnit: 'bag', price: 760, packageSize: 20, specifications: ['20 kg bag', 'Indoor floor application', 'Demo catalogue mapping'] },
  grout: { key: 'grout', name: 'Buildanta Calculator Tile Grout', category: 'Tiles & Flooring', categorySlug: 'tiles-flooring', formulaUnit: 'kg', purchaseUnit: 'pack', price: 120, packageSize: 1, specifications: ['1 kg pack', 'Standard colour', 'Demo catalogue mapping'] },
  paint: { key: 'paint', name: 'Buildanta Calculator Interior Emulsion', category: 'Paints', categorySlug: 'paints', formulaUnit: 'litre', purchaseUnit: 'bucket', price: 6400, packageSize: 20, specifications: ['20 litre bucket', 'Standard interior finish', 'Demo catalogue mapping'] },
  primer: { key: 'primer', name: 'Buildanta Calculator Wall Primer', category: 'Paints', categorySlug: 'paints', formulaUnit: 'litre', purchaseUnit: 'bucket', price: 3800, packageSize: 20, specifications: ['20 litre bucket', 'Interior wall primer', 'Demo catalogue mapping'] },
  putty: { key: 'putty', name: 'Buildanta Calculator Wall Putty', category: 'Paints', categorySlug: 'paints', formulaUnit: 'kg', purchaseUnit: 'bag', price: 840, packageSize: 20, specifications: ['20 kg bag', 'White cement based putty', 'Demo catalogue mapping'] },
  tmt_rebar: { key: 'tmt_rebar', name: 'Buildanta Calculator Fe500 TMT Steel', category: 'Steel & TMT', categorySlug: 'steel-tmt', formulaUnit: 'kg', purchaseUnit: 'kg', price: 65, specifications: ['Fe500 planning grade', 'Sold by kilogram', 'Final bar schedule requires structural-engineer approval'] },
  electrical_wire: { key: 'electrical_wire', name: 'Buildanta Calculator FR Copper Wire - 100 m', category: 'Electrical', categorySlug: 'electrical', formulaUnit: 'm', purchaseUnit: 'coil', price: 5200, packageSize: 100, specifications: ['100 metre coil', 'Flame-retardant copper wire', 'Cable size confirmed from electrical drawings'] },
  pvc_conduit: { key: 'pvc_conduit', name: 'Buildanta Calculator Heavy PVC Conduit - 3 m', category: 'Electrical', categorySlug: 'electrical', formulaUnit: 'm', purchaseUnit: 'length', price: 180, packageSize: 3, specifications: ['3 metre length', 'Heavy-duty PVC conduit', 'Diameter confirmed from electrical drawings'] },
  plumbing_pipe: { key: 'plumbing_pipe', name: 'Buildanta Calculator Plumbing Pipe - 3 m', category: 'Plumbing & Sanitary', categorySlug: 'plumbing-sanitary', formulaUnit: 'm', purchaseUnit: 'length', price: 450, packageSize: 3, specifications: ['3 metre length', 'Demonstration water and drainage allowance', 'Pipe type and diameter confirmed from plumbing drawings'] },
  // v3 point/route-based electrical and plumbing output keys (formula-registry.ts groupElectricalPoints/groupPlumbingRoutes).
  // Sizes below match what seed-planning-templates.ts's RoomTemplates actually produce; a new conductor size or pipe
  // diameter introduced in a future template needs a matching entry here or that output line will show "Request price".
  electrical_wire_1p5sqmm: { key: 'electrical_wire_1p5sqmm', name: 'Buildanta Calculator 1.5 sqmm FR Copper Wire - 90 m', category: 'Electrical', categorySlug: 'electrical', formulaUnit: 'm', purchaseUnit: 'coil', price: 1250, packageSize: 90, specifications: ['90 metre coil', '1.5 sqmm flame-retardant copper wire', 'Lighting/fan circuit planning grade'] },
  electrical_wire_2p5sqmm: { key: 'electrical_wire_2p5sqmm', name: 'Buildanta Calculator 2.5 sqmm FR Copper Wire - 90 m', category: 'Electrical', categorySlug: 'electrical', formulaUnit: 'm', purchaseUnit: 'coil', price: 1950, packageSize: 90, specifications: ['90 metre coil', '2.5 sqmm flame-retardant copper wire', 'Socket circuit planning grade'] },
  electrical_wire_4sqmm: { key: 'electrical_wire_4sqmm', name: 'Buildanta Calculator 4 sqmm FR Copper Wire - 90 m', category: 'Electrical', categorySlug: 'electrical', formulaUnit: 'm', purchaseUnit: 'coil', price: 3100, packageSize: 90, specifications: ['90 metre coil', '4 sqmm flame-retardant copper wire', 'AC/geyser dedicated-circuit planning grade'] },
  electrical_earth_wire_1p5sqmm: { key: 'electrical_earth_wire_1p5sqmm', name: 'Buildanta Calculator 1.5 sqmm Earth Continuity Wire - 90 m', category: 'Electrical', categorySlug: 'electrical', formulaUnit: 'm', purchaseUnit: 'coil', price: 1200, packageSize: 90, specifications: ['90 metre coil', '1.5 sqmm earth continuity conductor', 'Demo catalogue mapping'] },
  electrical_earth_wire_2p5sqmm: { key: 'electrical_earth_wire_2p5sqmm', name: 'Buildanta Calculator 2.5 sqmm Earth Continuity Wire - 90 m', category: 'Electrical', categorySlug: 'electrical', formulaUnit: 'm', purchaseUnit: 'coil', price: 1850, packageSize: 90, specifications: ['90 metre coil', '2.5 sqmm earth continuity conductor', 'Demo catalogue mapping'] },
  electrical_earth_wire_4sqmm: { key: 'electrical_earth_wire_4sqmm', name: 'Buildanta Calculator 4 sqmm Earth Continuity Wire - 90 m', category: 'Electrical', categorySlug: 'electrical', formulaUnit: 'm', purchaseUnit: 'coil', price: 2950, packageSize: 90, specifications: ['90 metre coil', '4 sqmm earth continuity conductor', 'Demo catalogue mapping'] },
  plumbing_cold_water_15mm: { key: 'plumbing_cold_water_15mm', name: 'Buildanta Calculator 15 mm CPVC Cold Water Pipe - 3 m', category: 'Plumbing & Sanitary', categorySlug: 'plumbing-sanitary', formulaUnit: 'm', purchaseUnit: 'length', price: 210, packageSize: 3, specifications: ['3 metre length', '15 mm CPVC cold-water supply pipe', 'Demo catalogue mapping'] },
  plumbing_hot_water_15mm: { key: 'plumbing_hot_water_15mm', name: 'Buildanta Calculator 15 mm CPVC Hot Water Pipe - 3 m', category: 'Plumbing & Sanitary', categorySlug: 'plumbing-sanitary', formulaUnit: 'm', purchaseUnit: 'length', price: 320, packageSize: 3, specifications: ['3 metre length', '15 mm CPVC hot-water supply pipe', 'Demo catalogue mapping'] },
  plumbing_waste_32mm: { key: 'plumbing_waste_32mm', name: 'Buildanta Calculator 32 mm UPVC Waste Pipe - 3 m', category: 'Plumbing & Sanitary', categorySlug: 'plumbing-sanitary', formulaUnit: 'm', purchaseUnit: 'length', price: 180, packageSize: 3, specifications: ['3 metre length', '32 mm UPVC waste pipe', 'Demo catalogue mapping'] },
  plumbing_waste_40mm: { key: 'plumbing_waste_40mm', name: 'Buildanta Calculator 40 mm UPVC Waste Pipe - 3 m', category: 'Plumbing & Sanitary', categorySlug: 'plumbing-sanitary', formulaUnit: 'm', purchaseUnit: 'length', price: 230, packageSize: 3, specifications: ['3 metre length', '40 mm UPVC waste pipe', 'Demo catalogue mapping'] },
  plumbing_waste_50mm: { key: 'plumbing_waste_50mm', name: 'Buildanta Calculator 50 mm UPVC Waste Pipe - 3 m', category: 'Plumbing & Sanitary', categorySlug: 'plumbing-sanitary', formulaUnit: 'm', purchaseUnit: 'length', price: 280, packageSize: 3, specifications: ['3 metre length', '50 mm UPVC floor-drain waste pipe', 'Demo catalogue mapping'] },
  plumbing_soil_110mm: { key: 'plumbing_soil_110mm', name: 'Buildanta Calculator 110 mm UPVC Soil Pipe - 3 m', category: 'Plumbing & Sanitary', categorySlug: 'plumbing-sanitary', formulaUnit: 'm', purchaseUnit: 'length', price: 650, packageSize: 3, specifications: ['3 metre length', '110 mm UPVC soil/waste stack pipe', 'Demo catalogue mapping'] },
  sanitary_fixture_set: { key: 'sanitary_fixture_set', name: 'Buildanta Calculator Bathroom Fixture Set', category: 'Sanitaryware & Bathware', categorySlug: 'sanitaryware-bathware', formulaUnit: 'set', purchaseUnit: 'set', price: 18500, specifications: ['One planning set per bathroom', 'WC and wash-basin allowance', 'Models and fittings confirmed in quotation'] },
  doors: { key: 'doors', name: 'Buildanta Calculator Internal Door Set', category: 'Doors & Windows', categorySlug: 'doors-windows', formulaUnit: 'piece', purchaseUnit: 'piece', price: 12000, specifications: ['Door and frame planning set', 'Demonstration standard size', 'Material and hardware confirmed in quotation'] },
  windows: { key: 'windows', name: 'Buildanta Calculator Window Set', category: 'Doors & Windows', categorySlug: 'doors-windows', formulaUnit: 'piece', purchaseUnit: 'piece', price: 8000, specifications: ['Window and frame planning set', 'Demonstration standard size', 'Opening size and glazing confirmed in quotation'] },
};

const calculators = [
  {
    name: 'Cement and concrete calculator', slug: 'cement-concrete', type: CalculatorType.CEMENT_CONCRETE, formulaKey: 'cement-concrete-v1', version: 2, sortOrder: 10,
    description: 'Estimate cement bags, sand and aggregate for slabs, beams, columns and other concrete work.',
    instructions: 'Enter finished dimensions in metres. Results use Buildanta\'s versioned preliminary planning profile and remain independent of product prices or stock.',
    configuration: { profileName: 'Buildanta preliminary concrete planning profile', dryVolumeFactor: 1.54, cementPart: 1, sandPart: 1.5, aggregatePart: 3, cementDensityKgM3: 1440, cementBagKg: 50 },
    outputs: [{ key: 'cement', terms: ['cement'] }, { key: 'sand', terms: ['sand'] }, { key: 'aggregate', terms: ['aggregate', 'stone chips'] }],
  },
  {
    name: 'Bricks and AAC blocks calculator', slug: 'bricks-blocks', type: CalculatorType.BRICKS_BLOCKS, formulaKey: 'bricks-blocks-v2', version: 3, sortOrder: 20,
    description: 'Estimate bricks or AAC blocks plus preliminary mortar materials after openings and wastage.',
    instructions: 'Measure the complete wall face and subtract doors, windows and other openings.',
    configuration: {
      BRICK: { unitLengthM: 0.19, unitHeightM: 0.09, unitWidthM: 0.09, mortarJointM: 0.01, mortarDryVolumePerM3: 0.25, mortarCementPart: 1, mortarSandPart: 6, cementDensityKgM3: 1440, cementBagKg: 50 },
      AAC_BLOCK: { unitLengthM: 0.6, unitHeightM: 0.2, unitWidthM: 0.1, jointM: 0.003, adhesiveKgPerM2: 4 },
    },
    outputs: [{ key: 'bricks', terms: ['brick'] }, { key: 'aac_blocks', terms: ['aac block'] }, { key: 'aac_block_adhesive', terms: ['aac adhesive', 'block adhesive'] }, { key: 'cement', terms: ['cement'] }, { key: 'sand', terms: ['sand'] }],
  },
  {
    name: 'Tiles and flooring calculator', slug: 'tiles-flooring', type: CalculatorType.TILES_FLOORING, formulaKey: 'tiles-flooring-v2', version: 3, sortOrder: 30,
    description: 'Estimate tile pieces, adhesive and grout for floors or walls with managed wastage.',
    instructions: 'Enter surface and tile dimensions using metres. Confirm pieces per box on the selected product.',
    configuration: { FLOOR: { adhesiveKgPerM2: 4, groutKgPerM2: 0.25 }, WALL: { adhesiveKgPerM2: 5, groutKgPerM2: 0.3 } },
    outputs: [{ key: 'floor_tiles', terms: ['floor tile', 'flooring'] }, { key: 'wall_tiles', terms: ['wall tile'] }, { key: 'tile_adhesive', terms: ['tile adhesive', 'adhesive'] }, { key: 'grout', terms: ['grout'] }],
  },
  {
    name: 'Paint calculator', slug: 'paint', type: CalculatorType.PAINT, formulaKey: 'paint-v1', version: 2, sortOrder: 40,
    description: 'Estimate finish paint, primer and wall putty for rooms and ceilings.',
    instructions: 'Enter room dimensions, openings and the planned number of coats.',
    configuration: { paintCoverageM2PerLitrePerCoat: 10, primerCoverageM2PerLitrePerCoat: 12, puttyCoverageM2PerKgPerCoat: 8 },
    outputs: [{ key: 'paint', terms: ['paint', 'emulsion'] }, { key: 'primer', terms: ['primer'] }, { key: 'putty', terms: ['putty'] }],
  },
  {
    name: 'Get full construction material info', slug: 'complete-construction-material', type: CalculatorType.BUILDING_BUDGET, formulaKey: 'building-material-budget-v3', version: 4, sortOrder: 5,
    description: 'Create a refined stage-wise BOQ from project area, floors, rooms, structural system, floor height, finish coverage and construction scope.',
    instructions: 'Enter the built-up area for one floor, project type, structural system, floor height, required scope and (optionally) a room breakdown. Electrical and plumbing quantities are derived from a point/fixture schedule instead of a per-sqft allowance; supply a roomBreakdown or explicit electricalPoints/plumbingFixtures to include them.',
    configuration: {
      profileName: 'Buildanta preliminary residential planning profile',
      squareFeetPerSquareMetre: 10.7639,
      scopeRates: {
        FOUNDATION: { cementBagsPerSqFt: 0.18, sandM3PerSqFt: 0.01, aggregateM3PerSqFt: 0.014, tmtKgPerSqFt: 1.5, brickPiecesPerSqFt: 0 },
        STRUCTURE: { cementBagsPerSqFt: 0.4, sandM3PerSqFt: 0.021, aggregateM3PerSqFt: 0.018, tmtKgPerSqFt: 3.8, brickPiecesPerSqFt: 7.5 },
        FULL_FINISH: { cementBagsPerSqFt: 0.44, sandM3PerSqFt: 0.023, aggregateM3PerSqFt: 0.019, tmtKgPerSqFt: 4, brickPiecesPerSqFt: 7.5 },
      },
      fullFinish: {
        tileCoverageRatio: 0.7, tileAreaSqFtPerPiece: 3.875, adhesiveKgPerM2: 4, groutKgPerM2: 0.25,
        paintableAreaFactor: 3.2, paintCoverageM2PerLitrePerCoat: 10, primerCoverageM2PerLitrePerCoat: 12,
        puttyCoverageM2PerKgPerCoat: 8, paintCoats: 2, primerCoats: 1, puttyCoats: 2,
        doorsPerRoom: 1, entranceDoors: 1, windowsPerRoom: 0.8,
      },
      refinement: {
        baselineFloorHeightFt: 10,
        foundationAdditionalFloorLoadFactor: 0.2,
        ceilingPaintAreaFactor: 1,
        projectTypeMultipliers: { RESIDENTIAL: 1, COMMERCIAL: 1.08 },
        structureSystemMultipliers: {
          RCC_FRAME: { cementBagsPerSqFt: 1, sandM3PerSqFt: 1, aggregateM3PerSqFt: 1, tmtKgPerSqFt: 1, brickPiecesPerSqFt: 1 },
          LOAD_BEARING: { cementBagsPerSqFt: 0.92, sandM3PerSqFt: 1.08, aggregateM3PerSqFt: 0.78, tmtKgPerSqFt: 0.62, brickPiecesPerSqFt: 1.18 },
        },
      },
    },
    outputs: [
      { key: 'cement', terms: ['cement'] }, { key: 'sand', terms: ['sand'] }, { key: 'aggregate', terms: ['aggregate'] },
      { key: 'tmt_rebar', terms: ['tmt', 'steel'] }, { key: 'bricks', terms: ['bricks'] }, { key: 'tiles', terms: ['tiles'] },
      { key: 'tile_adhesive', terms: ['tile adhesive'] }, { key: 'grout', terms: ['grout'] }, { key: 'paint', terms: ['paint'] },
      { key: 'primer', terms: ['primer'] }, { key: 'putty', terms: ['putty'] }, { key: 'sanitary_fixture_set', terms: ['sanitary'] },
      { key: 'doors', terms: ['door'] }, { key: 'windows', terms: ['window'] },
      { key: 'electrical_wire_1p5sqmm', terms: ['1.5 sqmm wire'] }, { key: 'electrical_wire_2p5sqmm', terms: ['2.5 sqmm wire'] }, { key: 'electrical_wire_4sqmm', terms: ['4 sqmm wire'] },
      { key: 'electrical_earth_wire_1p5sqmm', terms: ['1.5 sqmm earth wire'] }, { key: 'electrical_earth_wire_2p5sqmm', terms: ['2.5 sqmm earth wire'] }, { key: 'electrical_earth_wire_4sqmm', terms: ['4 sqmm earth wire'] },
      { key: 'plumbing_cold_water_15mm', terms: ['15mm cold water pipe'] }, { key: 'plumbing_hot_water_15mm', terms: ['15mm hot water pipe'] },
      { key: 'plumbing_waste_32mm', terms: ['32mm waste pipe'] }, { key: 'plumbing_waste_40mm', terms: ['40mm waste pipe'] }, { key: 'plumbing_waste_50mm', terms: ['50mm waste pipe'] },
      { key: 'plumbing_soil_110mm', terms: ['110mm soil pipe'] },
    ],
  },
];

const tierPriceMultipliers: Record<CalculatorQualityTier, number> = {
  [CalculatorQualityTier.ECONOMY]: 0.9,
  [CalculatorQualityTier.STANDARD]: 1,
  [CalculatorQualityTier.PREMIUM]: 1.2,
};

async function ensureDemoProduct(prisma: PrismaClient, material: DemoMaterial, qualityTier: CalculatorQualityTier) {
  const tierLabel = qualityTier.charAt(0) + qualityTier.slice(1).toLowerCase();
  const tierSuffix = qualityTier === CalculatorQualityTier.STANDARD ? '' : `-${qualityTier}`;
  const sku = `DEMO-CALC-${material.key.toUpperCase()}${tierSuffix}`;
  const tierPrice = Math.round(material.price * tierPriceMultipliers[qualityTier] * 100) / 100;
  const productName = `${material.name} - ${tierLabel}`;
  const brand = await prisma.brand.upsert({
    where: { slug: 'buildanta-calculator-demo' },
    update: { name: 'Buildanta Calculator Demo' },
    create: { name: 'Buildanta Calculator Demo', slug: 'buildanta-calculator-demo', description: 'Clearly identified demonstration products used to verify calculator-to-quotation workflows.' },
  });
  const supplier = await prisma.supplier.upsert({
    where: { email: 'calculator-demo@buildanta.invalid' },
    update: { name: 'Buildanta Calculator Demo Supplier' },
    create: { name: 'Buildanta Calculator Demo Supplier', email: 'calculator-demo@buildanta.invalid', contactInfo: 'Demonstration record — replace before production.' },
  });
  const category = await prisma.category.upsert({
    where: { slug: material.categorySlug },
    update: { published: true },
    create: { name: material.category, slug: material.categorySlug, published: true, description: `Construction materials in ${material.category}.` },
  });
  const existing = await prisma.productVariant.findUnique({ where: { sku }, include: { product: true } });
  if (existing) {
    const product = await prisma.product.update({
      where: { id: existing.productId },
      data: { name: productName, keySpecifications: [...material.specifications, `${tierLabel} calculator tier`], sellingPrice: tierPrice, unit: material.purchaseUnit, brandId: brand.id, status: ProductStatus.PUBLISHED, categories: { connect: { id: category.id } } },
    });
    const variant = await prisma.productVariant.update({
      where: { id: existing.id },
      data: { price: tierPrice, unit: material.purchaseUnit, attributes: { calculatorDemo: true, qualityTier, packageSize: material.packageSize ?? 1 }, status: VariantStatus.ACTIVE, supplierId: supplier.id },
    });
    return { product, variant };
  }
  const product = await prisma.product.create({
    data: {
      name: productName,
      description: 'DEMO product used for end-to-end calculator verification. Replace or remap this item from Inventory before production.',
      keySpecifications: [...material.specifications, `${tierLabel} calculator tier`],
      brandId: brand.id,
      sellingPrice: tierPrice,
      gstPercent: 18,
      unit: material.purchaseUnit,
      minimumOrderQuantity: 1,
      deliveryInfo: 'Availability and delivery are confirmed after PIN-code review.',
      returnEligible: false,
      status: ProductStatus.PUBLISHED,
      publishedAt: new Date(),
      categories: { connect: { id: category.id } },
      variants: {
        create: {
          sku,
          price: tierPrice,
          attributes: { calculatorDemo: true, qualityTier, packageSize: material.packageSize ?? 1 },
          unit: material.purchaseUnit,
          minimumOrderQuantity: 1,
          stockTracked: false,
          status: VariantStatus.ACTIVE,
          supplierId: supplier.id,
        },
      },
    },
    include: { variants: true },
  });
  const variant = product.variants[0];
  if (!variant) throw new Error(`Failed to create calculator demo variant ${sku}`);
  return { product, variant };
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL environment variable is not set');
  const includeDemoCatalogue = process.env.ALLOW_DEMO_SEED === 'I_UNDERSTAND';
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    for (const config of calculators) {
      const definition = await prisma.calculatorDefinition.upsert({
        where: { slug: config.slug },
        update: { name: config.name, type: config.type, description: config.description, instructions: config.instructions, disclaimer, status: CalculatorDefinitionStatus.PUBLISHED, sortOrder: config.sortOrder },
        create: { name: config.name, slug: config.slug, type: config.type, description: config.description, instructions: config.instructions, disclaimer, status: CalculatorDefinitionStatus.PUBLISHED, sortOrder: config.sortOrder },
      });
      const version = await prisma.calculatorVersion.upsert({
        where: { definitionId_version: { definitionId: definition.id, version: config.version } },
        update: { formulaKey: config.formulaKey, configuration: config.configuration, status: CalculatorVersionStatus.PUBLISHED, effectiveFrom: new Date('2026-08-04T12:00:00.000Z'), publishedAt: new Date('2026-08-04T12:00:00.000Z') },
        create: { definitionId: definition.id, version: config.version, formulaKey: config.formulaKey, configuration: config.configuration, status: CalculatorVersionStatus.PUBLISHED, effectiveFrom: new Date('2026-08-04T12:00:00.000Z'), publishedAt: new Date('2026-08-04T12:00:00.000Z') },
      });
      await prisma.calculatorVersion.updateMany({
        where: { definitionId: definition.id, id: { not: version.id }, status: CalculatorVersionStatus.PUBLISHED },
        data: { status: CalculatorVersionStatus.RETIRED },
      });
      if (includeDemoCatalogue) {
        for (const [priority, output] of config.outputs.entries()) {
          const material = demoMaterials[output.key];
          if (!material) throw new Error(`Missing deliberate demo mapping for calculator output ${output.key}`);
          for (const qualityTier of Object.values(CalculatorQualityTier)) {
            const match = await ensureDemoProduct(prisma, material, qualityTier);
            await prisma.calculatorProductMapping.upsert({
              where: { calculatorVersionId_outputKey_qualityTier_priority: { calculatorVersionId: version.id, outputKey: output.key, qualityTier, priority: 0 } },
              update: { productId: match.product.id, variantId: match.variant.id, expectedUnit: material.formulaUnit, conversionFactor: 1, packageSize: material.packageSize, preferred: true, active: true },
              create: { calculatorVersionId: version.id, outputKey: output.key, qualityTier, productId: match.product.id, variantId: match.variant.id, expectedUnit: material.formulaUnit, conversionFactor: 1, packageSize: material.packageSize, priority: 0, preferred: true },
            });
          }
          void priority;
        }
      }
    }
    console.log(includeDemoCatalogue
      ? 'Calculator formulas and explicitly requested demo catalogue mappings completed.'
      : 'Quantity-first calculator formulas published without requiring catalogue mappings.');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
