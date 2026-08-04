import { Module } from '@nestjs/common';
import { QuotationsModule } from '../quotations/quotations.module';
import { CustomerJwtAuthGuard } from '../auth/guards/customer-jwt.auth.guard';
import { CustomerPortalController } from './customer-portal.controller';
import { CustomerPortalService } from './customer-portal.service';
@Module({imports:[QuotationsModule],controllers:[CustomerPortalController],providers:[CustomerPortalService,CustomerJwtAuthGuard]})
export class CustomerPortalModule{}
