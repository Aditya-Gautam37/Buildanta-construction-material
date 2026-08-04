import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { UserRole } from '@workspace/db';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { FulfilmentOperationsService } from './fulfilment-operations.service';
import {
  decisionSchema, dispatchCreateSchema, goodsReceiptCreateSchema, pickingCreateSchema, proofOfDeliverySchema,
  purchaseOrderCreateSchema, requisitionCreateSchema, returnCreateSchema, returnInspectSchema, returnReceiveSchema,
  rfqCreateSchema, supplierResponseSchema, supplierReturnCreateSchema,
  type DecisionInput, type DispatchCreateInput, type GoodsReceiptCreateInput, type PickingCreateInput,
  type ProofOfDeliveryInput, type PurchaseOrderCreateInput, type RequisitionCreateInput, type ReturnCreateInput,
  type ReturnInspectInput, type ReturnReceiveInput, type RfqCreateInput, type SupplierResponseInput,
  type SupplierReturnCreateInput,
} from './operations.schemas';

type StaffRequest = { user: { id: string; databaseRole: UserRole } };

@Controller('fulfilment-operations')
@UseGuards(JwtAuthGuard)
export class FulfilmentOperationsController {
  constructor(private readonly service: FulfilmentOperationsService) {}
  @Get('overview') overview() { return this.service.overview(); }
  @Get('dashboard') dashboard(@Req() req: StaffRequest) { return this.service.dashboard(req.user.databaseRole); }
  @Post('requisitions') createRequisition(@Body(new ZodValidationPipe(requisitionCreateSchema)) input: RequisitionCreateInput, @Req() req: StaffRequest) { return this.service.createRequisition(input, req.user.id, req.user.databaseRole); }
  @Post('requisitions/:id/submit') submitRequisition(@Param('id') id: string, @Req() req: StaffRequest) { return this.service.submitRequisition(id, req.user.id, req.user.databaseRole); }
  @Post('requisitions/:id/decision') decideRequisition(@Param('id') id: string, @Body(new ZodValidationPipe(decisionSchema)) input: DecisionInput, @Req() req: StaffRequest) { return this.service.decideRequisition(id, input, req.user.id, req.user.databaseRole); }
  @Post('requisitions/:id/rfqs') createRfq(@Param('id') id: string, @Body(new ZodValidationPipe(rfqCreateSchema)) input: RfqCreateInput, @Req() req: StaffRequest) { return this.service.createRfq(id, input, req.user.id, req.user.databaseRole); }
  @Post('rfqs/:id/responses') addResponse(@Param('id') id: string, @Body(new ZodValidationPipe(supplierResponseSchema)) input: SupplierResponseInput, @Req() req: StaffRequest) { return this.service.addSupplierResponse(id, input, req.user.databaseRole); }
  @Post('responses/:id/purchase-order') createPurchaseOrder(@Param('id') id: string, @Body(new ZodValidationPipe(purchaseOrderCreateSchema)) input: PurchaseOrderCreateInput, @Req() req: StaffRequest) { return this.service.createPurchaseOrder(id, input, req.user.id, req.user.databaseRole); }
  @Post('purchase-orders/:id/decision') decidePurchaseOrder(@Param('id') id: string, @Body(new ZodValidationPipe(decisionSchema)) input: DecisionInput, @Req() req: StaffRequest) { return this.service.decidePurchaseOrder(id, input, req.user.id, req.user.databaseRole); }
  @Post('purchase-orders/:id/send') sendPurchaseOrder(@Param('id') id: string, @Req() req: StaffRequest) { return this.service.sendPurchaseOrder(id, req.user.id, req.user.databaseRole); }
  @Post('goods-receipts') createGoodsReceipt(@Body(new ZodValidationPipe(goodsReceiptCreateSchema)) input: GoodsReceiptCreateInput, @Req() req: StaffRequest) { return this.service.createGoodsReceipt(input, req.user.databaseRole); }
  @Post('goods-receipts/:id/post') postGoodsReceipt(@Param('id') id: string, @Req() req: StaffRequest) { return this.service.postGoodsReceipt(id, req.user.id, req.user.databaseRole); }
  @Post('picking-lists') createPickingList(@Body(new ZodValidationPipe(pickingCreateSchema)) input: PickingCreateInput, @Req() req: StaffRequest) { return this.service.createPickingList(input, req.user.id, req.user.databaseRole); }
  @Post('dispatches') createDispatch(@Body(new ZodValidationPipe(dispatchCreateSchema)) input: DispatchCreateInput, @Req() req: StaffRequest) { return this.service.createDispatch(input, req.user.id, req.user.databaseRole); }
  @Post('dispatches/:id/post') postDispatch(@Param('id') id: string, @Req() req: StaffRequest) { return this.service.postDispatch(id, req.user.id, req.user.databaseRole); }
  @Post('dispatches/:id/deliver') deliverDispatch(@Param('id') id: string, @Body(new ZodValidationPipe(proofOfDeliverySchema)) input: ProofOfDeliveryInput, @Req() req: StaffRequest) { return this.service.deliverDispatch(id, input, req.user.id, req.user.databaseRole); }
  @Post('returns') createReturn(@Body(new ZodValidationPipe(returnCreateSchema)) input: ReturnCreateInput, @Req() req: StaffRequest) { return this.service.createReturn(input, req.user.id, req.user.databaseRole); }
  @Post('returns/:id/approve') approveReturn(@Param('id') id: string, @Req() req: StaffRequest) { return this.service.approveReturn(id, req.user.id, req.user.databaseRole); }
  @Post('returns/:id/receive') receiveReturn(@Param('id') id: string, @Body(new ZodValidationPipe(returnReceiveSchema)) input: ReturnReceiveInput, @Req() req: StaffRequest) { return this.service.receiveReturn(id, input, req.user.id, req.user.databaseRole); }
  @Post('returns/:id/inspect') inspectReturn(@Param('id') id: string, @Body(new ZodValidationPipe(returnInspectSchema)) input: ReturnInspectInput, @Req() req: StaffRequest) { return this.service.inspectReturn(id, input, req.user.id, req.user.databaseRole); }
  @Post('supplier-returns') createSupplierReturn(@Body(new ZodValidationPipe(supplierReturnCreateSchema)) input: SupplierReturnCreateInput, @Req() req: StaffRequest) { return this.service.createSupplierReturn(input, req.user.id, req.user.databaseRole); }
  @Post('supplier-returns/:id/dispatch') dispatchSupplierReturn(@Param('id') id: string, @Req() req: StaffRequest) { return this.service.dispatchSupplierReturn(id, req.user.id, req.user.databaseRole); }
}
