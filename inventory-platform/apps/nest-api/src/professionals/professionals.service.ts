import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfessionalType } from '@workspace/db';
import { PrismaService } from '../database/prisma.service';

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
  // Published packages only. An unpublished rate card is staff working
  // material, and must be indistinguishable from having none at all.
  packages: {
    where: { published: true },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      tagline: true,
      ratePerSqFt: true,
      inclusions: true,
      bestFor: true,
      materials: {
        orderBy: { sortOrder: 'asc' },
        select: { category: true, detail: true },
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
  tagline: string | null;
  // Prisma Decimal; serialises to a string over JSON.
  ratePerSqFt: unknown;
  inclusions: string[];
  bestFor: string[];
  materials: Array<{ category: string; detail: string }>;
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
