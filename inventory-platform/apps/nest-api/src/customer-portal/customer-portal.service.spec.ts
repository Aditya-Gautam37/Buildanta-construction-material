import { ConflictException } from '@nestjs/common';
import { SalesOrderStatus } from '@workspace/db';
import type { PrismaService } from '../database/prisma.service';
import type { QuotationsService } from '../quotations/quotations.service';
import { CustomerPortalService } from './customer-portal.service';

describe('CustomerPortalService',()=>{
  it('scopes the customer overview to the authenticated email',async()=>{
    const findMany=jest.fn().mockResolvedValue([]);
    const service=new CustomerPortalService({client:{quotation:{findMany}}} as unknown as PrismaService,{} as QuotationsService);
    await service.overview('CUSTOMER@EXAMPLE.COM');
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({where:{customerEmail:{equals:'customer@example.com',mode:'insensitive'}}}));
  });
  it('passes customer ownership to the atomic complete-BOQ booking workflow',async()=>{
    const acceptForCustomer=jest.fn().mockResolvedValue({id:'order-1'});
    const service=new CustomerPortalService({} as PrismaService,{acceptForCustomer} as unknown as QuotationsService);
    await service.bookQuotation('quote-1','customer-1','Customer@Example.com');
    expect(acceptForCustomer).toHaveBeenCalledWith('quote-1',{reason:'Customer booked complete BOQ'},'customer-1','Customer@Example.com');
  });
  it('rejects a customer return before delivery',async()=>{
    const tx={salesOrder:{findUnique:jest.fn().mockResolvedValue({customerEmail:'customer@example.com',status:SalesOrderStatus.CONFIRMED,items:[],dispatches:[],returnRequests:[]})}};
    const prisma={client:{$transaction:jest.fn((callback:(client:typeof tx)=>unknown)=>callback(tx))}} as unknown as PrismaService;
    const service=new CustomerPortalService(prisma,{} as QuotationsService);
    await expect(service.requestReturn('order-1',{reason:'Not needed',items:[{salesOrderItemId:'item-1',quantity:1}]},'customer-1','customer@example.com')).rejects.toBeInstanceOf(ConflictException);
  });
});
