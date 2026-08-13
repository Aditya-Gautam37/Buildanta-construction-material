import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProfessionalType } from '@workspace/db';
import { PrismaService } from '../database/prisma.service';
import { publishedPackageWhere } from './professionals.service';

export type PackageEnquiryInput = {
  professionalSlug: string;
  packageSlug: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  projectLocation?: string;
  plotDimensions?: string;
  areaSqFt: number;
  floors?: number;
  constructionType?: string;
  expectedStart?: string;
  requirement?: string;
  consent: boolean;
};

// Mirrors the storefront calculator's limits. Duplicated deliberately: the
// browser's bounds are a convenience, the server's are the rule.
export const MIN_AREA_SQ_FT = 100;
export const MAX_AREA_SQ_FT = 100_000;

function reference(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const random = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `PKG-${stamp}-${random}`;
}

@Injectable()
export class PackageEnquiriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an enquiry against a published package.
   *
   * Nothing about the price comes from the browser. The package is reloaded by
   * slug, its publication and validity re-checked, and the amount recomputed
   * here — a client that posts its own rate or total is simply ignored. The
   * result is snapshotted so a later price change cannot rewrite history.
   */
  async create(input: PackageEnquiryInput) {
    if (!input.consent) {
      throw new BadRequestException('Please confirm you are happy for us to contact you about this enquiry.');
    }

    const area = Number(input.areaSqFt);
    if (!Number.isFinite(area) || area < MIN_AREA_SQ_FT || area > MAX_AREA_SQ_FT) {
      throw new BadRequestException(`Enter an area between ${MIN_AREA_SQ_FT} and ${MAX_AREA_SQ_FT.toLocaleString('en-IN')} sq ft.`);
    }

    const professional = await this.prisma.client.professional.findFirst({
      where: { slug: input.professionalSlug, published: true },
      select: { id: true, type: true },
    });
    if (!professional) throw new NotFoundException('That professional is not available.');
    if (professional.type !== ProfessionalType.CONTRACTOR) {
      throw new BadRequestException('Construction packages are offered by contractors only.');
    }

    // The package must belong to this professional and be publicly visible:
    // a caller cannot enquire about someone else's package, or a draft, by
    // guessing a slug.
    const rateCard = await this.prisma.client.contractorPackage.findFirst({
      where: {
        slug: input.packageSlug,
        professionalId: professional.id,
        ...publishedPackageWhere(),
      },
      select: { id: true, name: true, ratePerSqFt: true, rateBasis: true },
    });
    if (!rateCard) throw new NotFoundException('That package is no longer available.');

    const rate = new Prisma.Decimal(rateCard.ratePerSqFt);
    // Rounded to the nearest 100, matching what the customer was shown.
    const amount = rate.mul(area).div(100).round().mul(100);

    const enquiry = await this.prisma.client.packageEnquiry.create({
      data: {
        reference: reference(),
        professionalId: professional.id,
        packageId: rateCard.id,
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone.trim(),
        customerEmail: input.customerEmail?.trim() || null,
        projectLocation: input.projectLocation?.trim() || null,
        plotDimensions: input.plotDimensions?.trim() || null,
        areaSqFt: new Prisma.Decimal(area),
        floors: Number.isInteger(input.floors) ? input.floors : null,
        constructionType: input.constructionType?.trim() || null,
        expectedStart: input.expectedStart?.trim() || null,
        requirement: input.requirement?.trim() || null,
        consentAt: new Date(),
        packageNameSnapshot: rateCard.name,
        rateSnapshot: rate,
        rateBasisSnapshot: rateCard.rateBasis,
        amountSnapshot: amount,
      },
      select: { reference: true, packageNameSnapshot: true, amountSnapshot: true },
    });

    // Deliberately narrow: the response confirms the enquiry without echoing
    // back the customer's own contact details.
    return {
      reference: enquiry.reference,
      packageName: enquiry.packageNameSnapshot,
      amount: enquiry.amountSnapshot.toString(),
    };
  }
}
