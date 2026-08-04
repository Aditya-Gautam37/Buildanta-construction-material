import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { UserRole } from '@workspace/db';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import {
  quotationAcceptSchema,
  quotationApprovalDecisionSchema,
  quotationRevisionCreateSchema,
  quotationStatusUpdateSchema,
  salesOrderCancelSchema,
} from '../common/request-schemas';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import type {
  QuotationAcceptDTO,
  QuotationApprovalDecisionDTO,
  QuotationRevisionCreateDTO,
  QuotationStatusUpdateDTO,
  SalesOrderCancelDTO,
} from './dto/quotation-dto';
import { QuotationsService } from './quotations.service';

type StaffRequest = { user: { id: string; databaseRole: UserRole } };

@Controller('quotations')
@UseGuards(JwtAuthGuard)
export class QuotationsController {
  constructor(private readonly service: QuotationsService) {}

  @Get('overview')
  overview(@Req() request: StaffRequest): Promise<unknown> {
    return this.service.overview(request.user.databaseRole);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body(new ZodValidationPipe(quotationStatusUpdateSchema)) input: QuotationStatusUpdateDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.updateStatus(id, input, request.user.id, request.user.databaseRole);
  }

  @Post(':id/revisions')
  createRevision(@Param('id') id: string, @Body(new ZodValidationPipe(quotationRevisionCreateSchema)) input: QuotationRevisionCreateDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.createRevision(id, input, request.user.id, request.user.databaseRole);
  }

  @Post(':id/approvals/:approvalId/decision')
  decideApproval(@Param('id') id: string, @Param('approvalId') approvalId: string, @Body(new ZodValidationPipe(quotationApprovalDecisionSchema)) input: QuotationApprovalDecisionDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.decideApproval(id, approvalId, input, request.user.id, request.user.databaseRole);
  }

  @Post(':id/send')
  send(@Param('id') id: string, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.send(id, request.user.id, request.user.databaseRole);
  }

  @Post(':id/accept')
  accept(@Param('id') id: string, @Body(new ZodValidationPipe(quotationAcceptSchema)) input: QuotationAcceptDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.accept(id, input, request.user.id, request.user.databaseRole);
  }

  @Post('sales-orders/:id/cancel')
  cancelSalesOrder(@Param('id') id: string, @Body(new ZodValidationPipe(salesOrderCancelSchema)) input: SalesOrderCancelDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.service.cancelSalesOrder(id, input, request.user.id, request.user.databaseRole);
  }
}
