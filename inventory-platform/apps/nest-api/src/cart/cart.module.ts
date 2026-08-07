import { Module } from '@nestjs/common';
import { CustomerJwtAuthGuard } from '../auth/guards/customer-jwt.auth.guard';
import { OptionalCustomerJwtAuthGuard } from '../auth/guards/optional-customer-jwt.auth.guard';
import { QuoteRequestsModule } from '../quote-requests/quote-requests.module';
import { CartController, CartMergeController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  imports: [QuoteRequestsModule],
  controllers: [CartController, CartMergeController],
  providers: [CartService, CustomerJwtAuthGuard, OptionalCustomerJwtAuthGuard],
})
export class CartModule {}
