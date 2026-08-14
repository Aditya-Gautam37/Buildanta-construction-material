import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DispatchStatus, SalesOrderStatus } from '@workspace/db';
import { PrismaService } from '../database/prisma.service';
import { QuotationsService } from '../quotations/quotations.service';

export type CustomerReturnInput={reason:string;items:{salesOrderItemId:string;quantity:number}[]};

@Injectable()
export class CustomerPortalService{
  constructor(private readonly prisma:PrismaService,private readonly quotations:QuotationsService){}
  async overview(email:string,customerUserId?:string):Promise<unknown>{
    const normalized=email.toLowerCase();
    // Match on the account first, falling back to the email the customer typed
    // at checkout. Orders placed before accounts were recorded only have the
    // email, and those customers should still see their history.
    const owner=customerUserId
      ?{OR:[{customerUserId},{customerEmail:{equals:normalized,mode:'insensitive' as const}}]}
      :{customerEmail:{equals:normalized,mode:'insensitive' as const}};
    const quotations=await this.prisma.client.quotation.findMany({where:owner,select:{id:true,reference:true,status:true,deliveryPincode:true,requiredBy:true,expiresAt:true,acceptedAt:true,createdAt:true,items:{select:{id:true,description:true,quantity:true,unitCode:true},orderBy:{sortOrder:'asc'}},revisions:{select:{id:true,number:true,validUntil:true,subtotal:true,gstTotal:true,freightTotal:true,discountTotal:true,grandTotal:true,sentAt:true,items:{select:{description:true,quantity:true,unitCode:true,unitPrice:true,gstPercent:true,lineTotal:true,estimatedLeadDays:true}}},orderBy:{number:'desc'},take:1},history:{select:{toStatus:true,createdAt:true},orderBy:{createdAt:'asc'}},salesOrder:{select:{id:true,reference:true,status:true,paymentStatus:true,grandTotal:true,reservedUntil:true,createdAt:true,items:{select:{id:true,description:true,quantity:true,unitCode:true}},deliverySchedules:{select:{status:true,scheduledFor:true},orderBy:{createdAt:'asc'}},dispatches:{select:{reference:true,status:true,trackingReference:true,dispatchedAt:true,deliveredAt:true,history:{select:{toStatus:true,createdAt:true},orderBy:{createdAt:'asc'}}},orderBy:{createdAt:'asc'}},returnRequests:{select:{reference:true,status:true,requestedAt:true,resolvedAt:true},orderBy:{createdAt:'asc'}}}}},orderBy:{createdAt:'desc'},take:50});
    return {quotations};
  }
  bookQuotation(id:string,actorId:string,email:string){return this.quotations.acceptForCustomer(id,{reason:'Customer booked complete BOQ'},actorId,email)}
  acceptQuotation(id:string,actorId:string,email:string){return this.bookQuotation(id,actorId,email)}
  cancelOrder(id:string,reason:string,actorId:string,email:string){return this.quotations.cancelSalesOrderForCustomer(id,{reason},actorId,email)}
  async requestReturn(orderId:string,input:CustomerReturnInput,actorId:string,email:string):Promise<unknown>{
    return this.prisma.client.$transaction(async tx=>{
      const order=await tx.salesOrder.findUnique({where:{id:orderId},include:{items:true,dispatches:{where:{status:DispatchStatus.DELIVERED},orderBy:{deliveredAt:'desc'}},returnRequests:{where:{status:{notIn:['REJECTED','RESOLVED','CANCELLED']}}}}});
      if(!order||order.customerEmail.toLowerCase()!==email.toLowerCase()) throw new NotFoundException('Delivered order not found.');
      if(order.status!==SalesOrderStatus.DELIVERED&&order.status!==SalesOrderStatus.RETURNED) throw new ConflictException('A return can be requested only after delivery.');
      if(order.returnRequests.length) throw new ConflictException('This order already has an open return request.');
      const dispatch=order.dispatches[0];if(!dispatch) throw new ConflictException('No delivered dispatch is available for return.');
      const itemMap=new Map(order.items.map(item=>[item.id,item]));
      if(!input.items.length) throw new BadRequestException('Choose at least one item to return.');
      const items=input.items.map(item=>{const orderItem=itemMap.get(item.salesOrderItemId);if(!orderItem||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>orderItem.quantity) throw new BadRequestException('Return quantity is invalid.');return {salesOrderItemId:orderItem.id,variantId:orderItem.variantId,fulfilmentLocationId:orderItem.fulfilmentLocationId,requestedQuantity:item.quantity}});
      return tx.returnRequest.create({data:{reference:`RET-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0,6).toUpperCase()}`,salesOrderId:order.id,dispatchId:dispatch.id,reason:input.reason,customerNotes:input.reason,actorId,items:{create:items}},include:{items:true}});
    });
  }
}
