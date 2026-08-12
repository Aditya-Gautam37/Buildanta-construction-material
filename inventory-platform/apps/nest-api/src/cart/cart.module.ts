import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomerJwtAuthGuard } from '../auth/guards/customer-jwt.auth.guard';
import { OptionalCustomerJwtAuthGuard } from '../auth/guards/optional-customer-jwt.auth.guard';
import { QuoteRequestsModule } from '../quote-requests/quote-requests.module';
import { CartController, CartMergeController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  imports: [
    QuoteRequestsModule,
    // forRootAsync (not forRoot) so the limit is read from ConfigService once
    // it's actually resolved, rather than baked in at import time — a plain
    // ThrottlerModule.forRoot([...]) argument would be evaluated before
    // ConfigModule has necessarily loaded .env, making the "configurable"
    // part unreliable in local dev.
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        { ttl: 60_000, limit: Number(config.get('CART_RATE_LIMIT_PER_MINUTE') ?? 120) },
      ],
    }),
  ],
  controllers: [CartController, CartMergeController],
  providers: [CartService, CustomerJwtAuthGuard, OptionalCustomerJwtAuthGuard],
})
export class CartModule {}
