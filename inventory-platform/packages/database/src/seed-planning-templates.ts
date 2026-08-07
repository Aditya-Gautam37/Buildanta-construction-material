import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
  ElectricalCircuitPurpose,
  ElectricalPointType,
  PlumbingFixtureType,
  PlumbingSystemType,
  PrismaClient,
  RoomType,
  TemplateStatus,
} from './../generated/client';

// Every row this script creates is status: DRAFT. Templates are only ever read by
// PlanningTemplatesService when status is PUBLISHED, so seeding drafts into any workspace
// (including production) is inert until a human reviews and publishes them. Re-running this
// script resets electrical/plumbing children back to these defaults, so do not re-run it against
// a workspace where these specific templates have already been hand-edited and published.
const draftNote = 'Draft planning default — verify against local electrical/plumbing code before publishing.';

type ElectricalPointSeed = {
  pointType: ElectricalPointType;
  purpose: ElectricalCircuitPurpose;
  quantity: number;
  oneWayRouteM: number;
  numberOfConductors: number;
  earthConductorCount: number;
  conductorSizeSqmm: number;
  earthConductorSizeSqmm?: number;
};

type PlumbingFixtureSeed = {
  fixtureType: PlumbingFixtureType;
  system: PlumbingSystemType;
  quantity: number;
  diameterMm: number;
  oneWayRouteM: number;
};

type RoomTemplateSeed = {
  roomType: RoomType;
  code: string;
  name: string;
  description: string;
  typicalAreaSqFtMin: number;
  typicalAreaSqFtMax: number;
  electricalPoints: ElectricalPointSeed[];
  plumbingFixtures: PlumbingFixtureSeed[];
};

const roomTemplates: RoomTemplateSeed[] = [
  {
    roomType: RoomType.BEDROOM,
    code: 'bedroom-standard-kanpur',
    name: 'Standard bedroom',
    description: 'Typical residential bedroom electrical point schedule.',
    typicalAreaSqFtMin: 120,
    typicalAreaSqFtMax: 180,
    electricalPoints: [
      { pointType: ElectricalPointType.LIGHT_POINT, purpose: ElectricalCircuitPurpose.LIGHTING, quantity: 2, oneWayRouteM: 4, numberOfConductors: 2, earthConductorCount: 0, conductorSizeSqmm: 1.5 },
      { pointType: ElectricalPointType.FAN_POINT, purpose: ElectricalCircuitPurpose.LIGHTING, quantity: 1, oneWayRouteM: 5, numberOfConductors: 2, earthConductorCount: 0, conductorSizeSqmm: 1.5 },
      { pointType: ElectricalPointType.SOCKET_5A, purpose: ElectricalCircuitPurpose.POWER_SOCKET, quantity: 3, oneWayRouteM: 6, numberOfConductors: 2, earthConductorCount: 1, conductorSizeSqmm: 2.5 },
      { pointType: ElectricalPointType.SOCKET_20A_AC, purpose: ElectricalCircuitPurpose.AC, quantity: 1, oneWayRouteM: 8, numberOfConductors: 2, earthConductorCount: 1, conductorSizeSqmm: 4 },
    ],
    plumbingFixtures: [],
  },
  {
    roomType: RoomType.LIVING_ROOM,
    code: 'living-room-standard-kanpur',
    name: 'Standard living/drawing room',
    description: 'Typical residential living room electrical point schedule.',
    typicalAreaSqFtMin: 200,
    typicalAreaSqFtMax: 320,
    electricalPoints: [
      { pointType: ElectricalPointType.LIGHT_POINT, purpose: ElectricalCircuitPurpose.LIGHTING, quantity: 3, oneWayRouteM: 5, numberOfConductors: 2, earthConductorCount: 0, conductorSizeSqmm: 1.5 },
      { pointType: ElectricalPointType.FAN_POINT, purpose: ElectricalCircuitPurpose.LIGHTING, quantity: 2, oneWayRouteM: 6, numberOfConductors: 2, earthConductorCount: 0, conductorSizeSqmm: 1.5 },
      { pointType: ElectricalPointType.SOCKET_5A, purpose: ElectricalCircuitPurpose.POWER_SOCKET, quantity: 4, oneWayRouteM: 7, numberOfConductors: 2, earthConductorCount: 1, conductorSizeSqmm: 2.5 },
      { pointType: ElectricalPointType.TV_POINT, purpose: ElectricalCircuitPurpose.POWER_SOCKET, quantity: 1, oneWayRouteM: 7, numberOfConductors: 2, earthConductorCount: 1, conductorSizeSqmm: 2.5 },
      { pointType: ElectricalPointType.DATA_POINT, purpose: ElectricalCircuitPurpose.OTHER, quantity: 1, oneWayRouteM: 7, numberOfConductors: 2, earthConductorCount: 0, conductorSizeSqmm: 1.5 },
    ],
    plumbingFixtures: [],
  },
  {
    roomType: RoomType.KITCHEN,
    code: 'kitchen-standard-kanpur',
    name: 'Standard kitchen',
    description: 'Typical residential kitchen electrical and plumbing schedule.',
    typicalAreaSqFtMin: 80,
    typicalAreaSqFtMax: 130,
    electricalPoints: [
      { pointType: ElectricalPointType.LIGHT_POINT, purpose: ElectricalCircuitPurpose.LIGHTING, quantity: 2, oneWayRouteM: 4, numberOfConductors: 2, earthConductorCount: 0, conductorSizeSqmm: 1.5 },
      { pointType: ElectricalPointType.EXHAUST_FAN_POINT, purpose: ElectricalCircuitPurpose.KITCHEN_APPLIANCE, quantity: 1, oneWayRouteM: 5, numberOfConductors: 2, earthConductorCount: 1, conductorSizeSqmm: 2.5 },
      { pointType: ElectricalPointType.SOCKET_15A, purpose: ElectricalCircuitPurpose.KITCHEN_APPLIANCE, quantity: 2, oneWayRouteM: 5, numberOfConductors: 2, earthConductorCount: 1, conductorSizeSqmm: 2.5 },
      { pointType: ElectricalPointType.SOCKET_20A_GEYSER, purpose: ElectricalCircuitPurpose.KITCHEN_APPLIANCE, quantity: 1, oneWayRouteM: 6, numberOfConductors: 2, earthConductorCount: 1, conductorSizeSqmm: 4 },
    ],
    plumbingFixtures: [
      { fixtureType: PlumbingFixtureType.KITCHEN_SINK, system: PlumbingSystemType.COLD_WATER, quantity: 1, diameterMm: 15, oneWayRouteM: 5 },
      { fixtureType: PlumbingFixtureType.KITCHEN_SINK, system: PlumbingSystemType.HOT_WATER, quantity: 1, diameterMm: 15, oneWayRouteM: 5 },
      { fixtureType: PlumbingFixtureType.KITCHEN_SINK, system: PlumbingSystemType.WASTE, quantity: 1, diameterMm: 32, oneWayRouteM: 4 },
    ],
  },
  {
    roomType: RoomType.BATHROOM,
    code: 'bathroom-standard-kanpur',
    name: 'Standard bathroom (with shower)',
    description: 'Typical residential bathroom electrical and plumbing schedule.',
    typicalAreaSqFtMin: 40,
    typicalAreaSqFtMax: 60,
    electricalPoints: [
      { pointType: ElectricalPointType.LIGHT_POINT, purpose: ElectricalCircuitPurpose.LIGHTING, quantity: 1, oneWayRouteM: 3, numberOfConductors: 2, earthConductorCount: 0, conductorSizeSqmm: 1.5 },
      { pointType: ElectricalPointType.EXHAUST_FAN_POINT, purpose: ElectricalCircuitPurpose.OTHER, quantity: 1, oneWayRouteM: 4, numberOfConductors: 2, earthConductorCount: 1, conductorSizeSqmm: 1.5 },
      { pointType: ElectricalPointType.SOCKET_20A_GEYSER, purpose: ElectricalCircuitPurpose.GEYSER, quantity: 1, oneWayRouteM: 5, numberOfConductors: 2, earthConductorCount: 1, conductorSizeSqmm: 4 },
    ],
    plumbingFixtures: [
      { fixtureType: PlumbingFixtureType.WASH_BASIN, system: PlumbingSystemType.COLD_WATER, quantity: 1, diameterMm: 15, oneWayRouteM: 4 },
      { fixtureType: PlumbingFixtureType.WASH_BASIN, system: PlumbingSystemType.HOT_WATER, quantity: 1, diameterMm: 15, oneWayRouteM: 4 },
      { fixtureType: PlumbingFixtureType.WASH_BASIN, system: PlumbingSystemType.WASTE, quantity: 1, diameterMm: 32, oneWayRouteM: 3 },
      { fixtureType: PlumbingFixtureType.WC, system: PlumbingSystemType.COLD_WATER, quantity: 1, diameterMm: 15, oneWayRouteM: 3 },
      { fixtureType: PlumbingFixtureType.WC, system: PlumbingSystemType.SOIL, quantity: 1, diameterMm: 110, oneWayRouteM: 3 },
      { fixtureType: PlumbingFixtureType.SHOWER, system: PlumbingSystemType.COLD_WATER, quantity: 1, diameterMm: 15, oneWayRouteM: 4 },
      { fixtureType: PlumbingFixtureType.SHOWER, system: PlumbingSystemType.HOT_WATER, quantity: 1, diameterMm: 15, oneWayRouteM: 4 },
      { fixtureType: PlumbingFixtureType.SHOWER, system: PlumbingSystemType.WASTE, quantity: 1, diameterMm: 40, oneWayRouteM: 3 },
      { fixtureType: PlumbingFixtureType.FLOOR_DRAIN, system: PlumbingSystemType.WASTE, quantity: 1, diameterMm: 50, oneWayRouteM: 2 },
    ],
  },
  {
    roomType: RoomType.TOILET,
    code: 'toilet-standard-kanpur',
    name: 'Standard toilet (WC only)',
    description: 'Typical residential powder room / WC-only toilet electrical and plumbing schedule.',
    typicalAreaSqFtMin: 20,
    typicalAreaSqFtMax: 32,
    electricalPoints: [
      { pointType: ElectricalPointType.LIGHT_POINT, purpose: ElectricalCircuitPurpose.LIGHTING, quantity: 1, oneWayRouteM: 3, numberOfConductors: 2, earthConductorCount: 0, conductorSizeSqmm: 1.5 },
      { pointType: ElectricalPointType.EXHAUST_FAN_POINT, purpose: ElectricalCircuitPurpose.OTHER, quantity: 1, oneWayRouteM: 3, numberOfConductors: 2, earthConductorCount: 1, conductorSizeSqmm: 1.5 },
    ],
    plumbingFixtures: [
      { fixtureType: PlumbingFixtureType.WC, system: PlumbingSystemType.COLD_WATER, quantity: 1, diameterMm: 15, oneWayRouteM: 3 },
      { fixtureType: PlumbingFixtureType.WC, system: PlumbingSystemType.SOIL, quantity: 1, diameterMm: 110, oneWayRouteM: 3 },
      { fixtureType: PlumbingFixtureType.WASH_BASIN, system: PlumbingSystemType.COLD_WATER, quantity: 1, diameterMm: 15, oneWayRouteM: 3 },
      { fixtureType: PlumbingFixtureType.WASH_BASIN, system: PlumbingSystemType.WASTE, quantity: 1, diameterMm: 32, oneWayRouteM: 2 },
      { fixtureType: PlumbingFixtureType.FLOOR_DRAIN, system: PlumbingSystemType.WASTE, quantity: 1, diameterMm: 50, oneWayRouteM: 2 },
    ],
  },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL environment variable is not set');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    const region = await prisma.regionalProfile.upsert({
      where: { code: 'IN-UP-KANPUR' },
      update: { name: 'Kanpur, Uttar Pradesh (default)', state: 'Uttar Pradesh', city: 'Kanpur', country: 'IN', active: true },
      create: {
        code: 'IN-UP-KANPUR',
        name: 'Kanpur, Uttar Pradesh (default)',
        state: 'Uttar Pradesh',
        city: 'Kanpur',
        country: 'IN',
        seismicZone: 'III',
        active: true,
        notes: 'Approximate BIS seismic zone reference — not authoritative. Confirm against the current BIS zoning map before technical use.',
      },
    });

    for (const room of roomTemplates) {
      const roomTemplate = await prisma.roomTemplate.upsert({
        where: { code: room.code },
        update: {
          regionalProfileId: region.id,
          roomType: room.roomType,
          name: room.name,
          description: `${room.description} ${draftNote}`,
          typicalAreaSqFtMin: room.typicalAreaSqFtMin,
          typicalAreaSqFtMax: room.typicalAreaSqFtMax,
          status: TemplateStatus.DRAFT,
        },
        create: {
          regionalProfileId: region.id,
          roomType: room.roomType,
          code: room.code,
          name: room.name,
          description: `${room.description} ${draftNote}`,
          typicalAreaSqFtMin: room.typicalAreaSqFtMin,
          typicalAreaSqFtMax: room.typicalAreaSqFtMax,
          status: TemplateStatus.DRAFT,
        },
      });

      await prisma.electricalPointTemplate.deleteMany({ where: { roomTemplateId: roomTemplate.id } });
      for (const [index, point] of room.electricalPoints.entries()) {
        await prisma.electricalPointTemplate.create({
          data: { roomTemplateId: roomTemplate.id, ...point, notes: draftNote, sortOrder: index },
        });
      }

      await prisma.plumbingFixtureTemplate.deleteMany({ where: { roomTemplateId: roomTemplate.id } });
      for (const [index, fixture] of room.plumbingFixtures.entries()) {
        await prisma.plumbingFixtureTemplate.create({
          data: { roomTemplateId: roomTemplate.id, ...fixture, notes: draftNote, sortOrder: index },
        });
      }
    }

    console.log('Planning template seed completed (all rows created as DRAFT — review and publish before use).');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
