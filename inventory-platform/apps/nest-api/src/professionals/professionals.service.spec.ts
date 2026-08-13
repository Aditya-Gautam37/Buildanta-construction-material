import { NotFoundException } from '@nestjs/common';
import { PackageStatus, ProfessionalType } from '@workspace/db';
import type { PrismaService } from '../database/prisma.service';
import { ProfessionalsService, publishedPackageWhere } from './professionals.service';

function serviceWith(professional: Record<string, unknown>) {
  const findMany = jest.fn().mockResolvedValue([professional]);
  const findFirst = jest.fn().mockResolvedValue(professional);
  const service = new ProfessionalsService({
    client: { professional: { findMany, findFirst } },
  } as unknown as PrismaService);
  return { service, findMany, findFirst };
}

const record = { id: 'p1', name: 'A Contractor', slug: 'a-contractor', type: ProfessionalType.CONTRACTOR };

describe('ProfessionalsService', () => {
  // This endpoint is public and unauthenticated. Selecting columns explicitly
  // is what keeps a professional's personal contact details off the open web,
  // so the select itself is worth pinning down.
  describe('public field selection', () => {
    it('never asks the database for email or phone', async () => {
      const { service, findMany } = serviceWith(record);
      await service.findAll();
      const select = (findMany.mock.calls[0] as [{ select: Record<string, unknown> }])[0].select;
      expect(select).not.toHaveProperty('email');
      expect(select).not.toHaveProperty('phone');
    });

    it('applies the same restriction to a single profile lookup', async () => {
      const { service, findFirst } = serviceWith(record);
      await service.findOne('a-contractor');
      const select = (findFirst.mock.calls[0] as [{ select: Record<string, unknown> }])[0].select;
      expect(select).not.toHaveProperty('email');
      expect(select).not.toHaveProperty('phone');
    });

    it('withholds internal bookkeeping fields from customers', async () => {
      const { service, findMany } = serviceWith(record);
      await service.findAll();
      const select = (findMany.mock.calls[0] as [{ select: Record<string, unknown> }])[0].select;
      for (const internal of ['published', 'sortOrder', 'createdAt', 'updatedAt']) {
        expect(select).not.toHaveProperty(internal);
      }
    });

    it('still returns everything the storefront needs to render a profile', async () => {
      const { service, findMany } = serviceWith(record);
      await service.findAll();
      const select = (findMany.mock.calls[0] as [{ select: Record<string, unknown> }])[0].select;
      for (const field of ['id', 'name', 'slug', 'type', 'headline', 'bio', 'photoUrl', 'location', 'yearsExperience', 'website', 'portfolioUrl', 'services', 'featured']) {
        expect(select).toHaveProperty(field, true);
      }
    });
  });

  describe('contractor packages', () => {
    it('asks for PUBLISHED packages only, so drafts and archived cards stay internal', async () => {
      const { service, findMany } = serviceWith(record);
      await service.findAll();
      const where = (findMany.mock.calls[0] as [{ select: { packages: { where: { status: string } } } }])[0].select.packages.where;
      expect(where.status).toBe(PackageStatus.PUBLISHED);
    });

    it('returns packages and their materials in the order staff arranged them', async () => {
      const { service, findMany } = serviceWith(record);
      await service.findAll();
      const packages = (findMany.mock.calls[0] as [{ select: { packages: Record<string, unknown> } }])[0].select.packages;
      expect(packages.orderBy).toEqual({ sortOrder: 'asc' });
      expect((packages.select as { materials: { orderBy: unknown } }).materials.orderBy).toEqual({ sortOrder: 'asc' });
    });

    it('serves everything the calculator and comparison need', async () => {
      const { service, findMany } = serviceWith(record);
      await service.findAll();
      const packageSelect = (findMany.mock.calls[0] as [{ select: { packages: { select: Record<string, unknown> } } }])[0].select.packages.select;
      for (const field of ['id', 'name', 'slug', 'ratePerSqFt', 'rateBasis', 'bestFor', 'exclusions', 'terms']) {
        expect(packageSelect).toHaveProperty(field, true);
      }
      expect(packageSelect).toHaveProperty('inclusionItems');
    });
  });

  // An advertised rate with an expiry has to stop advertising itself, without
  // depending on someone remembering to unpublish it.
  describe('publishedPackageWhere', () => {
    const now = new Date('2026-06-15T00:00:00.000Z');

    it('requires PUBLISHED status', () => {
      expect(publishedPackageWhere(now).status).toBe(PackageStatus.PUBLISHED);
    });

    it('accepts a package with no validity window at all', () => {
      const { AND: [from, until] } = publishedPackageWhere(now);
      if (!from || !until) throw new Error('validity clauses missing');
      expect(from.OR).toContainEqual({ validFrom: null });
      expect(until.OR).toContainEqual({ validUntil: null });
    });

    it('excludes packages that have not started or have expired, relative to now', () => {
      const { AND: [from, until] } = publishedPackageWhere(now);
      if (!from || !until) throw new Error('validity clauses missing');
      expect(from.OR).toContainEqual({ validFrom: { lte: now } });
      expect(until.OR).toContainEqual({ validUntil: { gte: now } });
    });
  });

  describe('publication', () => {
    it('lists only published professionals', async () => {
      const { service, findMany } = serviceWith(record);
      await service.findAll();
      const args = (findMany.mock.calls[0] as [{ where: Record<string, unknown> }])[0];
      expect(args.where).toMatchObject({ published: true });
    });

    it('filters by type when one is given', async () => {
      const { service, findMany } = serviceWith(record);
      await service.findAll(ProfessionalType.ARCHITECT);
      const args = (findMany.mock.calls[0] as [{ where: Record<string, unknown> }])[0];
      expect(args.where).toMatchObject({ type: ProfessionalType.ARCHITECT });
    });

    it('will not serve an unpublished profile by slug', async () => {
      const findFirst = jest.fn().mockResolvedValue(null);
      const service = new ProfessionalsService({
        client: { professional: { findFirst } },
      } as unknown as PrismaService);

      await expect(service.findOne('hidden')).rejects.toBeInstanceOf(NotFoundException);
      expect((findFirst.mock.calls[0] as [{ where: Record<string, unknown> }])[0].where)
        .toMatchObject({ published: true });
    });
  });
});
