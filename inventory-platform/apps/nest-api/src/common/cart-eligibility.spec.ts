import { PurchaseMode } from '@workspace/db';
import {
  CART_ADJUSTMENT_REASON,
  decideCartLineQuantity,
  type CartVariantPurchaseRules,
} from './cart-eligibility';

const baseRules: CartVariantPurchaseRules = {
  purchaseMode: PurchaseMode.DIRECT_ONLY,
  minimumOrderQuantity: 1,
  maxDirectQuantity: null,
  bulkQuoteThreshold: null,
  quantityIncrement: 1,
};

describe('decideCartLineQuantity eligibility', () => {
  it('rejects quote-only variants outright', () => {
    const decision = decideCartLineQuantity({ ...baseRules, purchaseMode: PurchaseMode.QUOTE_ONLY }, 5);
    expect(decision.eligible).toBe(false);
    expect(decision.quantity).toBeNull();
    expect(decision.issues[0]).toBe('This product is available for bulk quotation only.');
  });

  it('rejects a zero or negative requested quantity', () => {
    expect(decideCartLineQuantity(baseRules, 0).eligible).toBe(false);
    expect(decideCartLineQuantity(baseRules, -3).eligible).toBe(false);
  });

  it('passes an already-valid quantity through with no adjustment', () => {
    const decision = decideCartLineQuantity({ ...baseRules, minimumOrderQuantity: 5, quantityIncrement: 5 }, 10);
    expect(decision).toMatchObject({ eligible: true, quantity: 10, adjustment: null });
  });

  it('never requires a quote for DIRECT_ONLY, capping instead', () => {
    const decision = decideCartLineQuantity(
      { ...baseRules, purchaseMode: PurchaseMode.DIRECT_ONLY, maxDirectQuantity: 100, bulkQuoteThreshold: 10 },
      500,
    );
    expect(decision).toMatchObject({ eligible: true, quantity: 100, requiresQuote: false });
  });

  it('flags requiresQuote at or above the DIRECT_AND_QUOTE threshold', () => {
    const rules = { ...baseRules, purchaseMode: PurchaseMode.DIRECT_AND_QUOTE, bulkQuoteThreshold: 50 };
    expect(decideCartLineQuantity(rules, 50).requiresQuote).toBe(true);
    expect(decideCartLineQuantity(rules, 49).requiresQuote).toBe(false);
  });

  it('ignores bulkQuoteThreshold entirely when unset', () => {
    const decision = decideCartLineQuantity(
      { ...baseRules, purchaseMode: PurchaseMode.DIRECT_AND_QUOTE, bulkQuoteThreshold: null },
      1_000_000,
    );
    expect(decision.requiresQuote).toBe(false);
  });
});

describe('decideCartLineQuantity adjustment reporting', () => {
  it('reports a minimum-order-quantity adjustment with requested, final and reason', () => {
    const decision = decideCartLineQuantity({ ...baseRules, minimumOrderQuantity: 5 }, 2);

    expect(decision.quantity).toBe(5);
    expect(decision.adjustment).toEqual({
      requestedQuantity: 2,
      adjustedQuantity: 5,
      reasons: [CART_ADJUSTMENT_REASON.MINIMUM_ORDER_QUANTITY],
      message: 'Quantity adjusted from 2 to 5 because the minimum order quantity is 5.',
    });
  });

  it('reports a quantity-increment adjustment', () => {
    const decision = decideCartLineQuantity({ ...baseRules, quantityIncrement: 5 }, 7);

    expect(decision.quantity).toBe(10);
    expect(decision.adjustment).toEqual({
      requestedQuantity: 7,
      adjustedQuantity: 10,
      reasons: [CART_ADJUSTMENT_REASON.QUANTITY_INCREMENT],
      message: 'Quantity adjusted from 7 to 10 because this product is sold in increments of 5.',
    });
  });

  it('reports a maximum-direct-quantity adjustment', () => {
    const decision = decideCartLineQuantity({ ...baseRules, maxDirectQuantity: 50 }, 100);

    expect(decision.quantity).toBe(50);
    expect(decision.adjustment).toEqual({
      requestedQuantity: 100,
      adjustedQuantity: 50,
      reasons: [CART_ADJUSTMENT_REASON.MAXIMUM_DIRECT_QUANTITY],
      message: 'Quantity adjusted from 100 to 50 because the maximum direct-order quantity is 50.',
    });
  });

  it('combines several reasons into one message', () => {
    const decision = decideCartLineQuantity(
      { ...baseRules, minimumOrderQuantity: 4, quantityIncrement: 5 },
      1,
    );

    expect(decision.quantity).toBe(5);
    expect(decision.adjustment?.reasons).toEqual([
      CART_ADJUSTMENT_REASON.MINIMUM_ORDER_QUANTITY,
      CART_ADJUSTMENT_REASON.QUANTITY_INCREMENT,
    ]);
    expect(decision.adjustment?.message).toBe(
      'Quantity adjusted from 1 to 5 because the minimum order quantity is 4 and this product is sold in increments of 5.',
    );
  });

  it('steps back to a valid multiple when the cap lands off-increment', () => {
    const decision = decideCartLineQuantity(
      { ...baseRules, quantityIncrement: 5, maxDirectQuantity: 48 },
      100,
    );

    expect(decision.quantity).toBe(45);
    expect(decision.adjustment?.reasons).toEqual([
      CART_ADJUSTMENT_REASON.MAXIMUM_DIRECT_QUANTITY,
      CART_ADJUSTMENT_REASON.QUANTITY_INCREMENT,
    ]);
    expect(decision.adjustment?.adjustedQuantity).toBe(45);
  });

  it('rejects a variant whose cap and increment leave no valid quantity', () => {
    const decision = decideCartLineQuantity(
      { ...baseRules, minimumOrderQuantity: 10, quantityIncrement: 20, maxDirectQuantity: 15 },
      12,
    );

    expect(decision.eligible).toBe(false);
    expect(decision.issues[0]).toBe(
      'This product cannot currently be ordered directly at a valid quantity.',
    );
  });
});
