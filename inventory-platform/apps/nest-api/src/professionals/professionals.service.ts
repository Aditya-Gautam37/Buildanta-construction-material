import { Injectable, NotFoundException } from '@nestjs/common';
import { PackageStatus, ProfessionalType } from '@workspace/db';
import { PrismaService } from '../database/prisma.service';

// The single definition of "a customer may see this package". Publication is
// decided here, at the query, so a client can never widen it by asking for
// more — and an expired rate card stops advertising itself without anyone
// having to remember to unpublish it.
export function publishedPackageWhere(now: Date = new Date()) {
  return {
    status: PackageStatus.PUBLISHED,
    AND: [
      { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
      { OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
    ],
  };
}

// This endpoint is unauthenticated: anything listed here is readable by anyone
// who opens the URL. A professional's email and phone are personal contact
// details they gave us to be reachable through Buildanta, not to be published
// on the open web — so they are deliberately absent, along with internal
// bookkeeping fields. Staff tooling reads the professional table directly and
// is unaffected by this.
const publicProfessionalSelect = {
  id: true,
  name: true,
  slug: true,
  type: true,
  headline: true,
  bio: true,
  photoUrl: true,
  location: true,
  yearsExperience: true,
  website: true,
  portfolioUrl: true,
  services: true,
  featured: true,
  // Published packages only, and only ones still within their validity window.
  // A draft, under-review or archived rate card is staff working material and
  // must be indistinguishable from having none at all.
  packages: {
    where: publishedPackageWhere(),
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      tagline: true,
      summary: true,
      ratePerSqFt: true,
      rateBasis: true,
      exampleArea: true,
      exampleCost: true,
      bestFor: true,
      exclusions: true,
      terms: true,
      validFrom: true,
      validUntil: true,
      inclusionItems: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          category: true,
          label: true,
          description: true,
          allowanceAmount: true,
          allowanceUnit: true,
        },
      },
      materials: {
        orderBy: { sortOrder: 'asc' },
        select: { category: true, specification: true, preferredBrands: true, substitutionNote: true },
      },
    },
  },
} as const;

export type PublicProfessional = {
  id: string;
  name: string;
  slug: string;
  type: ProfessionalType;
  headline: string | null;
  bio: string | null;
  photoUrl: string | null;
  location: string;
  yearsExperience: number;
  website: string | null;
  portfolioUrl: string | null;
  services: string[];
  featured: boolean;
  packages: PublicContractorPackage[];
};

export type PublicContractorPackage = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  summary: string | null;
  // Prisma Decimal; serialises to a string over JSON.
  ratePerSqFt: unknown;
  rateBasis: string;
  exampleArea: unknown;
  exampleCost: unknown;
  bestFor: string[];
  exclusions: string[];
  terms: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
  inclusionItems: Array<{
    id: string;
    category: string;
    label: string;
    description: string | null;
    allowanceAmount: unknown;
    allowanceUnit: string | null;
  }>;
  materials: Array<{
    category: string;
    specification: string;
    preferredBrands: string | null;
    substitutionNote: string | null;
  }>;
};

@Injectable()
export class ProfessionalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(type?: ProfessionalType): Promise<PublicProfessional[]> {
    return this.prisma.client.professional.findMany({
      where: { published: true, type },
      select: publicProfessionalSelect,
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(slug: string): Promise<PublicProfessional> {
    const professional = await this.prisma.client.professional.findFirst({
      where: { slug, published: true },
      select: publicProfessionalSelect,
    });
    if (!professional) {
      throw new NotFoundException('Professional not found.');
    }
    return professional;
  }
}
