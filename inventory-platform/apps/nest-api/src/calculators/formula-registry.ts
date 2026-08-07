import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

const positive = z.number().finite().positive().max(100_000);
const nonnegative = z.number().finite().nonnegative().max(100_000_000);
const wastage = z.number().finite().min(0).max(20).default(5);

export type FormulaLine = {
  outputKey: string;
  description: string;
  group: string;
  rawQuantity: number;
  wastageQuantity: number;
  quantityWithWastage: number;
  unitCode: string;
};

export type FormulaResult = {
  normalizedInputs: Record<string, unknown>;
  lines: FormulaLine[];
  assumptions: string[];
};

type FormulaDefinition = {
  inputSchema: z.ZodTypeAny;
  configSchema: z.ZodTypeAny;
  run: (input: any, config: any) => FormulaResult;
};

function round(value: number, precision = 6) {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function line(outputKey: string, description: string, rawQuantity: number, wastagePercent: number, unitCode: string, group = 'Material requirement'): FormulaLine {
  const wastageQuantity = rawQuantity * (wastagePercent / 100);
  return {
    outputKey,
    description,
    group,
    rawQuantity: round(rawQuantity),
    wastageQuantity: round(wastageQuantity),
    quantityWithWastage: round(rawQuantity + wastageQuantity),
    unitCode,
  };
}

const electricalPointTypes = ['LIGHT_POINT', 'FAN_POINT', 'SOCKET_5A', 'SOCKET_15A', 'SOCKET_20A_AC', 'SOCKET_20A_GEYSER', 'TV_POINT', 'DATA_POINT', 'DOORBELL', 'EXHAUST_FAN_POINT', 'DB_FEEDER', 'OTHER'] as const;
const electricalCircuitPurposes = ['LIGHTING', 'POWER_SOCKET', 'AC', 'GEYSER', 'KITCHEN_APPLIANCE', 'PUMP_MOTOR', 'DB_FEEDER', 'OTHER'] as const;
const plumbingFixtureTypes = ['WASH_BASIN', 'WC', 'SHOWER', 'BATHTUB', 'KITCHEN_SINK', 'UTILITY_SINK', 'FLOOR_DRAIN', 'HOSE_BIB', 'RAINWATER_OUTLET', 'OTHER'] as const;
const plumbingSystemTypes = ['COLD_WATER', 'HOT_WATER', 'SOIL', 'WASTE', 'VENT', 'RAINWATER'] as const;
const roomTypes = ['BEDROOM', 'LIVING_ROOM', 'KITCHEN', 'BATHROOM', 'TOILET', 'DINING_ROOM', 'STUDY', 'UTILITY', 'BALCONY', 'STAIRCASE', 'CORRIDOR', 'GARAGE', 'OTHER'] as const;

// Route/point-based electrical input. Conductor size and route length are always supplied by the
// caller (from an approved design) or a managed RoomTemplate — never derived from quality tier or floor area.
const electricalPointInputSchema = z.object({
  roomLabel: z.string().trim().max(120).optional(),
  pointType: z.enum(electricalPointTypes),
  purpose: z.enum(electricalCircuitPurposes).default('OTHER'),
  quantity: z.number().int().positive().max(1_000).default(1),
  oneWayRouteM: positive.max(200),
  numberOfConductors: z.number().int().min(1).max(6),
  earthConductorCount: z.number().int().min(0).max(3).default(1),
  conductorSizeSqmm: positive.max(400),
  earthConductorSizeSqmm: positive.max(400).optional(),
}).strict();

// Route-based plumbing input, grouped per (system, diameter) — diameter is always supplied, never
// derived from quality tier.
const plumbingRouteInputSchema = z.object({
  roomLabel: z.string().trim().max(120).optional(),
  fixtureType: z.enum(plumbingFixtureTypes),
  system: z.enum(plumbingSystemTypes),
  diameterMm: positive.max(300),
  quantity: z.number().int().positive().max(1_000).default(1),
  routeM: positive.max(200),
}).strict();

type ElectricalPointInput = z.infer<typeof electricalPointInputSchema>;
type PlumbingRouteInput = z.infer<typeof plumbingRouteInputSchema>;

// outputKey must match /^[a-z0-9_]+$/ (CalculatorProductMapping.outputKey) — no literal dots.
function sizeKey(value: number): string {
  return round(value, 3).toString().replace('.', 'p');
}

function groupElectricalPoints(points: ElectricalPointInput[], wastagePercent: number): FormulaLine[] {
  const conductorTotals = new Map<number, number>();
  const earthTotals = new Map<number, number>();
  for (const point of points) {
    const runLength = point.oneWayRouteM * point.quantity;
    conductorTotals.set(point.conductorSizeSqmm, (conductorTotals.get(point.conductorSizeSqmm) ?? 0) + runLength * point.numberOfConductors);
    if (point.earthConductorCount > 0) {
      const earthSize = point.earthConductorSizeSqmm ?? point.conductorSizeSqmm;
      earthTotals.set(earthSize, (earthTotals.get(earthSize) ?? 0) + runLength * point.earthConductorCount);
    }
  }
  const lines: FormulaLine[] = [];
  for (const [size, metres] of Array.from(conductorTotals.entries()).sort((a, b) => a[0] - b[0])) {
    lines.push(line(`electrical_wire_${sizeKey(size)}sqmm`, `${size} sqmm current-carrying conductor`, metres, wastagePercent, 'm', 'Electrical and plumbing'));
  }
  for (const [size, metres] of Array.from(earthTotals.entries()).sort((a, b) => a[0] - b[0])) {
    lines.push(line(`electrical_earth_wire_${sizeKey(size)}sqmm`, `${size} sqmm earth continuity conductor`, metres, wastagePercent, 'm', 'Electrical and plumbing'));
  }
  return lines;
}

function groupPlumbingRoutes(routes: PlumbingRouteInput[], wastagePercent: number): FormulaLine[] {
  const totals = new Map<string, { system: string; diameter: number; metres: number }>();
  for (const route of routes) {
    const key = `${route.system}:${route.diameterMm}`;
    const metres = route.routeM * route.quantity;
    const existing = totals.get(key);
    if (existing) existing.metres += metres;
    else totals.set(key, { system: route.system, diameter: route.diameterMm, metres });
  }
  const lines: FormulaLine[] = [];
  const grouped = Array.from(totals.values()).sort((a, b) => a.system.localeCompare(b.system) || a.diameter - b.diameter);
  for (const { system, diameter, metres } of grouped) {
    const systemKey = system.toLowerCase();
    const systemLabel = system.replaceAll('_', ' ').toLowerCase();
    lines.push(line(`plumbing_${systemKey}_${sizeKey(diameter)}mm`, `${systemLabel} pipe, ${diameter} mm`, metres, wastagePercent, 'm', 'Electrical and plumbing'));
  }
  return lines;
}

const concreteInputs = z.object({
  componentType: z.enum(['SLAB', 'FOOTING', 'BEAM', 'COLUMN', 'OTHER']).default('SLAB'),
  lengthM: positive,
  widthM: positive,
  thicknessM: positive.max(20),
  quantity: z.number().int().positive().max(10_000).default(1),
  wastagePercent: wastage,
}).strict();

const concreteConfig = z.object({
  profileName: z.string().trim().min(2).max(120),
  dryVolumeFactor: z.number().finite().min(1).max(2.5),
  cementPart: positive,
  sandPart: positive,
  aggregatePart: positive,
  cementDensityKgM3: z.number().finite().min(500).max(3_000),
  cementBagKg: z.number().finite().min(10).max(100),
}).strict();

const bricksInputs = z.object({
  material: z.enum(['BRICK', 'AAC_BLOCK']).default('BRICK'),
  wallLengthM: positive,
  wallHeightM: positive,
  wallThicknessM: positive.max(2),
  openingsAreaM2: nonnegative.default(0),
  quantity: z.number().int().positive().max(10_000).default(1),
  wastagePercent: wastage,
}).strict();

const bricksConfig = z.object({
  brickLengthM: positive.max(2),
  brickHeightM: positive.max(2),
  brickWidthM: positive.max(2),
  mortarJointM: z.number().finite().min(0).max(0.05),
  mortarDryVolumePerM3: z.number().finite().min(0).max(1),
  mortarCementPart: positive,
  mortarSandPart: positive,
  cementDensityKgM3: z.number().finite().min(500).max(3_000),
  cementBagKg: z.number().finite().min(10).max(100),
}).strict();

const bricksV2Config = z.object({
  BRICK: z.object({
    unitLengthM: positive.max(2),
    unitHeightM: positive.max(2),
    unitWidthM: positive.max(2),
    mortarJointM: z.number().finite().min(0).max(0.05),
    mortarDryVolumePerM3: z.number().finite().min(0).max(1),
    mortarCementPart: positive,
    mortarSandPart: positive,
    cementDensityKgM3: z.number().finite().min(500).max(3_000),
    cementBagKg: z.number().finite().min(10).max(100),
  }).strict(),
  AAC_BLOCK: z.object({
    unitLengthM: positive.max(2),
    unitHeightM: positive.max(2),
    unitWidthM: positive.max(2),
    jointM: z.number().finite().min(0).max(0.05),
    adhesiveKgPerM2: z.number().finite().positive().max(25),
  }).strict(),
}).strict();

const tilesInputs = z.object({
  surfaceType: z.enum(['FLOOR', 'WALL']).default('FLOOR'),
  lengthM: positive,
  widthM: positive,
  openingsAreaM2: nonnegative.default(0),
  tileLengthM: positive.max(5),
  tileWidthM: positive.max(5),
  quantity: z.number().int().positive().max(10_000).default(1),
  wastagePercent: wastage,
}).strict();

const tilesConfig = z.object({
  adhesiveKgPerM2: z.number().finite().min(0).max(100),
  groutKgPerM2: z.number().finite().min(0).max(20),
}).strict();

const tilesV2Config = z.object({
  FLOOR: z.object({
    adhesiveKgPerM2: z.number().finite().min(0).max(100),
    groutKgPerM2: z.number().finite().min(0).max(20),
  }).strict(),
  WALL: z.object({
    adhesiveKgPerM2: z.number().finite().min(0).max(100),
    groutKgPerM2: z.number().finite().min(0).max(20),
  }).strict(),
}).strict();

const paintInputs = z.object({
  roomLengthM: positive,
  roomWidthM: positive,
  wallHeightM: positive.max(30),
  openingsAreaM2: nonnegative.default(0),
  includeCeiling: z.boolean().default(false),
  paintCoats: z.number().int().min(1).max(5).default(2),
  primerCoats: z.number().int().min(0).max(3).default(1),
  puttyCoats: z.number().int().min(0).max(3).default(2),
  quantity: z.number().int().positive().max(1_000).default(1),
  wastagePercent: wastage,
}).strict();

const paintConfig = z.object({
  paintCoverageM2PerLitrePerCoat: positive,
  primerCoverageM2PerLitrePerCoat: positive,
  puttyCoverageM2PerKgPerCoat: positive,
}).strict();

const buildingBudgetShape = z.object({
  projectName: z.string().trim().min(2).max(120),
  siteLocation: z.string().trim().min(2).max(160),
  plotAreaSqFt: z.number().finite().positive().max(1_000_000),
  builtUpAreaSqFt: z.number().finite().positive().max(500_000),
  floors: z.number().int().min(1).max(20),
  rooms: z.number().int().min(1).max(200),
  bathrooms: z.number().int().min(0).max(100),
  kitchens: z.number().int().min(0).max(20),
  projectType: z.enum(['RESIDENTIAL', 'COMMERCIAL']).default('RESIDENTIAL'),
  structureSystem: z.enum(['RCC_FRAME', 'LOAD_BEARING']).default('RCC_FRAME'),
  floorHeightFt: z.number().finite().min(8).max(20).default(10),
  tileCoveragePercent: z.number().finite().min(0).max(100).default(70),
  includeCeilingPaint: z.boolean().default(false),
  constructionScope: z.enum(['FOUNDATION', 'STRUCTURE', 'FULL_FINISH']),
  wastagePercent: wastage,
});

function buildingBudgetAreaRefine(input: z.infer<typeof buildingBudgetShape>, context: z.RefinementCtx) {
  if (input.builtUpAreaSqFt > input.plotAreaSqFt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['builtUpAreaSqFt'], message: 'Built-up area per floor cannot be larger than the plot area.' });
  }
  if (input.builtUpAreaSqFt * input.floors > 5_000_000) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['floors'], message: 'Total built-up area is above the supported planning limit.' });
  }
}

const buildingBudgetInputs = buildingBudgetShape.strict().superRefine(buildingBudgetAreaRefine);

// v3 concept/detailed electrical & plumbing: `roomBreakdown` is resolved into `electricalPoints`/
// `plumbingFixtures` by the service layer (via managed RoomTemplates) before the pure formula runs;
// the formula itself never reads `roomBreakdown` directly, only the resolved arrays.
const buildingBudgetInputsV3 = buildingBudgetShape.extend({
  roomBreakdown: z.array(z.object({
    roomType: z.enum(roomTypes),
    quantity: z.number().int().positive().max(200),
  }).strict()).max(200).optional(),
  electricalPoints: z.array(electricalPointInputSchema).max(5_000).optional().default([]),
  plumbingFixtures: z.array(plumbingRouteInputSchema).max(5_000).optional().default([]),
}).strict().superRefine(buildingBudgetAreaRefine);

const buildingScopeRates = z.object({
  cementBagsPerSqFt: z.number().finite().min(0).max(5),
  sandM3PerSqFt: z.number().finite().min(0).max(1),
  aggregateM3PerSqFt: z.number().finite().min(0).max(1),
  tmtKgPerSqFt: z.number().finite().min(0).max(30),
  brickPiecesPerSqFt: z.number().finite().min(0).max(100),
}).strict();

const buildingMaterialMultipliers = z.object({
  cementBagsPerSqFt: z.number().finite().min(0.25).max(3),
  sandM3PerSqFt: z.number().finite().min(0.25).max(3),
  aggregateM3PerSqFt: z.number().finite().min(0.25).max(3),
  tmtKgPerSqFt: z.number().finite().min(0.25).max(3),
  brickPiecesPerSqFt: z.number().finite().min(0.25).max(3),
}).strict();

const buildingBudgetConfig = z.object({
  profileName: z.string().trim().min(2).max(160),
  squareFeetPerSquareMetre: z.number().finite().min(10).max(11),
  scopeRates: z.object({
    FOUNDATION: buildingScopeRates,
    STRUCTURE: buildingScopeRates,
    FULL_FINISH: buildingScopeRates,
  }).strict(),
  fullFinish: z.object({
    tileCoverageRatio: z.number().finite().min(0).max(2),
    tileAreaSqFtPerPiece: z.number().finite().positive().max(100),
    adhesiveKgPerM2: z.number().finite().min(0).max(100),
    groutKgPerM2: z.number().finite().min(0).max(20),
    paintableAreaFactor: z.number().finite().min(0).max(10),
    paintCoverageM2PerLitrePerCoat: positive,
    primerCoverageM2PerLitrePerCoat: positive,
    puttyCoverageM2PerKgPerCoat: positive,
    paintCoats: z.number().int().min(1).max(5),
    primerCoats: z.number().int().min(0).max(3),
    puttyCoats: z.number().int().min(0).max(3),
    electricalWireMPerSqFt: z.number().finite().min(0).max(20),
    conduitMPerSqFt: z.number().finite().min(0).max(10),
    plumbingPipeMPerSqFt: z.number().finite().min(0).max(10),
    plumbingPipeMPerBathroom: z.number().finite().min(0).max(200),
    doorsPerRoom: z.number().finite().min(0).max(5),
    entranceDoors: z.number().int().min(0).max(20),
    windowsPerRoom: z.number().finite().min(0).max(5),
  }).strict(),
  refinement: z.object({
    baselineFloorHeightFt: z.number().finite().min(8).max(15),
    foundationAdditionalFloorLoadFactor: z.number().finite().min(0).max(1).default(0.2),
    ceilingPaintAreaFactor: z.number().finite().min(0).max(2),
    projectTypeMultipliers: z.object({
      RESIDENTIAL: z.number().finite().min(0.5).max(2),
      COMMERCIAL: z.number().finite().min(0.5).max(2),
    }).strict(),
    structureSystemMultipliers: z.object({
      RCC_FRAME: buildingMaterialMultipliers,
      LOAD_BEARING: buildingMaterialMultipliers,
    }).strict(),
  }).strict().default({
    baselineFloorHeightFt: 10,
    foundationAdditionalFloorLoadFactor: 0.2,
    ceilingPaintAreaFactor: 1,
    projectTypeMultipliers: { RESIDENTIAL: 1, COMMERCIAL: 1 },
    structureSystemMultipliers: {
      RCC_FRAME: { cementBagsPerSqFt: 1, sandM3PerSqFt: 1, aggregateM3PerSqFt: 1, tmtKgPerSqFt: 1, brickPiecesPerSqFt: 1 },
      LOAD_BEARING: { cementBagsPerSqFt: 1, sandM3PerSqFt: 1, aggregateM3PerSqFt: 1, tmtKgPerSqFt: 1, brickPiecesPerSqFt: 1 },
    },
  }),
}).strict();

// Same shape as `buildingBudgetConfig.fullFinish` minus the four per-sqft electrical/plumbing rates
// that are the flaw being fixed — omitting them here means a future config edit can't silently
// reintroduce a "wire per square foot" number for v3.
const buildingBudgetFullFinishV3 = z.object({
  tileCoverageRatio: z.number().finite().min(0).max(2),
  tileAreaSqFtPerPiece: z.number().finite().positive().max(100),
  adhesiveKgPerM2: z.number().finite().min(0).max(100),
  groutKgPerM2: z.number().finite().min(0).max(20),
  paintableAreaFactor: z.number().finite().min(0).max(10),
  paintCoverageM2PerLitrePerCoat: positive,
  primerCoverageM2PerLitrePerCoat: positive,
  puttyCoverageM2PerKgPerCoat: positive,
  paintCoats: z.number().int().min(1).max(5),
  primerCoats: z.number().int().min(0).max(3),
  puttyCoats: z.number().int().min(0).max(3),
  doorsPerRoom: z.number().finite().min(0).max(5),
  entranceDoors: z.number().int().min(0).max(20),
  windowsPerRoom: z.number().finite().min(0).max(5),
}).strict();

const buildingBudgetConfigV3 = z.object({
  profileName: z.string().trim().min(2).max(160),
  squareFeetPerSquareMetre: z.number().finite().min(10).max(11),
  scopeRates: z.object({
    FOUNDATION: buildingScopeRates,
    STRUCTURE: buildingScopeRates,
    FULL_FINISH: buildingScopeRates,
  }).strict(),
  fullFinish: buildingBudgetFullFinishV3,
  refinement: buildingBudgetConfig.shape.refinement,
}).strict();

function runBuildingBudget(input: any, config: any, correctedScopeBasis: boolean, includeAreaBasedUtilities = true): FormulaResult {
  const totalBuiltUpAreaSqFt = input.builtUpAreaSqFt * input.floors;
  const rates = correctedScopeBasis && input.constructionScope === 'FULL_FINISH'
    ? config.scopeRates.STRUCTURE
    : config.scopeRates[input.constructionScope];
  const foundationLoadMultiplier = correctedScopeBasis
    ? 1 + Math.max(0, input.floors - 1) * config.refinement.foundationAdditionalFloorLoadFactor
    : input.floors;
  const coreAreaBasisSqFt = correctedScopeBasis && input.constructionScope === 'FOUNDATION'
    ? input.builtUpAreaSqFt * foundationLoadMultiplier
    : totalBuiltUpAreaSqFt;
  const projectMultiplier = config.refinement.projectTypeMultipliers[input.projectType];
  const systemMultipliers = config.refinement.structureSystemMultipliers[input.structureSystem];
  const heightMultiplier = input.floorHeightFt / config.refinement.baselineFloorHeightFt;
  const lines: FormulaLine[] = [
    line('cement', 'Cement', coreAreaBasisSqFt * rates.cementBagsPerSqFt * projectMultiplier * systemMultipliers.cementBagsPerSqFt, input.wastagePercent, 'bag', 'Foundation and structure'),
    line('sand', 'Construction sand', coreAreaBasisSqFt * rates.sandM3PerSqFt * projectMultiplier * systemMultipliers.sandM3PerSqFt, input.wastagePercent, 'm3', 'Foundation and structure'),
    line('aggregate', 'Coarse aggregate', coreAreaBasisSqFt * rates.aggregateM3PerSqFt * projectMultiplier * systemMultipliers.aggregateM3PerSqFt, input.wastagePercent, 'm3', 'Foundation and structure'),
    line('tmt_rebar', 'TMT reinforcement steel', coreAreaBasisSqFt * rates.tmtKgPerSqFt * projectMultiplier * systemMultipliers.tmtKgPerSqFt, input.wastagePercent, 'kg', 'Foundation and structure'),
  ];

  if (rates.brickPiecesPerSqFt > 0) {
    lines.push(line('bricks', 'Bricks for walls', totalBuiltUpAreaSqFt * rates.brickPiecesPerSqFt * projectMultiplier * systemMultipliers.brickPiecesPerSqFt * heightMultiplier, input.wastagePercent, 'piece', 'Structural shell'));
  }

  if (input.constructionScope === 'FULL_FINISH') {
    const finish = config.fullFinish;
    const tiledAreaSqFt = totalBuiltUpAreaSqFt * (input.tileCoveragePercent / 100);
    const tiledAreaM2 = tiledAreaSqFt / config.squareFeetPerSquareMetre;
    const ceilingPaintAreaSqFt = input.includeCeilingPaint ? totalBuiltUpAreaSqFt * config.refinement.ceilingPaintAreaFactor : 0;
    const paintableAreaSqFt = totalBuiltUpAreaSqFt * finish.paintableAreaFactor * heightMultiplier + ceilingPaintAreaSqFt;
    const paintableAreaM2 = paintableAreaSqFt / config.squareFeetPerSquareMetre;
    const doorCount = input.rooms * finish.doorsPerRoom + input.bathrooms + input.kitchens + finish.entranceDoors;
    const windowCount = Math.max(1, input.rooms * finish.windowsPerRoom);
    // v1/v2 keep the flat per-sqft electrical/plumbing/conduit allowance; v3 (includeAreaBasedUtilities:
    // false) omits it here and the caller appends point/route-based lines instead — see runBuildingBudgetV3.
    const areaBasedUtilityLines = includeAreaBasedUtilities
      ? [
          line('electrical_wire', 'Electrical copper wire allowance', totalBuiltUpAreaSqFt * finish.electricalWireMPerSqFt * projectMultiplier, input.wastagePercent, 'm', 'Electrical and plumbing'),
          line('pvc_conduit', 'Electrical PVC conduit allowance', totalBuiltUpAreaSqFt * finish.conduitMPerSqFt * projectMultiplier, input.wastagePercent, 'm', 'Electrical and plumbing'),
          line('plumbing_pipe', 'Water and drainage pipe allowance', (totalBuiltUpAreaSqFt * finish.plumbingPipeMPerSqFt + input.bathrooms * finish.plumbingPipeMPerBathroom) * projectMultiplier, input.wastagePercent, 'm', 'Electrical and plumbing'),
        ]
      : [];

    lines.push(
      line('tiles', 'Floor and wall tiles', tiledAreaSqFt / finish.tileAreaSqFtPerPiece, input.wastagePercent, 'piece', 'Flooring and finishes'),
      line('tile_adhesive', 'Tile adhesive', tiledAreaM2 * finish.adhesiveKgPerM2, input.wastagePercent, 'kg', 'Flooring and finishes'),
      line('grout', 'Tile grout', tiledAreaM2 * finish.groutKgPerM2, input.wastagePercent, 'kg', 'Flooring and finishes'),
      line('paint', 'Finish paint', paintableAreaM2 * finish.paintCoats / finish.paintCoverageM2PerLitrePerCoat, input.wastagePercent, 'litre', 'Painting system'),
      line('primer', 'Wall primer', paintableAreaM2 * finish.primerCoats / finish.primerCoverageM2PerLitrePerCoat, input.wastagePercent, 'litre', 'Painting system'),
      line('putty', 'Wall putty', paintableAreaM2 * finish.puttyCoats / finish.puttyCoverageM2PerKgPerCoat, input.wastagePercent, 'kg', 'Painting system'),
      ...areaBasedUtilityLines,
      line('sanitary_fixture_set', 'Bathroom sanitary fixture set', input.bathrooms, 0, 'set', 'Electrical and plumbing'),
      line('doors', 'Entrance and internal door allowance', doorCount, 0, 'piece', 'Doors and windows'),
      line('windows', 'Window allowance', windowCount, 0, 'piece', 'Doors and windows'),
    );
  }

  const scopeLabel = input.constructionScope === 'FOUNDATION'
    ? 'Foundation only'
    : input.constructionScope === 'STRUCTURE'
      ? 'Foundation and structural shell'
      : 'Full finished planning';
  const scopeBasisNote = correctedScopeBasis && input.constructionScope === 'FOUNDATION'
    ? `Foundation allowance uses the ${input.builtUpAreaSqFt} sq ft building footprint with a ${round(foundationLoadMultiplier, 3)} preliminary floor-load factor; it does not multiply foundation quantities by every floor.`
    : `${scopeLabel} uses ${round(totalBuiltUpAreaSqFt, 2)} sq ft total built-up area (${input.builtUpAreaSqFt} sq ft per floor x ${input.floors} floor(s)).`;
  return {
    normalizedInputs: { ...input, totalBuiltUpAreaSqFt, coreAreaBasisSqFt, projectMultiplier, heightMultiplier, foundationLoadMultiplier },
    lines,
    assumptions: [
      `${config.profileName} managed planning profile`,
      scopeBasisNote,
      `${input.rooms} room(s), ${input.bathrooms} bathroom(s) and ${input.kitchens} kitchen(s) used as high-level planning context`,
      `${input.projectType === 'COMMERCIAL' ? 'Commercial' : 'Residential'} project with ${input.structureSystem === 'LOAD_BEARING' ? 'load-bearing masonry' : 'RCC framed'} construction and ${input.floorHeightFt} ft floor height`,
      `Wastage included: ${input.wastagePercent}%`,
      'TMT quantity is a budgeting allowance, not a reinforcement design. A structural engineer must approve the final design and steel schedule.',
      input.constructionScope === 'FULL_FINISH'
        ? `${input.tileCoveragePercent}% floor/wall tile coverage${input.includeCeilingPaint ? ' with ceiling painting' : ''}. Finishing, electrical, plumbing, door and window quantities are preliminary allowances. Final BOQ requires architectural and MEP drawings.`
        : 'This scope excludes finishes, fixtures, electrical, plumbing, doors and windows.',
    ],
  };
}

// v3: same cement/sand/aggregate/TMT/bricks/tiles/paint/doors/windows logic as v2 (via
// `includeAreaBasedUtilities: false`), but electrical and plumbing come from a point/route schedule
// (`input.electricalPoints`/`input.plumbingFixtures`, resolved upstream by the service layer from
// either caller-supplied detailed data or a managed RoomTemplate) instead of a per-sqft allowance.
// Conduit has no route model defined yet and is intentionally omitted rather than kept on the old
// flawed per-sqft number.
function runBuildingBudgetV3(input: any, config: any): FormulaResult {
  const base = runBuildingBudget(input, config, true, false);
  const lines = base.lines.slice();
  const assumptions = base.assumptions.slice();
  const hasElectrical = input.electricalPoints.length > 0;
  const hasPlumbing = input.plumbingFixtures.length > 0;

  if (hasElectrical) lines.push(...groupElectricalPoints(input.electricalPoints, input.wastagePercent));
  if (hasPlumbing) lines.push(...groupPlumbingRoutes(input.plumbingFixtures, input.wastagePercent));

  if (input.constructionScope === 'FULL_FINISH') {
    assumptions.push(
      hasElectrical
        ? `Electrical conductor lengths are grouped from ${input.electricalPoints.length} supplied or template point entries by design-selected conductor size, not a per-sqft allowance.`
        : 'Electrical quantities are excluded from this estimate pending a room breakdown or an explicit point schedule.',
      hasPlumbing
        ? `Plumbing pipe lengths are grouped from ${input.plumbingFixtures.length} supplied or template fixture routes by system and diameter, not a per-sqft allowance.`
        : 'Plumbing quantities are excluded from this estimate pending a room breakdown or an explicit fixture schedule.',
      'Electrical conduit routing is not yet modelled in this formula version and is excluded from this estimate.',
    );
  }

  return { normalizedInputs: base.normalizedInputs, lines, assumptions };
}

const registry: Record<string, FormulaDefinition> = {
  'cement-concrete-v1': {
    inputSchema: concreteInputs,
    configSchema: concreteConfig,
    run(input, config) {
      const wetVolume = input.lengthM * input.widthM * input.thicknessM * input.quantity;
      const dryVolume = wetVolume * config.dryVolumeFactor;
      const totalParts = config.cementPart + config.sandPart + config.aggregatePart;
      const cementKg = dryVolume * (config.cementPart / totalParts) * config.cementDensityKgM3;
      const cementBags = cementKg / config.cementBagKg;
      const sandM3 = dryVolume * (config.sandPart / totalParts);
      const aggregateM3 = dryVolume * (config.aggregatePart / totalParts);
      return {
        normalizedInputs: input,
        lines: [
          line('cement', 'Cement', cementBags, input.wastagePercent, 'bag'),
          line('sand', 'Construction sand', sandM3, input.wastagePercent, 'm3'),
          line('aggregate', 'Coarse aggregate', aggregateM3, input.wastagePercent, 'm3'),
        ],
        assumptions: [
          `${config.profileName} managed mix profile`,
          `Wet concrete volume: ${round(wetVolume, 3)} m3`,
          `Dry-volume factor: ${config.dryVolumeFactor}`,
          `Wastage: ${input.wastagePercent}%`,
        ],
      };
    },
  },
  'bricks-blocks-v1': {
    inputSchema: bricksInputs,
    configSchema: bricksConfig,
    run(input, config) {
      const grossArea = input.wallLengthM * input.wallHeightM * input.quantity;
      const netArea = grossArea - input.openingsAreaM2 * input.quantity;
      if (netArea <= 0) throw new BadRequestException('Openings must be smaller than the total wall area.');
      const masonryVolume = netArea * input.wallThicknessM;
      const moduleVolume = (config.brickLengthM + config.mortarJointM) * (config.brickHeightM + config.mortarJointM) * (config.brickWidthM + config.mortarJointM);
      const units = masonryVolume / moduleVolume;
      const mortarDryVolume = masonryVolume * config.mortarDryVolumePerM3;
      const mortarParts = config.mortarCementPart + config.mortarSandPart;
      const cementBags = (mortarDryVolume * (config.mortarCementPart / mortarParts) * config.cementDensityKgM3) / config.cementBagKg;
      const sandM3 = mortarDryVolume * (config.mortarSandPart / mortarParts);
      return {
        normalizedInputs: input,
        lines: [
          line(input.material === 'AAC_BLOCK' ? 'aac_blocks' : 'bricks', input.material === 'AAC_BLOCK' ? 'AAC blocks' : 'Bricks', units, input.wastagePercent, 'piece'),
          line('cement', 'Cement for mortar', cementBags, input.wastagePercent, 'bag'),
          line('sand', 'Sand for mortar', sandM3, input.wastagePercent, 'm3'),
        ],
        assumptions: [`Net wall area: ${round(netArea, 3)} m2`, `Managed mortar-joint allowance: ${config.mortarJointM} m`, `Wastage: ${input.wastagePercent}%`],
      };
    },
  },
  'bricks-blocks-v2': {
    inputSchema: bricksInputs,
    configSchema: bricksV2Config,
    run(input, config) {
      const grossArea = input.wallLengthM * input.wallHeightM * input.quantity;
      const netArea = grossArea - input.openingsAreaM2 * input.quantity;
      if (netArea <= 0) throw new BadRequestException('Openings must be smaller than the total wall area.');
      const masonryVolume = netArea * input.wallThicknessM;

      if (input.material === 'AAC_BLOCK') {
        const profile = config.AAC_BLOCK;
        const moduleFaceArea = (profile.unitLengthM + profile.jointM) * (profile.unitHeightM + profile.jointM);
        const blocks = netArea / moduleFaceArea;
        const adhesiveKg = netArea * profile.adhesiveKgPerM2;
        return {
          normalizedInputs: input,
          lines: [
            line('aac_blocks', 'AAC blocks', blocks, input.wastagePercent, 'piece'),
            line('aac_block_adhesive', 'AAC block adhesive', adhesiveKg, input.wastagePercent, 'kg'),
          ],
          assumptions: [
            `Net wall area: ${round(netArea, 3)} m2`,
            `AAC planning module: ${profile.unitLengthM} x ${profile.unitHeightM} x ${profile.unitWidthM} m with ${profile.jointM} m joint`,
            `Thin-bed adhesive allowance: ${profile.adhesiveKgPerM2} kg/m2`,
            `Wastage: ${input.wastagePercent}%`,
          ],
        };
      }

      const profile = config.BRICK;
      const moduleVolume = (profile.unitLengthM + profile.mortarJointM) * (profile.unitHeightM + profile.mortarJointM) * (profile.unitWidthM + profile.mortarJointM);
      const units = masonryVolume / moduleVolume;
      const mortarDryVolume = masonryVolume * profile.mortarDryVolumePerM3;
      const mortarParts = profile.mortarCementPart + profile.mortarSandPart;
      const cementBags = (mortarDryVolume * (profile.mortarCementPart / mortarParts) * profile.cementDensityKgM3) / profile.cementBagKg;
      const sandM3 = mortarDryVolume * (profile.mortarSandPart / mortarParts);
      return {
        normalizedInputs: input,
        lines: [
          line('bricks', 'Red clay bricks', units, input.wastagePercent, 'piece'),
          line('cement', 'Cement for brick mortar', cementBags, input.wastagePercent, 'bag'),
          line('sand', 'Sand for brick mortar', sandM3, input.wastagePercent, 'm3'),
        ],
        assumptions: [
          `Net wall area: ${round(netArea, 3)} m2`,
          `Brick planning module: ${profile.unitLengthM} x ${profile.unitHeightM} x ${profile.unitWidthM} m with ${profile.mortarJointM} m mortar joint`,
          `Wastage: ${input.wastagePercent}%`,
        ],
      };
    },
  },
  'tiles-flooring-v1': {
    inputSchema: tilesInputs,
    configSchema: tilesConfig,
    run(input, config) {
      const grossArea = input.lengthM * input.widthM * input.quantity;
      const netArea = grossArea - input.openingsAreaM2 * input.quantity;
      if (netArea <= 0) throw new BadRequestException('Openings must be smaller than the total surface area.');
      const tileArea = input.tileLengthM * input.tileWidthM;
      return {
        normalizedInputs: input,
        lines: [
          line('tiles', 'Tiles', netArea / tileArea, input.wastagePercent, 'piece'),
          line('tile_adhesive', 'Tile adhesive', netArea * config.adhesiveKgPerM2, input.wastagePercent, 'kg'),
          line('grout', 'Tile grout', netArea * config.groutKgPerM2, input.wastagePercent, 'kg'),
        ],
        assumptions: [`Net surface area: ${round(netArea, 3)} m2`, `Tile face area: ${round(tileArea, 4)} m2`, `Wastage: ${input.wastagePercent}%`],
      };
    },
  },
  'tiles-flooring-v2': {
    inputSchema: tilesInputs,
    configSchema: tilesV2Config,
    run(input, config) {
      const grossArea = input.lengthM * input.widthM * input.quantity;
      const netArea = grossArea - input.openingsAreaM2 * input.quantity;
      if (netArea <= 0) throw new BadRequestException('Openings must be smaller than the total surface area.');
      const tileArea = input.tileLengthM * input.tileWidthM;
      const profile = config[input.surfaceType];
      const tileOutputKey = input.surfaceType === 'WALL' ? 'wall_tiles' : 'floor_tiles';
      return {
        normalizedInputs: input,
        lines: [
          line(tileOutputKey, input.surfaceType === 'WALL' ? 'Wall tiles' : 'Floor tiles', netArea / tileArea, input.wastagePercent, 'piece'),
          line('tile_adhesive', 'Tile adhesive', netArea * profile.adhesiveKgPerM2, input.wastagePercent, 'kg'),
          line('grout', 'Tile grout', netArea * profile.groutKgPerM2, input.wastagePercent, 'kg'),
        ],
        assumptions: [
          `${input.surfaceType === 'WALL' ? 'Wall' : 'Floor'} surface area: ${round(netArea, 3)} m2`,
          `Tile face area: ${round(tileArea, 4)} m2`,
          `Managed adhesive coverage: ${profile.adhesiveKgPerM2} kg/m2`,
          `Wastage: ${input.wastagePercent}%`,
        ],
      };
    },
  },
  'paint-v1': {
    inputSchema: paintInputs,
    configSchema: paintConfig,
    run(input, config) {
      const wallArea = 2 * (input.roomLengthM + input.roomWidthM) * input.wallHeightM;
      const ceilingArea = input.includeCeiling ? input.roomLengthM * input.roomWidthM : 0;
      const netAreaPerRoom = wallArea + ceilingArea - input.openingsAreaM2;
      if (netAreaPerRoom <= 0) throw new BadRequestException('Openings must be smaller than the total paintable area.');
      const netArea = netAreaPerRoom * input.quantity;
      const paintLitres = netArea * input.paintCoats / config.paintCoverageM2PerLitrePerCoat;
      const primerLitres = netArea * input.primerCoats / config.primerCoverageM2PerLitrePerCoat;
      const puttyKg = netArea * input.puttyCoats / config.puttyCoverageM2PerKgPerCoat;
      return {
        normalizedInputs: input,
        lines: [
          line('paint', 'Finish paint', paintLitres, input.wastagePercent, 'litre'),
          line('primer', 'Wall primer', primerLitres, input.wastagePercent, 'litre'),
          line('putty', 'Wall putty', puttyKg, input.wastagePercent, 'kg'),
        ],
        assumptions: [`Paintable area: ${round(netArea, 3)} m2`, `${input.paintCoats} paint coat(s), ${input.primerCoats} primer coat(s) and ${input.puttyCoats} putty coat(s)`, `Wastage: ${input.wastagePercent}%`],
      };
    },
  },
  'building-material-budget-v1': {
    inputSchema: buildingBudgetInputs,
    configSchema: buildingBudgetConfig,
    run(input, config) {
      return runBuildingBudget(input, config, false);
    },
  },
  'building-material-budget-v2': {
    inputSchema: buildingBudgetInputs,
    configSchema: buildingBudgetConfig,
    run(input, config) {
      return runBuildingBudget(input, config, true);
    },
  },
  'electrical-wiring-v1': {
    inputSchema: z.object({
      points: z.array(electricalPointInputSchema).min(1).max(2_000),
      wastagePercent: wastage,
    }).strict(),
    configSchema: z.object({
      profileName: z.string().trim().min(2).max(160),
    }).strict(),
    run(input, config) {
      return {
        normalizedInputs: input,
        lines: groupElectricalPoints(input.points, input.wastagePercent),
        assumptions: [
          `${config.profileName} managed wiring profile`,
          'Conductor cross-section and route length are supplied per point from an approved load/design, not derived from quality tier or floor area.',
          `${input.points.length} point/circuit-run entries used as the basis for conductor length.`,
          `Wastage included: ${input.wastagePercent}%`,
        ],
      };
    },
  },
  'plumbing-routing-v1': {
    inputSchema: z.object({
      routes: z.array(plumbingRouteInputSchema).min(1).max(2_000),
      wastagePercent: wastage,
    }).strict(),
    configSchema: z.object({
      profileName: z.string().trim().min(2).max(160),
    }).strict(),
    run(input, config) {
      return {
        normalizedInputs: input,
        lines: groupPlumbingRoutes(input.routes, input.wastagePercent),
        assumptions: [
          `${config.profileName} managed plumbing routing profile`,
          'Pipe diameter and route length are supplied per fixture from an approved design, not derived from quality tier.',
          `Grouped across ${new Set(input.routes.map((route: PlumbingRouteInput) => route.system)).size} plumbing system(s).`,
          `Wastage included: ${input.wastagePercent}%`,
        ],
      };
    },
  },
  'building-material-budget-v3': {
    inputSchema: buildingBudgetInputsV3,
    configSchema: buildingBudgetConfigV3,
    run(input, config) {
      return runBuildingBudgetV3(input, config);
    },
  },
};

export function formulaKeys() {
  return Object.keys(registry);
}

export function validateFormulaConfiguration(formulaKey: string, configuration: unknown) {
  const definition = registry[formulaKey];
  if (!definition) throw new BadRequestException(`Unsupported calculator formula: ${formulaKey}.`);
  const parsed = definition.configSchema.safeParse(configuration);
  if (!parsed.success) throw new BadRequestException(parsed.error.issues.map((issue) => issue.message).join(' '));
  return parsed.data;
}

export function runFormula(formulaKey: string, rawInput: unknown, rawConfiguration: unknown): FormulaResult {
  const definition = registry[formulaKey];
  if (!definition) throw new BadRequestException(`Unsupported calculator formula: ${formulaKey}.`);
  const input = definition.inputSchema.safeParse(rawInput);
  if (!input.success) throw new BadRequestException(input.error.issues.map((issue) => `${issue.path.join('.') || 'input'}: ${issue.message}`).join(' '));
  const configuration = validateFormulaConfiguration(formulaKey, rawConfiguration);
  return definition.run(input.data, configuration);
}
