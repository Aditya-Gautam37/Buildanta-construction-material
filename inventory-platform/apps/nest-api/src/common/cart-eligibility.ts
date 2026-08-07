import { PurchaseMode } from '@workspace/db';

export type CartVariantPurchaseRules = {
  purchaseMode: PurchaseMode;
  minimumOrderQuantity: number;
  maxDirectQuantity: number | null;
  bulkQuoteThreshold: number | null;
  quantityIncrement: number;
};

export type CartQuantityDecision =
  | {
      eligible: true;
      quantity: number;
      quantityAdjusted: boolean;
      requiresQuote: boolean;
      issues: string[];
    }
  | {
      eligible: false;
      quantity: null;
      quantityAdjusted: false;
      requiresQuote: false;
      issues: string[];
    };

function roundUpToIncrement(quantity: number, increment: number) {
  if (increment <= 1) return quantity;
  return Math.ceil(quantity / increment) * increment;
}

// requestedQuantity must be the new line TOTAL (existing + delta), not the delta alone, or repeated small adds could bypass maxDirectQuantity.
export function decideCartLineQuantity(
  rules: CartVariantPurchaseRules,
  requestedQuantity: number,
): CartQuantityDecision {
  if (rules.purchaseMode === PurchaseMode.QUOTE_ONLY) {
    return {
      eligible: false,
      quantity: null,
      quantityAdjusted: false,
      requiresQuote: false,
      issues: ['This product is available for bulk quotation only.'],
    };
  }

  if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
    return {
      eligible: false,
      quantity: null,
      quantityAdjusted: false,
      requiresQuote: false,
      issues: ['Quantity must be greater than zero.'],
    };
  }

  const issues: string[] = [];
  let quantity = Math.ceil(requestedQuantity);

  if (quantity < rules.minimumOrderQuantity) {
    quantity = rules.minimumOrderQuantity;
    issues.push(`Quantity increased to the minimum order quantity of ${rules.minimumOrderQuantity}.`);
  }

  const incrementedQuantity = roundUpToIncrement(quantity, rules.quantityIncrement);
  if (incrementedQuantity !== quantity) {
    quantity = incrementedQuantity;
    issues.push(`Quantity rounded up to a valid multiple of ${rules.quantityIncrement}.`);
  }

  if (rules.maxDirectQuantity != null && quantity > rules.maxDirectQuantity) {
    quantity = rules.maxDirectQuantity;
    issues.push(`Quantity capped at the maximum direct-purchase quantity of ${rules.maxDirectQuantity}.`);
  }

  const requiresQuote =
    rules.purchaseMode === PurchaseMode.DIRECT_AND_QUOTE &&
    rules.bulkQuoteThreshold != null &&
    quantity >= rules.bulkQuoteThreshold;

  return {
    eligible: true,
    quantity,
    quantityAdjusted: issues.length > 0,
    requiresQuote,
    issues,
  };
}
