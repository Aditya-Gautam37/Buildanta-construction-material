import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ProfessionalType } from '@workspace/db';
import { FriendlyThrottlerGuard } from '../common/friendly-throttler.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { packageEnquirySchema } from '../common/request-schemas';
import { PackageEnquiriesService } from './package-enquiries.service';
import { ProfessionalsService, type PublicProfessional } from './professionals.service';

const publicTypes = new Set(Object.values(ProfessionalType));

@Controller('professionals')
export class ProfessionalsController {
  constructor(
    private readonly professionalsService: ProfessionalsService,
    private readonly packageEnquiriesService: PackageEnquiriesService,
  ) {}

  // Unauthenticated and writes personal data, so it is rate limited per IP.
  @Post(':professionalSlug/packages/:packageSlug/enquiries')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(FriendlyThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  createEnquiry(
    @Param('professionalSlug') professionalSlug: string,
    @Param('packageSlug') packageSlug: string,
    @Body(new ZodValidationPipe(packageEnquirySchema)) input: Record<string, unknown>,
  ): Promise<unknown> {
    return this.packageEnquiriesService.create({
      ...(input as Omit<Parameters<PackageEnquiriesService['create']>[0], 'professionalSlug' | 'packageSlug'>),
      professionalSlug,
      packageSlug,
    });
  }

  @Get()
  findAll(@Query('type') type?: string): Promise<PublicProfessional[]> {
    if (type && !publicTypes.has(type as ProfessionalType)) {
      throw new BadRequestException('Invalid professional type.');
    }
    return this.professionalsService.findAll(type as ProfessionalType | undefined);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string): Promise<PublicProfessional> {
    return this.professionalsService.findOne(slug);
  }
}
