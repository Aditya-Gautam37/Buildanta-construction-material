import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, ProfessionalType } from '@workspace/db';
import type { PrismaService } from '../database/prisma.service';
import { PackageEnquiriesService, type PackageEnquiryInput } from './package-enquiries.service';

const contractor = { id: 'pro-1', type: ProfessionalType.CONTRACTOR };
const rateCard = {
  id: 'pkg-1',
  name: 'Standard',
  ratePerSqFt: new Prisma.Decimal('1450.00'),
  rateBasis: 'PLOT_AREA',
};

function serviceWith(overrides: {
  professional?: unknown;
  package?: unknown;
} = {}) {
  const create = jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
    Promise.resolve({
      reference: data.reference,
      packageNameSnapshot: data.packageNameSnapshot,
      amountSnapshot: data.amountSnapshot,
    }));
  const findFirstProfessional = jest.fn().mockResolvedValue(
    'professional' in overrides ? overrides.professional : contractor,
  );
  const findFirstPackage = jest.fn().mockResolvedValue(
    'package' in overrides ? overrides.package : rateCard,
  );

  const service = new PackageEnquiriesService({
    client: {
      professional: { findFirst: findFirstProfessional },
      contractorPackage: { findFirst: findFirstPackage },
      packageEnquiry: { create },
    },
  } as unknown as PrismaService);

  return { service, create, findFirstProfessional, findFirstPackage };
}

function input(overrides: Partial<PackageEnquiryInput> = {}): PackageEnquiryInput {
  return {
    professionalSlug: 'a-contractor',
    packageSlug: 'standard',
    customerName: 'A Customer',
    customerPhone: '+919000000000',
    areaSqFt: 900,
    consent: true,
    ...overrides,
  };
}

describe('PackageEnquiriesService', () => {
  describe('the server owns the price', () => {
    it('computes the amount from the stored rate, not from anything sent by the client', async () => {
      const { service, create } = serviceWith();
      // A hostile client posts its own rate and total alongside the real fields.
      await service.create({ ...input(), rateSnapshot: '1', amountSnapshot: '1' } as PackageEnquiryInput);

      const data = create.mock.calls[0][0].data;
      // 1450 x 900
      expect(data.amountSnapshot.toString()).toBe('1305000');
      expect(data.rateSnapshot.toString()).toBe('1450');
    });

    it('snapshots the package name and rate basis as they were at submission', async () => {
      const { service, create } = serviceWith();
      await service.create(input());
      const data = create.mock.calls[0][0].data;
      expect(data.packageNameSnapshot).toBe('Standard');
      expect(data.rateBasisSnapshot).toBe('PLOT_AREA');
    });

    it('rounds the amount to the nearest hundred, matching what the customer saw', async () => {
      const { service, create } = serviceWith({
        package: { ...rateCard, ratePerSqFt: new Prisma.Decimal('1333.33') },
      });
      await service.create(input({ areaSqFt: 750 }));
      // 1333.33 x 750 = 999,997.5 -> 1,000,000
      expect(create.mock.calls[0][0].data.amountSnapshot.toString()).toBe('1000000');
    });

    it('mints a unique-looking reference for the customer to quote', async () => {
      const { service, create } = serviceWith();
      await service.create(input());
      expect(create.mock.calls[0][0].data.reference).toMatch(/^PKG-[A-Z0-9]+-[A-Z0-9]{4}$/);
    });
  });

  describe('what it refuses', () => {
    it('requires consent before storing any personal details', async () => {
      const { service, create } = serviceWith();
      await expect(service.create(input({ consent: false }))).rejects.toBeInstanceOf(BadRequestException);
      expect(create).not.toHaveBeenCalled();
    });

    it.each([0, -1, 50, 200_000, Number.NaN])('rejects an area of %p', async (areaSqFt) => {
      const { service, create } = serviceWith();
      await expect(service.create(input({ areaSqFt }))).rejects.toBeInstanceOf(BadRequestException);
      expect(create).not.toHaveBeenCalled();
    });

    it('refuses an unpublished or unknown professional', async () => {
      const { service, create } = serviceWith({ professional: null });
      await expect(service.create(input())).rejects.toBeInstanceOf(NotFoundException);
      expect(create).not.toHaveBeenCalled();
    });

    it('refuses a professional who is not a contractor', async () => {
      const { service, create } = serviceWith({
        professional: { id: 'pro-2', type: ProfessionalType.ARCHITECT },
      });
      await expect(service.create(input())).rejects.toBeInstanceOf(BadRequestException);
      expect(create).not.toHaveBeenCalled();
    });

    it('refuses a package that is not published, so a guessed draft slug goes nowhere', async () => {
      const { service, create } = serviceWith({ package: null });
      await expect(service.create(input())).rejects.toBeInstanceOf(NotFoundException);
      expect(create).not.toHaveBeenCalled();
    });

    // Guessing another contractor's package slug must not attach the enquiry
    // to this one.
    it('looks the package up scoped to that professional, and while published', async () => {
      const { service, findFirstPackage } = serviceWith();
      await service.create(input());
      const where = findFirstPackage.mock.calls[0][0].where;
      expect(where.professionalId).toBe('pro-1');
      expect(where.slug).toBe('standard');
      expect(where.status).toBe('PUBLISHED');
    });

    it('only considers published professionals', async () => {
      const { service, findFirstProfessional } = serviceWith();
      await service.create(input());
      expect(findFirstProfessional.mock.calls[0][0].where).toMatchObject({ published: true });
    });
  });

  describe('what it returns', () => {
    it('confirms the enquiry without echoing the customer back to themselves', async () => {
      const { service } = serviceWith();
      const result = await service.create(input({ customerPhone: '+919812345678' }));

      expect(result).toHaveProperty('reference');
      expect(result.packageName).toBe('Standard');
      expect(JSON.stringify(result)).not.toContain('919812345678');
      expect(JSON.stringify(result)).not.toContain('A Customer');
    });

    it('records when consent was given, not merely that it was', async () => {
      const { service, create } = serviceWith();
      await service.create(input());
      expect(create.mock.calls[0][0].data.consentAt).toBeInstanceOf(Date);
    });
  });
});
