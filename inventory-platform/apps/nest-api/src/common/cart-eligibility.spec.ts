import { PurchaseMode } from '@workspace/db';
import { decideCartLineQuantity, type CartVariantPurchaseRules } from './cart-eligibility';

const baseRules: CartVariantPurchaseRules = {
  purchaseMode: PurchaseMode.DIRECT_ONLY,
  minimumOrderQuantity: 1,
  maxDirectQuantity: null,
  bulkQuoteThreshold: null,
  quantityIncrement: 1,
};

describe('decideCartLineQuantity', () => {
  it('rejects quote-only variants outright', () => {
    const decision = decideCartLineQuantity({ ...baseRules, purchaseMode: PurchaseMode.QUOTE_ONLY }, 5);
    expect(decision.eligible).toBe(false);
    expect(decision.quantity).toBeNull();
  });

  it('rejects a zero or negative requested quantity', () => {
    expect(decideCartLineQuantity(baseRules, 0).eligible).toBe(false);
    expect(decideCartLineQuantity(baseRules, -3).eligible).toBe(false);
  });

  it('clamps up to the minimum order quantity', () => {
    const decision = decideCartLineQuantity({ ...baseRules, minimumOrderQuantity: 10 }, 3);
    expect(decision).toMatchObject({ eligible: true, quantity: 10, quantityAdjusted: true });
  });

  it('rounds up to the next valid increment', () => {
    const decision = decideCartLineQuantity({ ...baseRules, quantityIncrement: 5 }, 7);
    expect(decision).toMatchObject({ eligible: true, quantity: 10, quantityAdjusted: true });
  });

  it('clamps down to the maximum direct quantity', () => {
    const decision = decideCartLineQuantity({ ...baseRules, maxDirectQuantity: 20 }, 50);
    expect(decision).toMatchObject({ eligible: true, quantity: 20, quantityAdjusted: true });
  });

  it('applies minimum, increment and maximum together in order', () => {
    const decision = decideCartLineQuantity(
      { ...baseRules, minimumOrderQuantity: 4, quantityIncrement: 5, maxDirectQuantity: 8 },
      1,
    );
    // 1 -> clamp to min 4 -> round up to increment 5 -> clamp down to max 8 (5 <= 8, stays 5)
    expect(decision).toMatchObject({ eligible: true, quantity: 5, quantityAdjusted: true });
  });

  it('passes an already-valid quantity through unchanged', () => {
    const decision = decideCartLineQuantity({ ...baseRules, minimumOrderQuantity: 5, quantityIncrement: 5 }, 10);
    expect(decision).toMatchObject({ eligible: true, quantity: 10, quantityAdjusted: false, issues: [] });
  });

  it('never requires a quote for DIRECT_ONLY, capping instead', () => {
    const decision = decideCartLineQuantity(
      { ...baseRules, purchaseMode: PurchaseMode.DIRECT_ONLY, maxDirectQuantity: 100, bulkQuoteThreshold: 10 },
      500,
    );
    expect(decision).toMatchObject({ eligible: true, quantity: 100, requiresQuote: false });
  });

  it('flags requiresQuote once the DIRECT_AND_QUOTE threshold is reached', () => {
    const decision = decideCartLineQuantity(
      { ...baseRules, purchaseMode: PurchaseMode.DIRECT_AND_QUOTE, bulkQuoteThreshold: 50 },
      50,
    );
    expect(decision).toMatchObject({ eligible: true, quantity: 50, requiresQuote: true });
  });

  it('does not flag requiresQuote below the DIRECT_AND_QUOTE threshold', () => {
    const decision = decideCartLineQuantity(
      { ...baseRules, purchaseMode: PurchaseMode.DIRECT_AND_QUOTE, bulkQuoteThreshold: 50 },
      49,
    );
    expect(decision).toMatchObject({ eligible: true, quantity: 49, requiresQuote: false });
  });

  it('ignores bulkQuoteThreshold entirely when unset', () => {
    const decision = decideCartLineQuantity(
      { ...baseRules, purchaseMode: PurchaseMode.DIRECT_AND_QUOTE, bulkQuoteThreshold: null },
      1_000_000,
    );
    expect(decision.requiresQuote).toBe(false);
  });
});
