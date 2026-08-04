import { BadRequestException } from '@nestjs/common';
import { formulaKeys, runFormula } from './formula-registry';

describe('calculator formula registry', () => {
  it('registers the launch calculators and complete material planner', () => {
    expect(formulaKeys()).toEqual(expect.arrayContaining([
      'cement-concrete-v1',
      'bricks-blocks-v1',
      'bricks-blocks-v2',
      'tiles-flooring-v1',
      'tiles-flooring-v2',
      'paint-v1',
      'building-material-budget-v1',
      'building-material-budget-v2',
    ]));
  });

  it('calculates concrete materials with explicit wastage', () => {
    const result = runFormula('cement-concrete-v1', {
      componentType: 'SLAB', lengthM: 1, widthM: 1, thicknessM: 0.1, quantity: 1, wastagePercent: 5,
    }, {
      profileName: 'Demo reviewed profile', dryVolumeFactor: 1.54, cementPart: 1, sandPart: 1.5, aggregatePart: 3, cementDensityKgM3: 1440, cementBagKg: 50,
    });
    expect(result.lines.find((item) => item.outputKey === 'cement')).toMatchObject({ rawQuantity: 0.8064, unitCode: 'bag' });
    expect(result.lines.every((item) => item.quantityWithWastage > item.rawQuantity)).toBe(true);
  });

  it('subtracts wall openings and calculates masonry units', () => {
    const result = runFormula('bricks-blocks-v1', {
      material: 'BRICK', wallLengthM: 5, wallHeightM: 3, wallThicknessM: 0.23, openingsAreaM2: 2, quantity: 1, wastagePercent: 5,
    }, {
      brickLengthM: 0.19, brickHeightM: 0.09, brickWidthM: 0.09, mortarJointM: 0.01, mortarDryVolumePerM3: 0.25, mortarCementPart: 1, mortarSandPart: 6, cementDensityKgM3: 1440, cementBagKg: 50,
    });
    expect(result.lines.find((item) => item.outputKey === 'bricks')?.rawQuantity).toBeGreaterThan(1_000);
    expect(result.assumptions[0]).toContain('13 m2');
  });

  it('uses different material systems for clay brick and AAC walls', () => {
    const configuration = masonryV2Configuration();
    const brick = runFormula('bricks-blocks-v2', {
      material: 'BRICK', wallLengthM: 5, wallHeightM: 3, wallThicknessM: 0.2, openingsAreaM2: 2, quantity: 1, wastagePercent: 5,
    }, configuration);
    const aac = runFormula('bricks-blocks-v2', {
      material: 'AAC_BLOCK', wallLengthM: 5, wallHeightM: 3, wallThicknessM: 0.2, openingsAreaM2: 2, quantity: 1, wastagePercent: 5,
    }, configuration);
    expect(brick.lines.map((item) => item.outputKey)).toEqual(['bricks', 'cement', 'sand']);
    expect(aac.lines.map((item) => item.outputKey)).toEqual(['aac_blocks', 'aac_block_adhesive']);
    expect(aac.lines.find((item) => item.outputKey === 'aac_blocks')!.rawQuantity).toBeLessThan(brick.lines.find((item) => item.outputKey === 'bricks')!.rawQuantity);
  });

  it('calculates tile pieces, adhesive and grout', () => {
    const result = runFormula('tiles-flooring-v1', {
      surfaceType: 'FLOOR', lengthM: 4, widthM: 3, openingsAreaM2: 0, tileLengthM: 0.6, tileWidthM: 0.6, quantity: 1, wastagePercent: 5,
    }, { adhesiveKgPerM2: 4, groutKgPerM2: 0.25 });
    expect(result.lines.find((item) => item.outputKey === 'tiles')).toMatchObject({ rawQuantity: 33.333333, quantityWithWastage: 35, unitCode: 'piece' });
  });

  it('maps floor and wall tile selections to the correct output and coverage profile', () => {
    const configuration = { FLOOR: { adhesiveKgPerM2: 4, groutKgPerM2: 0.25 }, WALL: { adhesiveKgPerM2: 5, groutKgPerM2: 0.3 } };
    const floor = runFormula('tiles-flooring-v2', {
      surfaceType: 'FLOOR', lengthM: 4, widthM: 3, openingsAreaM2: 0, tileLengthM: 0.6, tileWidthM: 0.6, quantity: 1, wastagePercent: 5,
    }, configuration);
    const wall = runFormula('tiles-flooring-v2', {
      surfaceType: 'WALL', lengthM: 4, widthM: 3, openingsAreaM2: 0, tileLengthM: 0.6, tileWidthM: 0.6, quantity: 1, wastagePercent: 5,
    }, configuration);
    expect(floor.lines[0]?.outputKey).toBe('floor_tiles');
    expect(wall.lines[0]?.outputKey).toBe('wall_tiles');
    expect(wall.lines.find((item) => item.outputKey === 'tile_adhesive')!.rawQuantity).toBeGreaterThan(floor.lines.find((item) => item.outputKey === 'tile_adhesive')!.rawQuantity);
  });

  it('calculates the full managed paint system', () => {
    const result = runFormula('paint-v1', {
      roomLengthM: 4, roomWidthM: 3, wallHeightM: 3, openingsAreaM2: 2, includeCeiling: true, paintCoats: 2, primerCoats: 1, puttyCoats: 2, quantity: 1, wastagePercent: 5,
    }, { paintCoverageM2PerLitrePerCoat: 10, primerCoverageM2PerLitrePerCoat: 12, puttyCoverageM2PerKgPerCoat: 8 });
    expect(result.lines.find((item) => item.outputKey === 'paint')).toMatchObject({ rawQuantity: 10.4, quantityWithWastage: 10.92, unitCode: 'litre' });
  });

  it('returns only foundation materials for a foundation-only project plan', () => {
    const result = runFormula('building-material-budget-v1', {
      projectName: 'Demo home', siteLocation: 'Kanpur', plotAreaSqFt: 1_500, builtUpAreaSqFt: 1_000,
      floors: 2, rooms: 6, bathrooms: 3, kitchens: 1, constructionScope: 'FOUNDATION', wastagePercent: 5,
    }, buildingBudgetConfiguration());
    expect(result.normalizedInputs).toMatchObject({ totalBuiltUpAreaSqFt: 2_000 });
    expect(result.lines.map((item) => item.outputKey)).toEqual(['cement', 'sand', 'aggregate', 'tmt_rebar']);
    expect(result.lines.every((item) => item.group === 'Foundation and structure')).toBe(true);
    expect(result.assumptions.join(' ')).toContain('structural engineer');
  });

  it('returns a staged core material schedule for a full-finish project plan', () => {
    const result = runFormula('building-material-budget-v1', {
      projectName: 'Demo home', siteLocation: 'Kanpur', plotAreaSqFt: 1_500, builtUpAreaSqFt: 1_000,
      floors: 1, rooms: 4, bathrooms: 2, kitchens: 1, constructionScope: 'FULL_FINISH', wastagePercent: 7.5,
    }, buildingBudgetConfiguration());
    expect(result.lines.map((item) => item.outputKey)).toEqual(expect.arrayContaining([
      'cement', 'sand', 'aggregate', 'tmt_rebar', 'bricks', 'tiles', 'paint', 'electrical_wire',
      'plumbing_pipe', 'sanitary_fixture_set', 'doors', 'windows',
    ]));
    expect(new Set(result.lines.map((item) => item.group))).toEqual(new Set([
      'Foundation and structure', 'Structural shell', 'Flooring and finishes', 'Painting system',
      'Electrical and plumbing', 'Doors and windows',
    ]));
    expect(result.assumptions.join(' ')).toContain('architectural and MEP drawings');
  });

  it('applies refined project, structure, floor-height and finish inputs', () => {
    const base = runFormula('building-material-budget-v1', {
      projectName: 'Residential RCC', siteLocation: 'Kanpur', plotAreaSqFt: 1_500, builtUpAreaSqFt: 1_000,
      floors: 1, rooms: 4, bathrooms: 2, kitchens: 1, projectType: 'RESIDENTIAL', structureSystem: 'RCC_FRAME',
      floorHeightFt: 10, tileCoveragePercent: 60, includeCeilingPaint: false, constructionScope: 'FULL_FINISH', wastagePercent: 5,
    }, buildingBudgetConfiguration());
    const refined = runFormula('building-material-budget-v1', {
      projectName: 'Commercial load bearing', siteLocation: 'Kanpur', plotAreaSqFt: 1_500, builtUpAreaSqFt: 1_000,
      floors: 1, rooms: 4, bathrooms: 2, kitchens: 1, projectType: 'COMMERCIAL', structureSystem: 'LOAD_BEARING',
      floorHeightFt: 12, tileCoveragePercent: 90, includeCeilingPaint: true, constructionScope: 'FULL_FINISH', wastagePercent: 5,
    }, buildingBudgetConfiguration());
    expect(refined.lines.find((item) => item.outputKey === 'bricks')!.rawQuantity).toBeGreaterThan(base.lines.find((item) => item.outputKey === 'bricks')!.rawQuantity);
    expect(refined.lines.find((item) => item.outputKey === 'tiles')!.rawQuantity).toBeGreaterThan(base.lines.find((item) => item.outputKey === 'tiles')!.rawQuantity);
    expect(refined.lines.find((item) => item.outputKey === 'paint')!.rawQuantity).toBeGreaterThan(base.lines.find((item) => item.outputKey === 'paint')!.rawQuantity);
    expect(refined.assumptions.join(' ')).toContain('Commercial project with load-bearing masonry construction and 12 ft floor height');
  });

  it('keeps structural quantities consistent when full finishes are added', () => {
    const common = {
      projectName: 'Scope comparison', siteLocation: 'Kanpur', plotAreaSqFt: 1_500, builtUpAreaSqFt: 1_000,
      floors: 2, rooms: 6, bathrooms: 3, kitchens: 1, projectType: 'RESIDENTIAL', structureSystem: 'RCC_FRAME',
      floorHeightFt: 10, tileCoveragePercent: 70, includeCeilingPaint: true, wastagePercent: 5,
    };
    const structure = runFormula('building-material-budget-v2', { ...common, constructionScope: 'STRUCTURE' }, buildingBudgetConfiguration());
    const fullFinish = runFormula('building-material-budget-v2', { ...common, constructionScope: 'FULL_FINISH' }, buildingBudgetConfiguration());
    for (const key of ['cement', 'sand', 'aggregate', 'tmt_rebar', 'bricks']) {
      expect(fullFinish.lines.find((item) => item.outputKey === key)?.rawQuantity).toBe(structure.lines.find((item) => item.outputKey === key)?.rawQuantity);
    }
  });

  it('uses footprint and a floor-load factor for foundation-only planning', () => {
    const common = {
      projectName: 'Foundation comparison', siteLocation: 'Kanpur', plotAreaSqFt: 1_500, builtUpAreaSqFt: 1_000,
      rooms: 6, bathrooms: 3, kitchens: 1, projectType: 'RESIDENTIAL', structureSystem: 'RCC_FRAME', floorHeightFt: 10,
      tileCoveragePercent: 70, includeCeilingPaint: false, constructionScope: 'FOUNDATION', wastagePercent: 5,
    };
    const oneFloor = runFormula('building-material-budget-v2', { ...common, floors: 1 }, buildingBudgetConfiguration());
    const threeFloors = runFormula('building-material-budget-v2', { ...common, floors: 3 }, buildingBudgetConfiguration());
    const oneFloorCement = oneFloor.lines.find((item) => item.outputKey === 'cement')!.rawQuantity;
    const threeFloorCement = threeFloors.lines.find((item) => item.outputKey === 'cement')!.rawQuantity;
    expect(threeFloorCement).toBeGreaterThan(oneFloorCement);
    expect(threeFloorCement).toBeLessThan(oneFloorCement * 3);
    expect(threeFloors.assumptions.join(' ')).toContain('does not multiply foundation quantities by every floor');
  });

  it('rejects a building plan whose per-floor built-up area exceeds the plot', () => {
    expect(() => runFormula('building-material-budget-v1', {
      projectName: 'Invalid home', siteLocation: 'Kanpur', plotAreaSqFt: 900, builtUpAreaSqFt: 1_000,
      floors: 1, rooms: 4, bathrooms: 2, kitchens: 1, constructionScope: 'STRUCTURE', wastagePercent: 5,
    }, buildingBudgetConfiguration())).toThrow(BadRequestException);
  });

  it('rejects impossible openings instead of returning negative materials', () => {
    expect(() => runFormula('tiles-flooring-v1', {
      surfaceType: 'FLOOR', lengthM: 2, widthM: 2, openingsAreaM2: 5, tileLengthM: 0.6, tileWidthM: 0.6, quantity: 1, wastagePercent: 5,
    }, { adhesiveKgPerM2: 4, groutKgPerM2: 0.25 })).toThrow(BadRequestException);
  });

  it('rejects zero dimensions and wastage above the managed limit', () => {
    const config = { adhesiveKgPerM2: 4, groutKgPerM2: 0.25 };
    expect(() => runFormula('tiles-flooring-v1', {
      surfaceType: 'FLOOR', lengthM: 0, widthM: 2, openingsAreaM2: 0, tileLengthM: 0.6, tileWidthM: 0.6, quantity: 1, wastagePercent: 5,
    }, config)).toThrow(BadRequestException);
    expect(() => runFormula('tiles-flooring-v1', {
      surfaceType: 'FLOOR', lengthM: 2, widthM: 2, openingsAreaM2: 0, tileLengthM: 0.6, tileWidthM: 0.6, quantity: 1, wastagePercent: 21,
    }, config)).toThrow(BadRequestException);
  });

  it('rejects unregistered formulas and invalid managed configuration', () => {
    expect(() => runFormula('arbitrary-javascript', {}, {})).toThrow(BadRequestException);
    expect(() => runFormula('paint-v1', {
      roomLengthM: 4, roomWidthM: 3, wallHeightM: 3, openingsAreaM2: 0, includeCeiling: false, paintCoats: 2, primerCoats: 1, puttyCoats: 2, quantity: 1, wastagePercent: 5,
    }, { paintCoverageM2PerLitrePerCoat: 0, primerCoverageM2PerLitrePerCoat: 12, puttyCoverageM2PerKgPerCoat: 8 })).toThrow(BadRequestException);
  });
});

function buildingBudgetConfiguration() {
  return {
    profileName: 'DEMO residential planning profile - approval required',
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
      electricalWireMPerSqFt: 1.6, conduitMPerSqFt: 0.45, plumbingPipeMPerSqFt: 0.12,
      plumbingPipeMPerBathroom: 8, doorsPerRoom: 1, entranceDoors: 1, windowsPerRoom: 0.8,
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
  };
}

function masonryV2Configuration() {
  return {
    BRICK: {
      unitLengthM: 0.19, unitHeightM: 0.09, unitWidthM: 0.09, mortarJointM: 0.01,
      mortarDryVolumePerM3: 0.25, mortarCementPart: 1, mortarSandPart: 6, cementDensityKgM3: 1440, cementBagKg: 50,
    },
    AAC_BLOCK: { unitLengthM: 0.6, unitHeightM: 0.2, unitWidthM: 0.1, jointM: 0.003, adhesiveKgPerM2: 4 },
  };
}
