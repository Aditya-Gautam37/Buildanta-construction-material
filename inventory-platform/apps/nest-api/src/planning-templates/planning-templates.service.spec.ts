import { PlanningTemplatesService } from './planning-templates.service';

function electricalPointRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    pointType: 'LIGHT_POINT',
    purpose: 'LIGHTING',
    quantity: 1,
    oneWayRouteM: 4,
    numberOfConductors: 2,
    earthConductorCount: 0,
    conductorSizeSqmm: 1.5,
    earthConductorSizeSqmm: null,
    ...overrides,
  };
}

describe('PlanningTemplatesService.resolveConceptModeSchedule', () => {
  it('returns empty results without querying when no rooms are requested', async () => {
    const findMany = jest.fn();
    const service = new PlanningTemplatesService({ client: { roomTemplate: { findMany } } } as never);

    const result = await service.resolveConceptModeSchedule([]);

    expect(findMany).not.toHaveBeenCalled();
    expect(result).toEqual({ electricalPoints: [], plumbingFixtures: [], unresolvedRoomTypes: [] });
  });

  it('only queries published national-default templates when no region is given', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new PlanningTemplatesService({ client: { roomTemplate: { findMany } } } as never);

    await service.resolveConceptModeSchedule([{ roomType: 'KITCHEN' as never, quantity: 1 }]);

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: 'PUBLISHED', regionalProfileId: null }),
    }));
  });

  it('multiplies template point quantities by the requested room instance count', async () => {
    const findMany = jest.fn().mockResolvedValue([
      { id: 'template-1', roomType: 'BEDROOM', regionalProfileId: null, electricalPoints: [electricalPointRow({ quantity: 2 })], plumbingFixtures: [] },
    ]);
    const service = new PlanningTemplatesService({ client: { roomTemplate: { findMany } } } as never);

    const result = await service.resolveConceptModeSchedule([{ roomType: 'BEDROOM' as never, quantity: 3 }]);

    expect(result.electricalPoints).toHaveLength(3);
    expect(result.electricalPoints.map((point) => point.roomLabel)).toEqual(['Bedroom 1', 'Bedroom 2', 'Bedroom 3']);
    expect(result.electricalPoints.every((point) => point.quantity === 2)).toBe(true);
    expect(result.unresolvedRoomTypes).toEqual([]);
  });

  it('prefers a region-specific published template over the national default', async () => {
    const findMany = jest.fn().mockResolvedValue([
      { id: 'default-template', roomType: 'BEDROOM', regionalProfileId: null, electricalPoints: [electricalPointRow({ oneWayRouteM: 4 })], plumbingFixtures: [] },
      { id: 'region-template', roomType: 'BEDROOM', regionalProfileId: 'region-1', electricalPoints: [electricalPointRow({ oneWayRouteM: 9 })], plumbingFixtures: [] },
    ]);
    const service = new PlanningTemplatesService({ client: { roomTemplate: { findMany } } } as never);

    const result = await service.resolveConceptModeSchedule([{ roomType: 'BEDROOM' as never, quantity: 1 }], 'region-1');

    expect(result.electricalPoints[0]!.oneWayRouteM).toBe(9);
  });

  it('falls back to the national default when no region-specific template exists', async () => {
    const findMany = jest.fn().mockResolvedValue([
      { id: 'default-template', roomType: 'BEDROOM', regionalProfileId: null, electricalPoints: [electricalPointRow({ oneWayRouteM: 4 })], plumbingFixtures: [] },
    ]);
    const service = new PlanningTemplatesService({ client: { roomTemplate: { findMany } } } as never);

    const result = await service.resolveConceptModeSchedule([{ roomType: 'BEDROOM' as never, quantity: 1 }], 'region-without-override');

    expect(result.electricalPoints[0]!.oneWayRouteM).toBe(4);
  });

  it('reports a room type with no published template without throwing', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new PlanningTemplatesService({ client: { roomTemplate: { findMany } } } as never);

    const result = await service.resolveConceptModeSchedule([{ roomType: 'GARAGE' as never, quantity: 1 }]);

    expect(result.electricalPoints).toEqual([]);
    expect(result.plumbingFixtures).toEqual([]);
    expect(result.unresolvedRoomTypes).toEqual(['GARAGE']);
  });
});
