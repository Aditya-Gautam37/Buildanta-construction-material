import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FriendlyThrottlerGuard } from '../common/friendly-throttler.guard';
import type { z } from 'zod';
import { CustomerJwtAuthGuard } from '../auth/guards/customer-jwt.auth.guard';
import { OptionalCustomerJwtAuthGuard } from '../auth/guards/optional-customer-jwt.auth.guard';
import { cartAddItemSchema, cartCheckoutSchema, cartConvertToQuoteSchema, cartUpdateItemSchema } from '../common/request-schemas';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CartService, type CartIdentity } from './cart.service';

type OptionalUserRequest = { user: { id: string; email: string } | null };
type CustomerRequest = { user: { id: string; email: string } };

function identityFrom(request: OptionalUserRequest, guestToken?: string): CartIdentity {
  if (request.user) return { customerId: request.user.id };
  return { guestToken };
}

@Controller('cart')
@UseGuards(OptionalCustomerJwtAuthGuard, FriendlyThrottlerGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  get(@Req() request: OptionalUserRequest, @Headers('x-buildanta-guest-cart') guestToken?: string) {
    return this.cartService.getSummary(identityFrom(request, guestToken));
  }

  @Post('items')
  addItem(
    @Req() request: OptionalUserRequest,
    @Headers('x-buildanta-guest-cart') guestToken: string | undefined,
    @Body(new ZodValidationPipe(cartAddItemSchema)) input: z.infer<typeof cartAddItemSchema>,
  ) {
    return this.cartService.addItem(identityFrom(request, guestToken), input);
  }

  @Patch('items/:itemId')
  updateItem(
    @Req() request: OptionalUserRequest,
    @Headers('x-buildanta-guest-cart') guestToken: string | undefined,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(cartUpdateItemSchema)) input: z.infer<typeof cartUpdateItemSchema>,
  ) {
    return this.cartService.updateItem(identityFrom(request, guestToken), itemId, input.quantity);
  }

  @Delete('items/:itemId')
  removeItem(
    @Req() request: OptionalUserRequest,
    @Headers('x-buildanta-guest-cart') guestToken: string | undefined,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeItem(identityFrom(request, guestToken), itemId);
  }

  @Delete()
  clear(@Req() request: OptionalUserRequest, @Headers('x-buildanta-guest-cart') guestToken?: string) {
    return this.cartService.clearCart(identityFrom(request, guestToken));
  }

  @Post('convert-to-quote')
  convertToQuote(
    @Req() request: OptionalUserRequest,
    @Headers('x-buildanta-guest-cart') guestToken: string | undefined,
    @Body(new ZodValidationPipe(cartConvertToQuoteSchema)) input: z.infer<typeof cartConvertToQuoteSchema>,
  ) {
    return this.cartService.convertToQuote(identityFrom(request, guestToken), input);
  }

  // Tighter than the controller's default: a real shopper checks out once,
  // maybe retries once on a genuine error. This value is a decorator argument
  // (evaluated at import time, not request time), so unlike the module-wide
  // default above it can't safely read ConfigService — edit it directly here
  // if it ever needs tuning.
  @Post('checkout')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  checkout(
    @Req() request: OptionalUserRequest,
    @Headers('x-buildanta-guest-cart') guestToken: string | undefined,
    @Body(new ZodValidationPipe(cartCheckoutSchema)) input: z.infer<typeof cartCheckoutSchema>,
  ) {
    return this.cartService.checkout(identityFrom(request, guestToken), input);
  }
}

@Controller('cart/merge')
@UseGuards(CustomerJwtAuthGuard)
export class CartMergeController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  merge(@Req() request: CustomerRequest, @Headers('x-buildanta-guest-cart') guestToken?: string) {
    if (!guestToken) return this.cartService.getSummary({ customerId: request.user.id });
    return this.cartService.merge(request.user.id, guestToken);
  }
}
