import { ForbiddenException } from '@nestjs/common';
import { CalculatorQualityTier, CalculatorVersionStatus, UserRole } from '@workspace/db';
import { CalculatorsService } from './calculators.service';

function buildingBudgetV3TestConfiguration() {
  return {
    profileName: 'Test profile',
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
  };
}

describe('CalculatorsService public contract', () => {
  const service = new CalculatorsService({} as never, {} as never, {} as never, {} as never);

  it('removes private inventory, supplier, cost and audit fields from public estimates', () => {
    const payload = (service as any).toPublicEstimate({
      reference: 'EST-TEST',
      definition: { name: 'Test calculator', slug: 'test', disclaimer: 'Safe public disclaimer', unpublishedConfiguration: { secret: true } },
      calculatorVersion: { version: 3, formulaKey: 'private-key' },
      deliveryPincode: '208001', qualityTier: 'STANDARD', inputs: { lengthM: 1 }, results: {}, assumptions: [],
      subtotal: 100, gstTotal: 18, deliveryTotal: null, valueHigh: 118, priceValidUntil: null,
      expiresAt: new Date(Date.now() + 60_000), status: 'ACTIVE', quotation: null,
      exactWarehouseStock: 999, supplierContacts: ['private'], auditEvents: ['private'],
      items: [{
        id: 'item', outputKey: 'cement', description: 'Cement', rawQuantity: 1, wastageQuantity: 0.05, purchaseQuantity: 2,
        unitCode: 'bag', packageSize: 1, availabilityLabel: 'Request confirmation', leadTimeLabel: null, unitPrice: 400,
        gstPercent: 18, lineTotal: 944, costPrice: 100, supplier: { email: 'private@example.test' }, exactStock: 999,
        product: { id: 'product', name: 'Public product', brand: { name: 'Public brand' }, images: [] },
        variant: { id: 'variant', sku: 'PUBLIC-SKU', unit: 'bag', attributes: {} },
      }],
    });
    const serialized = JSON.stringify(payload);
    expect(serialized).toContain('Public product');
    expect(serialized).not.toContain('costPrice');
    expect(serialized).not.toContain('supplierContacts');
    expect(serialized).not.toContain('exactWarehouseStock');
    expect(serialized).not.toContain('auditEvents');
    expect(serialized).not.toContain('private@example.test');
    expect(serialized).not.toContain('formulaKey');
    expect(serialized).not.toContain('unpublishedConfiguration');
  });

  it('rejects unrelated staff roles from the calculator operations overview', async () => {
    await expect(service.adminOverview(UserRole.WAREHOUSE_MANAGER)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates an inventory quotation from generic material lines without product mappings', async () => {
    const createQuotation = jest.fn().mockResolvedValue({ reference: 'BQ-TEST', itemCount: 2 });
    const quantityOnlyService = new CalculatorsService({
      client: {
        materialEstimate: {
          findUnique: jest.fn().mockResolvedValue({
            reference: 'EST-TEST',
            deliveryPincode: '208001',
            expiresAt: new Date(Date.now() + 60_000),
            quotation: null,
            items: [
              { productId: null, variantId: null, description: 'Cement', purchaseQuantity: 100, unitCode: 'bag' },
              { productId: null, variantId: null, description: 'TMT steel', purchaseQuantity: 850, unitCode: 'kg' },
            ],
          }),
        },
      },
    } as never, {} as never, { create: createQuotation } as never, {} as never);

    await expect(quantityOnlyService.addToQuotation('EST-TEST', {
      name: 'Aditya', email: 'aditya@example.com', phone: '9876543210',
    })).resolves.toEqual({ reference: 'BQ-TEST', itemCount: 2 });

    expect(createQuotation).toHaveBeenCalledWith(expect.objectContaining({
      sourceEstimateReference: 'EST-TEST',
      items: [
        expect.objectContaining({ description: 'Cement', productId: undefined, variantId: undefined, quantity: 100, unitCode: 'bag' }),
        expect.objectContaining({ description: 'TMT steel', productId: undefined, variantId: undefined, quantity: 850, unitCode: 'kg' }),
      ],
    }));
  });

  it('publishes a reviewed formula version without catalogue mappings', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 0 });
    const updateVersion = jest.fn().mockResolvedValue({ id: 'version-1', status: CalculatorVersionStatus.PUBLISHED });
    const publishService = new CalculatorsService({
      client: {
        calculatorVersion: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'version-1', definitionId: 'definition-1', status: CalculatorVersionStatus.DRAFT,
            formulaKey: 'paint-v1',
            configuration: { paintCoverageM2PerLitrePerCoat: 10, primerCoverageM2PerLitrePerCoat: 12, puttyCoverageM2PerKgPerCoat: 8 },
            mappings: [], effectiveFrom: null,
          }),
        },
        $transaction: jest.fn(async (callback) => callback({
          calculatorVersion: { updateMany, update: updateVersion },
          calculatorDefinition: { update: jest.fn() },
          calculatorAuditEvent: { create: jest.fn() },
        })),
      },
    } as never, {} as never, {} as never, {} as never);

    await expect(publishService.publishVersion(
      'version-1', { reason: 'Formula reviewed for quantity-only launch' }, 'admin-1', UserRole.ADMIN,
    )).resolves.toMatchObject({ status: CalculatorVersionStatus.PUBLISHED });
    expect(updateMany).toHaveBeenCalled();
    expect(updateVersion).toHaveBeenCalled();
  });

  it('augments a v3 room breakdown from a resolved template schedule before running the formula', async () => {
    const resolveConceptModeSchedule = jest.fn().mockResolvedValue({
      electricalPoints: [{ roomLabel: 'Bedroom 1', pointType: 'LIGHT_POINT', purpose: 'LIGHTING', quantity: 2, oneWayRouteM: 4, numberOfConductors: 2, earthConductorCount: 0, conductorSizeSqmm: 1.5 }],
      plumbingFixtures: [{ roomLabel: 'Bathroom 1', fixtureType: 'WC', system: 'SOIL', diameterMm: 110, quantity: 1, routeM: 3 }],
      unresolvedRoomTypes: [],
    });
    const createEstimate = jest.fn().mockImplementation(async ({ data }: any) => ({
      ...data,
      id: 'estimate-1',
      items: [],
      definition: { name: 'Complete construction material', slug: 'complete-construction-material', disclaimer: 'Disclaimer' },
      calculatorVersion: { version: 1, formulaKey: 'building-material-budget-v3' },
      quotation: null,
    }));

    const augmentingService = new CalculatorsService({
      client: {
        calculatorDefinition: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'definition-1',
            versions: [{ id: 'version-1', formulaKey: 'building-material-budget-v3', configuration: buildingBudgetV3TestConfiguration() }],
          }),
        },
        calculatorProductMapping: { findMany: jest.fn().mockResolvedValue([]) },
        materialEstimate: { create: createEstimate },
      },
    } as never, {
      publicAvailability: jest.fn().mockRejectedValue(new Error('unavailable in this test')),
    } as never, {} as never, {
      resolveConceptModeSchedule,
    } as never);

    await augmentingService.calculate('complete-construction-material', {
      deliveryPincode: '208001',
      qualityTier: CalculatorQualityTier.STANDARD,
      inputs: {
        projectName: 'Test home', siteLocation: 'Kanpur', plotAreaSqFt: 1_500, builtUpAreaSqFt: 1_000,
        floors: 1, rooms: 4, bathrooms: 2, kitchens: 1, constructionScope: 'FULL_FINISH', wastagePercent: 5,
        roomBreakdown: [{ roomType: 'BEDROOM', quantity: 1 }],
      },
    } as never);

    expect(resolveConceptModeSchedule).toHaveBeenCalledWith([{ roomType: 'BEDROOM', quantity: 1 }], undefined);
    const persistedInputs = createEstimate.mock.calls[0][0].data.inputs;
    expect(persistedInputs.electricalPoints).toEqual(expect.arrayContaining([expect.objectContaining({ conductorSizeSqmm: 1.5 })]));
    expect(persistedInputs.plumbingFixtures).toEqual(expect.arrayContaining([expect.objectContaining({ diameterMm: 110 })]));
  });
});
