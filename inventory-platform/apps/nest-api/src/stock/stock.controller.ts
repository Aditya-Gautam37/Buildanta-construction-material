import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { UserRole } from '@workspace/db';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { stockAdjustmentSchema } from '../common/request-schemas';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { StockAdjustmentDTO } from './dto/stock-adjustment-dto';
import { StockService } from './stock.service';

type StaffRequest = { user: { id: string; databaseRole: UserRole } };

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  list(): Promise<unknown> {
    return this.stockService.list();
  }

  @Post('adjustments')
  adjust(@Body(new ZodValidationPipe(stockAdjustmentSchema)) input: StockAdjustmentDTO, @Req() request: StaffRequest): Promise<unknown> {
    return this.stockService.adjust(input, request.user.id, request.user.databaseRole);
  }
}
