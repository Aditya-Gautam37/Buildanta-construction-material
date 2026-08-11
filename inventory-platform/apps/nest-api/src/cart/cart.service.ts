import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CartStatus,
  InventoryLedgerType,
  Prisma,
  ProductStatus,
  PurchaseMode,
  QuotationApprovalStatus,
  QuotationStatus,
  VariantStatus,
} from '@workspace/db';
import {
  decideCartLineQuantity,
  type CartQuantityAdjustment,
  type CartVariantPurchaseRules,
} from '../common/cart-eligibility';
import { publicAvailabilityForBalances, type PublicAvailability } from '../common/public-catalogue';
import { withSerializableRetry } from '../common/serializable-transaction';
import { PrismaService } from '../database/prisma.service';
import { availableQuantity } from '../inventory-locations/inventory-locations.service';
import { QuoteRequestsService } from '../quote-requests/quote-requests.service';

// Local, deliberately not shared with QuotationsService: that service's money()
// and balanceSnapshot() are private implementation detail of a staff-facing
// negotiated-pricing flow. Direct checkout is a different, simpler calculation
// (no discounts, no margin, no manual line pricing) and duplicating four lines
// here is safer than coupling two independently evolving services.
function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function balanceSnapshot(balance: {
  physicalQuantity: number;
  reservedQuantity: number;
  blockedQuantity: number;
  damagedQuantity: number;
  quarantineQuantity: number;
  inTransitQuantity: number;
}) {
  return {
    physicalQuantity: balance.physicalQuantity,
    reservedQuantity: balance.reservedQuantity,
    blockedQuantity: balance.blockedQuantity,
    damagedQuantity: balance.damagedQuantity,
    quarantineQuantity: balance.quarantineQuantity,
    inTransitQuantity: balance.inTransitQuantity,
  };
}

// Mirrors the front-end's two delivery options. Duplicated rather than fetched,
// same trade-off as roundMoney above — flagged here so both sides are changed
// together if a real freight table is introduced later.
export const DIRECT_CHECKOUT_DELIVERY_CHARGES = { STANDARD: 0, EXPRESS: 400 } as const;
export type DirectCheckoutDeliveryMethod = keyof typeof DIRECT_CHECKOUT_DELIVERY_CHARGES;

export type CartCheckoutInput = {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  deliveryMethod: DirectCheckoutDeliveryMethod;
  idempotencyKey: string;
};

export type CartCheckoutResult = {
  orderReference: string;
  quotationReference: string;
  grandTotal: number;
  deliveryCharge: number;
  itemCount: number;
  existing: boolean;
};

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
  imageUrl: string | null;
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
  // Set when the stored quantity no longer satisfies the variant's current rules,
  // e.g. staff raised the minimum order quantity after this line was added.
  adjustment: CartQuantityAdjustment | null;
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

// The adjustment caused by *this* request. It is an event, not stored state, so it
// is returned from mutations only and never replayed on a later GET /cart.
export type CartMutationResult = CartSummary & { adjustment: CartQuantityAdjustment | null };

const CART_INCLUDE = {
  items: {
    include: {
      variant: {
        include: {
          product: { include: { images: { orderBy: [{ primary: 'desc' }, { sortOrder: 'asc' }], take: 1 } } },
          inventoryBalances: true,
        },
      },
    },
  },
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

function withAdjustment(summary: CartSummary, adjustment: CartQuantityAdjustment | null): CartMutationResult {
  return { ...summary, adjustment };
}

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
      // Use the same location-aware source as the public catalogue. The
      // ProductVariant stock columns are only a rollup of physical and reserved
      // quantities, so they ignore blocked, damaged and quarantined stock and
      // would let the cart look more available than the product page.
      const availability = publicAvailabilityForBalances(variant.inventoryBalances);
      const active = variant.status === VariantStatus.ACTIVE && product.status === ProductStatus.PUBLISHED;
      const eligible = decision.eligible && active;
      const issues = [...decision.issues];
      if (decision.eligible && decision.adjustment) issues.push(decision.adjustment.message);
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
        imageUrl: product.images[0]?.src ?? null,
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
        adjustment: decision.eligible ? decision.adjustment : null,
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

  async addItem(identity: CartIdentity, input: { variantId: string; quantity: number }): Promise<CartMutationResult> {
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
    return withAdjustment(await this.getSummary(identity), decision.adjustment);
  }

  async updateItem(identity: CartIdentity, itemId: string, quantity: number): Promise<CartMutationResult> {
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
    return withAdjustment(await this.getSummary(identity), decision.adjustment);
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
      include: { ...CART_INCLUDE, quotation: { include: { items: true } } },
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

  /**
   * Self-serve cash-on-delivery checkout. Unlike convertToQuote (which raises a
   * QuoteRequest for staff to price by hand), this synthesises an already-priced,
   * already-approved quotation and immediately accepts it — creating a
   * SalesOrder and reserving real inventory in the same transaction, the way
   * QuotationsService.accept() does for staff-approved quotes. That reservation
   * is the entire point: without it, "place order" only ever wrote a record,
   * never touched stock, and two customers could buy the last unit.
   *
   * Serializable isolation plus a live re-check of InventoryBalance at commit
   * time is what makes that impossible rather than merely unlikely — a second
   * concurrent checkout for the same unit gets a serialization failure, retries,
   * re-reads the now-lower balance, and fails cleanly instead of overselling.
   */
  async checkout(identity: CartIdentity, input: CartCheckoutInput): Promise<CartCheckoutResult> {
    const scope = identityScope(identity);
    if (!scope) throw new BadRequestException('Unable to identify the cart owner.');

    return withSerializableRetry(() =>
      this.prisma.client.$transaction(async (tx) => {
        const cart = await tx.cart.findFirst({
          where: scope,
          orderBy: { updatedAt: 'desc' },
          include: { ...CART_INCLUDE, quotation: { include: { salesOrder: true } } },
        });
        if (!cart) throw new BadRequestException('Your cart is empty.');

        if (cart.status === CartStatus.CONVERTED) {
          if (cart.conversionIdempotencyKey !== input.idempotencyKey || !cart.quotation?.salesOrder) {
            throw new ConflictException('This cart has already been checked out.');
          }
          const order = cart.quotation.salesOrder;
          return {
            orderReference: order.reference,
            quotationReference: cart.quotation.reference,
            grandTotal: Number(order.grandTotal),
            deliveryCharge: Number(order.freightTotal),
            itemCount: cart.items.length,
            existing: true,
          };
        }
        if (cart.status !== CartStatus.ACTIVE) throw new ConflictException('This cart is no longer active.');
        if (cart.items.length === 0) throw new BadRequestException('Your cart is empty.');

        // All-or-nothing: a line that is not directly buyable, or that has
        // crossed into bulk-quote territory, is not silently dropped. The
        // customer is told exactly which line and why, rather than being
        // charged for less than they saw in the cart.
        const decisions = cart.items.map((item: CartItemWithVariant) => ({
          item,
          decision: decideCartLineQuantity(toRules(item.variant), item.quantity),
        }));
        const blocking = decisions.find(({ decision }) => !decision.eligible || decision.requiresQuote);
        if (blocking) {
          const name = blocking.item.variant.product.name;
          const reason = blocking.decision.requiresQuote
            ? `${name} needs a bulk quote at this quantity — remove it or request a quote instead.`
            : blocking.decision.issues[0] ?? `${name} can no longer be checked out directly.`;
          throw new ConflictException(reason);
        }

        const coveredAreas = await tx.pincodeCoverage.findMany({
          where: { pincode: input.pincode, active: true, serviceArea: { active: true } },
          select: { serviceAreaId: true },
        });
        if (!coveredAreas.length) throw new ConflictException('We do not deliver to this PIN code yet.');
        const serviceAreaIds = coveredAreas.map((row) => row.serviceAreaId);

        const serviceableLinks = await tx.fulfilmentServiceArea.findMany({
          where: { serviceAreaId: { in: serviceAreaIds }, active: true, fulfilmentLocation: { active: true } },
          select: { fulfilmentLocationId: true },
        });
        const candidateLocationIds = [...new Set(serviceableLinks.map((row) => row.fulfilmentLocationId))];
        if (!candidateLocationIds.length) throw new ConflictException('No fulfilment location currently serves this PIN code.');

        // Resolve pricing and a stocked, serviceable location per line before
        // writing anything, so a stock shortfall is reported precisely.
        type ResolvedLine = {
          item: CartItemWithVariant;
          quantity: number;
          unitPrice: number;
          gstPercent: number;
          fulfilmentLocationId: string;
          balanceId: string;
        };
        const resolved: ResolvedLine[] = [];
        for (const { item, decision } of decisions) {
          // decision.quantity is only null when !eligible, and every such line
          // already threw above via `blocking` — this narrows that for TS.
          if (!decision.eligible || decision.quantity == null) throw new ConflictException('This line is no longer eligible for checkout.');
          const variant = item.variant;
          const product = variant.product;
          const balances = await tx.inventoryBalance.findMany({
            where: { variantId: variant.id, fulfilmentLocationId: { in: candidateLocationIds } },
            orderBy: { physicalQuantity: 'desc' },
          });
          const chosen = balances.find((balance) => availableQuantity(balance) >= decision.quantity);
          if (!chosen) {
            const bestAvailable = balances.reduce((max, balance) => Math.max(max, availableQuantity(balance)), 0);
            throw new ConflictException(
              bestAvailable > 0
                ? `Only ${bestAvailable} ${variant.unit} of ${product.name} available near ${input.pincode} — you requested ${decision.quantity}.`
                : `${product.name} is out of stock near ${input.pincode} right now.`,
            );
          }
          const unitPrice = variant.price != null ? Number(variant.price) : Number(product.sellingPrice);
          resolved.push({
            item,
            quantity: decision.quantity,
            unitPrice,
            gstPercent: product.gstPercent != null ? Number(product.gstPercent) : 0,
            fulfilmentLocationId: chosen.fulfilmentLocationId,
            balanceId: chosen.id,
          });
        }

        let subtotal = 0;
        let gstTotal = 0;
        const pricedLines = resolved.map((line) => {
          const lineSubtotal = roundMoney(line.quantity * line.unitPrice);
          const gstAmount = roundMoney((lineSubtotal * line.gstPercent) / 100);
          const lineTotal = roundMoney(lineSubtotal + gstAmount);
          subtotal = roundMoney(subtotal + lineSubtotal);
          gstTotal = roundMoney(gstTotal + gstAmount);
          return { ...line, lineSubtotal, gstAmount, lineTotal };
        });
        const freightTotal = DIRECT_CHECKOUT_DELIVERY_CHARGES[input.deliveryMethod];
        const discountTotal = 0;
        const grandTotal = roundMoney(subtotal - discountTotal + gstTotal + freightTotal);

        const now = new Date();
        const addressLine = [input.addressLine1, input.addressLine2, input.landmark].filter(Boolean).join(', ');
        const deliveryLabel = input.deliveryMethod === 'EXPRESS' ? 'Priority delivery' : 'Standard delivery';
        const customerNotes = `CASH ON DELIVERY. ${deliveryLabel}. Deliver to: ${addressLine}, ${input.city}, ${input.state} - ${input.pincode}.`;
        const reference = `BQ-${now.toISOString().slice(2, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

        const quotation = await tx.quotation.create({
          data: {
            reference,
            sourceCartId: cart.id,
            customerName: input.name,
            customerEmail: input.email.toLowerCase(),
            customerPhone: input.phone,
            deliveryPincode: input.pincode,
            projectType: 'Direct checkout',
            customerNotes,
            status: QuotationStatus.SUBMITTED,
            items: {
              create: pricedLines.map((line, index) => ({
                productId: line.item.variant.productId,
                variantId: line.item.variant.id,
                description: line.item.variant.product.name,
                quantity: line.quantity,
                unitCode: line.item.variant.unit,
                sortOrder: index,
              })),
            },
            history: { create: { toStatus: QuotationStatus.SUBMITTED, reason: 'Guest checkout' } },
          },
          include: { items: true },
        });
        const quotationItemByVariant = new Map(quotation.items.map((row) => [row.variantId, row]));

        const revision = await tx.quotationRevision.create({
          data: {
            quotationId: quotation.id,
            number: 1,
            validUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            subtotal,
            gstTotal,
            freightTotal,
            discountTotal,
            grandTotal,
            customerNotes,
            items: {
              create: pricedLines.map((line) => {
                const quotationItem = quotationItemByVariant.get(line.item.variant.id);
                if (!quotationItem) throw new ConflictException('Checkout could not match every cart line to a quotation line.');
                return {
                  quotationItemId: quotationItem.id,
                  variantId: line.item.variant.id,
                  fulfilmentLocationId: line.fulfilmentLocationId,
                  description: line.item.variant.product.name,
                  quantity: line.quantity,
                  unitCode: line.item.variant.unit,
                  unitPrice: line.unitPrice,
                  gstPercent: line.gstPercent,
                  discountAmount: 0,
                  lineSubtotal: line.lineSubtotal,
                  gstAmount: line.gstAmount,
                  lineTotal: line.lineTotal,
                };
              }),
            },
          },
        });

        // No negotiation happens on a direct COD order, so the approval this
        // quotation would otherwise wait on is recorded as already satisfied —
        // an honest audit entry, not a bypassed check.
        await tx.quotationApproval.create({
          data: {
            quotationId: quotation.id,
            revisionId: revision.id,
            status: QuotationApprovalStatus.APPROVED,
            reason: 'Auto-approved: direct cash-on-delivery checkout',
            decidedAt: now,
          },
        });
        await tx.quotation.update({
          where: { id: quotation.id },
          data: {
            status: QuotationStatus.QUOTED,
            currentRevisionNumber: 1,
            history: { create: { fromStatus: QuotationStatus.SUBMITTED, toStatus: QuotationStatus.QUOTED, reason: 'Auto-priced for direct checkout' } },
          },
        });

        const orderReference = `SO-${now.toISOString().slice(2, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
        // COD orders get a longer hold than the 48h default used for
        // staff-negotiated quotes: there is no separate payment step waiting on
        // the customer, only delivery scheduling, so the reservation should
        // outlast a normal delivery cycle rather than expire mid-transit.
        const reservedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const order = await tx.salesOrder.create({
          data: {
            reference: orderReference,
            quotationId: quotation.id,
            revisionId: revision.id,
            paymentTerms: 'Cash on delivery',
            customerName: input.name,
            customerEmail: input.email.toLowerCase(),
            customerPhone: input.phone,
            deliveryPincode: input.pincode,
            subtotal,
            gstTotal,
            freightTotal,
            discountTotal,
            grandTotal,
            reservedUntil,
          },
        });

        const touchedVariants = new Set<string>();
        for (const [index, line] of pricedLines.entries()) {
          const quotationItem = quotationItemByVariant.get(line.item.variant.id);
          if (!quotationItem) throw new ConflictException('Checkout could not match every cart line to a quotation line.');
          const orderItem = await tx.salesOrderItem.create({
            data: {
              salesOrderId: order.id,
              quotationItemId: quotationItem.id,
              variantId: line.item.variant.id,
              fulfilmentLocationId: line.fulfilmentLocationId,
              description: line.item.variant.product.name,
              quantity: line.quantity,
              unitCode: line.item.variant.unit,
              unitPrice: line.unitPrice,
              gstPercent: line.gstPercent,
              discountAmount: 0,
              lineSubtotal: line.lineSubtotal,
              gstAmount: line.gstAmount,
              lineTotal: line.lineTotal,
            },
          });
          // Re-read and re-check inside the same transaction rather than trust
          // the balance found during resolution above: under Serializable
          // isolation a stale read here is what the retry-on-conflict exists to
          // catch, but the guard still belongs at the point of the write.
          const balance = await tx.inventoryBalance.findUniqueOrThrow({ where: { id: line.balanceId } });
          if (availableQuantity(balance) < line.quantity) {
            throw new ConflictException(`${line.item.variant.product.name} sold out while your order was being placed.`);
          }
          const updatedBalance = await tx.inventoryBalance.update({
            where: { id: balance.id },
            data: { reservedQuantity: { increment: line.quantity } },
          });
          await tx.inventoryReservation.create({
            data: {
              reference: `${orderReference}-${index + 1}`,
              variantId: line.item.variant.id,
              fulfilmentLocationId: line.fulfilmentLocationId,
              quantity: line.quantity,
              expiresAt: reservedUntil,
              notes: `Reserved for ${orderReference} (direct checkout)`,
              salesOrderItemId: orderItem.id,
            },
          });
          await tx.inventoryLedgerEntry.create({
            data: {
              balanceId: balance.id,
              type: InventoryLedgerType.RESERVATION,
              reservedDelta: line.quantity,
              before: balanceSnapshot(balance),
              after: balanceSnapshot(updatedBalance),
              reason: 'Direct checkout, cash on delivery',
              reference: orderReference,
            },
          });
          touchedVariants.add(line.item.variant.id);
        }

        for (const variantId of touchedVariants) {
          const totals = await tx.inventoryBalance.aggregate({
            where: { variantId },
            _sum: { physicalQuantity: true, reservedQuantity: true },
          });
          await tx.productVariant.update({
            where: { id: variantId },
            data: {
              stockQuantity: totals._sum.physicalQuantity ?? 0,
              reservedQuantity: totals._sum.reservedQuantity ?? 0,
              stockTracked: true,
            },
          });
        }

        await tx.quotation.update({
          where: { id: quotation.id },
          data: {
            status: QuotationStatus.ACCEPTED,
            acceptedAt: now,
            history: { create: { fromStatus: QuotationStatus.QUOTED, toStatus: QuotationStatus.ACCEPTED, reason: 'Order placed, stock reserved' } },
          },
        });

        const flipped = await tx.cart.updateMany({
          where: { id: cart.id, status: CartStatus.ACTIVE },
          data: { status: CartStatus.CONVERTED, convertedAt: now, conversionIdempotencyKey: input.idempotencyKey },
        });
        if (flipped.count !== 1) throw new ConflictException('This cart was checked out concurrently.');

        return {
          orderReference,
          quotationReference: reference,
          grandTotal,
          deliveryCharge: freightTotal,
          itemCount: pricedLines.length,
          existing: false,
        };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }),
    );
  }
}
