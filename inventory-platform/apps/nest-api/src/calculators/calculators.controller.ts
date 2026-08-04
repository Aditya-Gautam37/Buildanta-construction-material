import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { UserRole } from '@workspace/db';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  calculatorDefinitionCreateSchema,
  calculatorDefinitionUpdateSchema,
  calculatorMappingUpsertSchema,
  calculatorPublishSchema,
  calculatorRunSchema,
  calculatorSelectionSchema,
  calculatorVersionCreateSchema,
  estimateQuotationSchema,
  type CalculatorDefinitionCreateInput,
  type CalculatorDefinitionUpdateInput,
  type CalculatorMappingUpsertInput,
  type CalculatorPublishInput,
  type CalculatorRunInput,
  type CalculatorSelectionInput,
  type CalculatorVersionCreateInput,
  type EstimateQuotationInput,
} from './calculator.schemas';
import { CalculatorsService } from './calculators.service';

type StaffRequest = { user: { id: string; databaseRole: UserRole } };

@Controller('calculators')
@UseGuards(ThrottlerGuard)
export class CalculatorsController {
  constructor(private readonly service: CalculatorsService) {}

  @Get('public')
  publicDefinitions(): Promise<unknown> {
    return this.service.publicDefinitions();
  }

  @Get('public/:slug')
  publicDefinition(@Param('slug') slug: string): Promise<unknown> {
    return this.service.publicDefinition(slug);
  }

  @Post('public/:slug/calculate')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  calculate(@Param('slug') slug: string, @Body(new ZodValidationPipe(calculatorRunSchema)) input: CalculatorRunInput): Promise<unknown> {
    return this.service.calculate(slug, input);
  }

  @Get('public/estimates/:reference')
  estimate(@Param('reference') reference: string): Promise<unknown> {
    return this.service.publicEstimate(reference);
  }

  @Post('public/estimates/:reference/selection')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  selectProducts(@Param('reference') reference: string, @Body(new ZodValidationPipe(calculatorSelectionSchema)) input: CalculatorSelectionInput): Promise<unknown> {
    return this.service.updateSelection(reference, input);
  }

  @Post('public/estimates/:reference/quotation')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  addToQuotation(@Param('reference') reference: string, @Body(new ZodValidationPipe(estimateQuotationSchema)) input: EstimateQuotationInput): Promise<unknown> {
    return this.service.addToQuotation(reference, input);
  }

  @Get('admin/overview')
  @UseGuards(JwtAuthGuard)
  overview(@Req() request: StaffRequest): Promise<unknown> {
    return this.service.adminOverview(request.user.databaseRole);
  }

  @Get('admin/estimates')
  @UseGuards(JwtAuthGuard)
  estimates(@Req() request: StaffRequest): Promise<unknown> {
    return this.service.adminEstimates(request.user.databaseRole);
  }

  @Post('admin/definitions')
  @UseGuards(JwtAuthGuard)
  createDefinition(@Body(new ZodValidationPipe(calculatorDefinitionCreateSchema)) input: CalculatorDefinitionCreateInput, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.createDefinition(input, request.user.id, request.user.databaseRole);
  }

  @Patch('admin/definitions/:id')
  @UseGuards(JwtAuthGuard)
  updateDefinition(@Param('id') id: string, @Body(new ZodValidationPipe(calculatorDefinitionUpdateSchema)) input: CalculatorDefinitionUpdateInput, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.updateDefinition(id, input, request.user.id, request.user.databaseRole);
  }

  @Post('admin/definitions/:id/versions')
  @UseGuards(JwtAuthGuard)
  createVersion(@Param('id') id: string, @Body(new ZodValidationPipe(calculatorVersionCreateSchema)) input: CalculatorVersionCreateInput, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.createVersion(id, input, request.user.id, request.user.databaseRole);
  }

  @Post('admin/versions/:id/mappings')
  @UseGuards(JwtAuthGuard)
  upsertMapping(@Param('id') id: string, @Body(new ZodValidationPipe(calculatorMappingUpsertSchema)) input: CalculatorMappingUpsertInput, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.upsertMapping(id, input, request.user.id, request.user.databaseRole);
  }

  @Post('admin/versions/:id/publish')
  @UseGuards(JwtAuthGuard)
  publish(@Param('id') id: string, @Body(new ZodValidationPipe(calculatorPublishSchema)) input: CalculatorPublishInput, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.publishVersion(id, input, request.user.id, request.user.databaseRole);
  }
}
