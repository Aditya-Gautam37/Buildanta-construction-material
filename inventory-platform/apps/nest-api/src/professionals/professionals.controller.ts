import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { ProfessionalType } from '@workspace/db';
import { ProfessionalsService, type PublicProfessional } from './professionals.service';

const publicTypes = new Set(Object.values(ProfessionalType));

@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

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
