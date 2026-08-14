import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CustomerJwtAuthGuard } from '../auth/guards/customer-jwt.auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CustomerPortalService, type CustomerReturnInput } from './customer-portal.service';

const reasonSchema=z.object({reason:z.string().trim().min(3).max(1000)}).strict();
const returnSchema=z.object({reason:z.string().trim().min(3).max(1000),items:z.array(z.object({salesOrderItemId:z.string().trim().min(1),quantity:z.number().int().positive()}).strict()).min(1).max(100)}).strict();
type RequestUser={user:{id:string;email:string}};
@Controller('customer-portal')
@UseGuards(CustomerJwtAuthGuard)
export class CustomerPortalController{
  constructor(private readonly service:CustomerPortalService){}
  @Get() overview(@Req() request:RequestUser):Promise<unknown>{return this.service.overview(request.user.email,request.user.id)}
  @Post('quotations/:id/book') book(@Param('id') id:string,@Req() request:RequestUser){return this.service.bookQuotation(id,request.user.id,request.user.email)}
  @Post('quotations/:id/accept') accept(@Param('id') id:string,@Req() request:RequestUser){return this.service.acceptQuotation(id,request.user.id,request.user.email)}
  @Post('sales-orders/:id/cancel') cancel(@Param('id') id:string,@Body(new ZodValidationPipe(reasonSchema)) input:z.infer<typeof reasonSchema>,@Req() request:RequestUser){return this.service.cancelOrder(id,input.reason,request.user.id,request.user.email)}
  @Post('sales-orders/:id/returns') requestReturn(@Param('id') id:string,@Body(new ZodValidationPipe(returnSchema)) input:CustomerReturnInput,@Req() request:RequestUser):Promise<unknown>{return this.service.requestReturn(id,input,request.user.id,request.user.email)}
}
