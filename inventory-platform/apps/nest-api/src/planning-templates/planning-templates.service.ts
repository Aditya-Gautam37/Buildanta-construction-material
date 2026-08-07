import { Injectable } from '@nestjs/common';
import { RoomType, TemplateStatus } from '@workspace/db';
import { PrismaService } from '../database/prisma.service';

export type ConceptRoomBreakdownEntry = { roomType: RoomType; quantity: number };

export type ResolvedElectricalPoint = {
  roomLabel: string;
  pointType: string;
  purpose: string;
  quantity: number;
  oneWayRouteM: number;
  numberOfConductors: number;
  earthConductorCount: number;
  conductorSizeSqmm: number;
  earthConductorSizeSqmm?: number;
};

export type ResolvedPlumbingRoute = {
  roomLabel: string;
  fixtureType: string;
  system: string;
  diameterMm: number;
  quantity: number;
  routeM: number;
};

export type ResolvedConceptSchedule = {
  electricalPoints: ResolvedElectricalPoint[];
  plumbingFixtures: ResolvedPlumbingRoute[];
  unresolvedRoomTypes: RoomType[];
};

function roomTypeLabel(roomType: RoomType): string {
  return roomType.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// Input-side augmentation for concept-mode requests: resolves a flat room-type/quantity breakdown
// into the point/route arrays `runFormula` expects, from managed (PUBLISHED) RoomTemplates. This is
// the DB-dependent step that must happen BEFORE the pure formula runs — symmetric to how
// CalculatorsService.buildEstimateItem() resolves CalculatorProductMapping AFTER the formula runs.
@Injectable()
export class PlanningTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveConceptModeSchedule(
    roomBreakdown: ConceptRoomBreakdownEntry[],
    regionalProfileId?: string | null,
  ): Promise<ResolvedConceptSchedule> {
    const requestedTypes = Array.from(new Set(roomBreakdown.map((room) => room.roomType)));
    if (requestedTypes.length === 0) {
      return { electricalPoints: [], plumbingFixtures: [], unresolvedRoomTypes: [] };
    }

    // No region filter at the query level: a caller that names a region gets first pick of that
    // region's templates (below), but every published template for the room type is a valid
    // candidate — most callers (including the storefront today) never pass a region at all, and
    // requiring `regionalProfileId: null` there would silently exclude every region-scoped template,
    // which is exactly what every seeded template currently is.
    const templates = await this.prisma.client.roomTemplate.findMany({
      where: {
        status: TemplateStatus.PUBLISHED,
        roomType: { in: requestedTypes },
      },
      include: {
        electricalPoints: { orderBy: { sortOrder: 'asc' } },
        plumbingFixtures: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const byRoomType = new Map<RoomType, typeof templates>();
    for (const template of templates) {
      const list = byRoomType.get(template.roomType) ?? [];
      list.push(template);
      byRoomType.set(template.roomType, list);
    }

    const electricalPoints: ResolvedElectricalPoint[] = [];
    const plumbingFixtures: ResolvedPlumbingRoute[] = [];
    const unresolvedRoomTypes: RoomType[] = [];

    for (const room of roomBreakdown) {
      const candidates = byRoomType.get(room.roomType) ?? [];
      // Region-specific match first, then the national default (null region), then — since most
      // callers never specify a region at all — whatever published template exists for this room
      // type (most recently updated first, per the query's orderBy).
      const preferred = (regionalProfileId ? candidates.find((template) => template.regionalProfileId === regionalProfileId) : undefined)
        ?? candidates.find((template) => template.regionalProfileId == null)
        ?? candidates[0];

      if (!preferred) {
        unresolvedRoomTypes.push(room.roomType);
        continue;
      }

      for (let instance = 1; instance <= room.quantity; instance += 1) {
        const roomLabel = `${roomTypeLabel(room.roomType)} ${instance}`;
        for (const point of preferred.electricalPoints) {
          electricalPoints.push({
            roomLabel,
            pointType: point.pointType,
            purpose: point.purpose,
            quantity: point.quantity,
            oneWayRouteM: Number(point.oneWayRouteM),
            numberOfConductors: point.numberOfConductors,
            earthConductorCount: point.earthConductorCount,
            conductorSizeSqmm: Number(point.conductorSizeSqmm),
            earthConductorSizeSqmm: point.earthConductorSizeSqmm != null ? Number(point.earthConductorSizeSqmm) : undefined,
          });
        }
        for (const fixture of preferred.plumbingFixtures) {
          plumbingFixtures.push({
            roomLabel,
            fixtureType: fixture.fixtureType,
            system: fixture.system,
            diameterMm: Number(fixture.diameterMm),
            quantity: fixture.quantity,
            routeM: Number(fixture.oneWayRouteM),
          });
        }
      }
    }

    return { electricalPoints, plumbingFixtures, unresolvedRoomTypes };
  }
}
