import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CartStatus, Prisma, ProductStatus, PurchaseMode, VariantStatus } from '@workspace/db';
import { decideCartLineQuantity, type CartVariantPurchaseRules } from '../common/cart-eligibility';
import { publicAvailabilityForStock, type PublicAvailability } from '../common/public-catalogue';
import { withSerializableRetry } from '../common/serializable-transaction';
import { PrismaService } from '../database/prisma.service';
import { QuoteRequestsService } from '../quote-requests/quote-requests.service';

export type CartIdentity = { customerId?: string; guestToken?: string };

export type CartConvertInput = {
  name: string;
  email: string;
  phone: string;
  company?: string;
  deliveryPincode: string;
  requiredBy?: Date;
  projectType?: string;
  customerNotes?: string;
  idempotencyKey: string;
};

export type CartLineSummary = {
  itemId: string;
  variantId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  purchaseMode: PurchaseMode;
  unit: string;
  unitPriceSnapshot: number | null;
  livePrice: number | null;
  priceChanged: boolean;
  lineSubtotal: number | null;
  availability: PublicAvailability;
  eligible: boolean;
  requiresQuote: boolean;
  quantityAdjusted: boolean;
  issues: string[];
};

export type CartSummary = {
  cartId: string | null;
  status: CartStatus;
  lines: CartLineSummary[];
  lineCount: number;
  itemCount: number;
  subtotal: number;
  requiresQuoteCount: number;
  hasBlockingIssues: boolean;
};

const CART_INCLUDE = {
  items: { include: { variant: { include: { product: true } } } },
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: typeof CART_INCLUDE }>;
type CartItemWithVariant = CartWithItems['items'][number];

const EMPTY_SUMMARY: CartSummary = {
  cartId: null,
  status: CartStatus.ACTIVE,
  lines: [],
  lineCount: 0,
  itemCount: 0,
  subtotal: 0,
  requiresQuoteCount: 0,
  hasBlockingIssues: false,
};

function toRules(variant: {
  purchaseMode: PurchaseMode;
  minimumOrderQuantity: number;
  maxDirectQuantity: number | null;
  bulkQuoteThreshold: number | null;
  quantityIncrement: number;
}): CartVariantPurchaseRules {
  return {
    purchaseMode: variant.purchaseMode,
    minimumOrderQuantity: variant.minimumOrderQuantity,
    maxDirectQuantity: variant.maxDirectQuantity,
    bulkQuoteThreshold: variant.bulkQuoteThreshold,
    quantityIncrement: variant.quantityIncrement,
  };
}

function identityScope(identity: CartIdentity) {
  if (identity.customerId) return { customerId: identity.customerId };
  if (identity.guestToken) return { guestToken: identity.guestToken };
  return null;
}

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quoteRequestsService: QuoteRequestsService,
  ) {}

  private async findCart(identity: CartIdentity, opts: { activeOnly: boolean }): Promise<CartWithItems | null> {
    const scope = identityScope(identity);
    if (!scope) return null;
    return this.prisma.client.cart.findFirst({
      where: opts.activeOnly ? { ...scope, status: CartStatus.ACTIVE } : scope,
      orderBy: { updatedAt: 'desc' },
      include: CART_INCLUDE,
    });
  }

  private async getOrCreateCart(identity: CartIdentity): Promise<CartWithItems> {
    const existing = await this.findCart(identity, { activeOnly: true });
    if (existing) return existing;
    const scope = identityScope(identity);
    if (!scope) throw new BadRequestException('Unable to identify the cart owner.');
    return this.prisma.client.cart.create({ data: scope, include: CART_INCLUDE });
  }

  private assertActive<T extends { status: CartStatus } | null>(cart: T): asserts cart is NonNullable<T> {
    if (!cart) throw new NotFoundException('Cart not found.');
    if (cart.status !== CartStatus.ACTIVE) throw new ConflictException('This cart is no longer active.');
  }

  private buildSummary(cart: CartWithItems | null): CartSummary {
    if (!cart) return EMPTY_SUMMARY;
    let subtotal = 0;
    let requiresQuoteCount = 0;
    let hasBlockingIssues = false;

    const lines: CartLineSummary[] = cart.items.map((item: CartItemWithVariant) => {
      const variant = item.variant;
      const product = variant.product;
      const decision = decideCartLineQuantity(toRules(variant), item.quantity);
      const livePrice = variant.price != null ? Number(variant.price) : Number(product.sellingPrice);
      const snapshot = item.unitPriceSnapshot != null ? Number(item.unitPriceSnapshot) : null;
      const priceChanged = snapshot != null && livePrice !== snapshot;
      const availability = publicAvailabilityForStock({
        stockTracked: variant.stockTracked,
        stockQuantity: variant.stockQuantity,
        reservedQuantity: variant.reservedQuantity,
        lowStockThreshold: variant.lowStockThreshold,
      });
      const active = variant.status === VariantStatus.ACTIVE && product.status === ProductStatus.PUBLISHED;
      const eligible = decision.eligible && active;
      const issues = [...decision.issues];
      if (!active) issues.push('This product is no longer available for direct purchase.');
      if (!eligible) hasBlockingIssues = true;
      const requiresQuote = decision.eligible && decision.requiresQuote;
      if (requiresQuote) requiresQuoteCount += 1;
      const quantity = decision.eligible ? decision.quantity : item.quantity;
      const lineSubtotal = eligible && !requiresQuote ? quantity * livePrice : null;
      if (lineSubtotal != null) subtotal += lineSubtotal;

      return {
        itemId: item.id,
        variantId: variant.id,
        productId: product.id,
        productName: product.name,
        sku: variant.sku,
        quantity,
        purchaseMode: variant.purchaseMode,
        unit: variant.unit,
        unitPriceSnapshot: snapshot,
        livePrice,
        priceChanged,
        lineSubtotal,
        availability,
        eligible,
        requiresQuote,
        quantityAdjusted: decision.eligible ? decision.quantityAdjusted : false,
        issues,
      };
    });

    return {
      cartId: cart.id,
      status: cart.status,
      lines,
      lineCount: lines.length,
      itemCount: cart.items.reduce((sum: number, item: CartItemWithVariant) => sum + item.quantity, 0),
      subtotal,
      requiresQuoteCount,
      hasBlockingIssues,
    };
  }

  async getSummary(identity: CartIdentity): Promise<CartSummary> {
    const cart = await this.findCart(identity, { activeOnly: true });
    return this.buildSummary(cart);
  }

  async addItem(identity: CartIdentity, input: { variantId: string; quantity: number }): Promise<CartSummary> {
    const cart = await this.getOrCreateCart(identity);
    const variant = await this.prisma.client.productVariant.findUnique({
      where: { id: input.variantId },
      include: { product: true },
    });
    if (!variant || variant.status !== VariantStatus.ACTIVE || variant.product.status !== ProductStatus.PUBLISHED) {
      throw new BadRequestException('This product is not available for direct purchase.');
    }
    const existingItem = cart.items.find((item: CartItemWithVariant) => item.variantId === input.variantId);
    const decision = decideCartLineQuantity(toRules(variant), (existingItem?.quantity ?? 0) + input.quantity);
    if (!decision.eligible) {
      throw new BadRequestException(decision.issues[0] ?? 'This product cannot be added to the cart.');
    }
    const unitPriceSnapshot = variant.price ?? variant.product.sellingPrice;
    await this.prisma.client.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: input.variantId } },
      create: { cartId: cart.id, variantId: input.variantId, quantity: decision.quantity, unitPriceSnapshot },
      update: { quantity: decision.quantity, unitPriceSnapshot },
    });
    await this.prisma.client.cart.update({ where: { id: cart.id }, data: { lastActivityAt: new Date() } });
    return this.getSummary(identity);
  }

  async updateItem(identity: CartIdentity, itemId: string, quantity: number): Promise<CartSummary> {
    const cart = await this.findCart(identity, { activeOnly: false });
    this.assertActive(cart);
    const item = cart.items.find((candidate: CartItemWithVariant) => candidate.id === itemId);
    if (!item) throw new NotFoundException('Cart item not found.');
    const decision = decideCartLineQuantity(toRules(item.variant), quantity);
    if (!decision.eligible) {
      throw new BadRequestException(decision.issues[0] ?? 'This quantity is not valid for this product.');
    }
    await this.prisma.client.cartItem.update({ where: { id: itemId }, data: { quantity: decision.quantity } });
    await this.prisma.client.cart.update({ where: { id: cart.id }, data: { lastActivityAt: new Date() } });
    return this.getSummary(identity);
  }

  async removeItem(identity: CartIdentity, itemId: string): Promise<CartSummary> {
    const cart = await this.findCart(identity, { activeOnly: false });
    this.assertActive(cart);
    const item = cart.items.find((candidate: CartItemWithVariant) => candidate.id === itemId);
    if (!item) throw new NotFoundException('Cart item not found.');
    await this.prisma.client.cartItem.delete({ where: { id: itemId } });
    await this.prisma.client.cart.update({ where: { id: cart.id }, data: { lastActivityAt: new Date() } });
    return this.getSummary(identity);
  }

  async clearCart(identity: CartIdentity): Promise<CartSummary> {
    const cart = await this.findCart(identity, { activeOnly: true });
    if (!cart) return EMPTY_SUMMARY;
    await this.prisma.client.cartItem.deleteMany({ where: { cartId: cart.id } });
    await this.prisma.client.cart.update({ where: { id: cart.id }, data: { lastActivityAt: new Date() } });
    return this.getSummary(identity);
  }

  async merge(customerId: string, guestToken: string): Promise<CartSummary> {
    const guestCart = await this.prisma.client.cart.findFirst({
      where: { guestToken, status: CartStatus.ACTIVE },
      include: CART_INCLUDE,
    });
    if (!guestCart) return this.getSummary({ customerId });

    const customerCart = await this.getOrCreateCart({ customerId });
    await this.prisma.client.$transaction(async (trx) => {
      for (const item of guestCart.items) {
        const existing = customerCart.items.find((candidate: CartItemWithVariant) => candidate.variantId === item.variantId);
        const decision = decideCartLineQuantity(toRules(item.variant), (existing?.quantity ?? 0) + item.quantity);
        if (!decision.eligible) continue;
        await trx.cartItem.upsert({
          where: { cartId_variantId: { cartId: customerCart.id, variantId: item.variantId } },
          create: { cartId: customerCart.id, variantId: item.variantId, quantity: decision.quantity, unitPriceSnapshot: item.unitPriceSnapshot },
          update: { quantity: decision.quantity, unitPriceSnapshot: item.unitPriceSnapshot },
        });
      }
      await trx.cart.update({ where: { id: guestCart.id }, data: { status: CartStatus.ABANDONED, guestToken: null } });
      await trx.cart.update({ where: { id: customerCart.id }, data: { lastActivityAt: new Date() } });
    });
    return this.getSummary({ customerId });
  }

  async convertToQuote(identity: CartIdentity, input: CartConvertInput) {
    const scope = identityScope(identity);
    if (!scope) throw new BadRequestException('Unable to identify the cart owner.');
    const cart = await this.prisma.client.cart.findFirst({
      where: scope,
      orderBy: { updatedAt: 'desc' },
      include: { items: { include: { variant: { include: { product: true } } } }, quotation: { include: { items: true } } },
    });
    if (!cart) throw new BadRequestException('Your cart is empty.');

    if (cart.status === CartStatus.CONVERTED) {
      if (cart.conversionIdempotencyKey !== input.idempotencyKey || !cart.quotation) {
        throw new ConflictException('This cart has already been converted to a quotation.');
      }
      return { reference: cart.quotation.reference, itemCount: cart.quotation.items.length, existing: true };
    }
    if (cart.status !== CartStatus.ACTIVE) throw new ConflictException('This cart is no longer active.');
    if (cart.items.length === 0) throw new BadRequestException('Your cart is empty.');

    const eligibleItems = cart.items.filter((item: CartItemWithVariant) => {
      const decision = decideCartLineQuantity(toRules(item.variant), item.quantity);
      return decision.eligible && item.variant.status === VariantStatus.ACTIVE && item.variant.product.status === ProductStatus.PUBLISHED;
    });
    if (eligibleItems.length === 0) {
      throw new BadRequestException('No items in your cart are currently eligible for a quotation.');
    }

    const items = eligibleItems.map((item: CartItemWithVariant) => ({
      productId: item.variant.productId,
      variantId: item.variantId,
      description: item.variant.product.name,
      quantity: item.quantity,
      unitCode: item.variant.unit,
    }));

    return withSerializableRetry(() =>
      this.prisma.client.$transaction(async (trx) => {
        const result = await this.quoteRequestsService.create(
          {
            name: input.name,
            email: input.email,
            phone: input.phone,
            company: input.company,
            deliveryPincode: input.deliveryPincode,
            requiredBy: input.requiredBy,
            projectType: input.projectType,
            customerNotes: input.customerNotes,
            items,
          },
          trx,
          { sourceCartId: cart.id },
        );
        const flipped = await trx.cart.updateMany({
          where: { id: cart.id, status: CartStatus.ACTIVE },
          data: { status: CartStatus.CONVERTED, convertedAt: new Date(), conversionIdempotencyKey: input.idempotencyKey },
        });
        if (flipped.count !== 1) throw new ConflictException('This cart was converted concurrently.');
        return result;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }),
    );
  }
}
