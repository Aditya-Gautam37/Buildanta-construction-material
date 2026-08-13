import { NotFoundException } from '@nestjs/common';
import { ProfessionalType } from '@workspace/db';
import type { PrismaService } from '../database/prisma.service';
import { ProfessionalsService } from './professionals.service';

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
