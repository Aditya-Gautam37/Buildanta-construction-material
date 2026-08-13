import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { UserRole } from '@workspace/db';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { FriendlyThrottlerGuard } from '../common/friendly-throttler.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { materialKnowledgeAskSchema, materialKnowledgeUpsertSchema, materialRelatedProductsReplaceSchema } from '../common/request-schemas';
import { MaterialKnowledgeService } from './material-knowledge.service';

type StaffRequest = { user: { id: string; databaseRole: UserRole } };

@Controller()
export class MaterialKnowledgeController {
  constructor(private readonly service: MaterialKnowledgeService) {}

  // Customer-facing — published, verified knowledge only.
  @Get('products/:productId/material-knowledge')
  getPublished(@Param('productId') productId: string) {
    return this.service.getPublished(productId);
  }

  // Customer-facing and unauthenticated, so it is rate limited per IP: each
  // call costs a paid/quota-limited AI request.
  @Post('products/:productId/material-knowledge/ask')
  @HttpCode(HttpStatus.OK)
  @UseGuards(FriendlyThrottlerGuard)
  @Throttle({ default: { limit: 15, ttl: 3_600_000 } })
  ask(
    @Param('productId') productId: string,
    @Body(new ZodValidationPipe(materialKnowledgeAskSchema)) input: { question: string },
  ) {
    return this.service.ask(productId, input.question);
  }

  @Get('material-knowledge')
  @UseGuards(JwtAuthGuard)
  list() {
    return this.service.listForStaff();
  }

  @Get('material-knowledge/:productId')
  @UseGuards(JwtAuthGuard)
  getForStaff(@Param('productId') productId: string) {
    return this.service.getForStaff(productId);
  }

  @Put('material-knowledge/:productId')
  @UseGuards(JwtAuthGuard)
  upsert(
    @Param('productId') productId: string,
    @Body(new ZodValidationPipe(materialKnowledgeUpsertSchema)) input: Record<string, unknown>,
    @Req() req: StaffRequest,
  ) {
    return this.service.upsert(productId, input, req.user.databaseRole);
  }

  @Post('material-knowledge/:productId/publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  publish(@Param('productId') productId: string, @Req() req: StaffRequest) {
    return this.service.publish(productId, req.user.id, req.user.databaseRole);
  }

  @Post('material-knowledge/:productId/archive')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  archive(@Param('productId') productId: string, @Req() req: StaffRequest) {
    return this.service.archive(productId, req.user.databaseRole);
  }

  @Put('material-knowledge/:productId/related')
  @UseGuards(JwtAuthGuard)
  replaceRelated(
    @Param('productId') productId: string,
    @Body(new ZodValidationPipe(materialRelatedProductsReplaceSchema)) input: { items: Array<{ relatedProductId: string; role: string; reason: string; sequenceNote?: string; sortOrder?: number }> },
    @Req() req: StaffRequest,
  ) {
    return this.service.replaceRelated(productId, input.items, req.user.databaseRole);
  }
}
