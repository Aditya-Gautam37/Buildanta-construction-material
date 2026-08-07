import { PurchaseMode } from '@workspace/db';

export type CartVariantPurchaseRules = {
  purchaseMode: PurchaseMode;
  minimumOrderQuantity: number;
  maxDirectQuantity: number | null;
  bulkQuoteThreshold: number | null;
  quantityIncrement: number;
};

export const CART_ADJUSTMENT_REASON = {
  MINIMUM_ORDER_QUANTITY: 'MINIMUM_ORDER_QUANTITY',
  QUANTITY_INCREMENT: 'QUANTITY_INCREMENT',
  MAXIMUM_DIRECT_QUANTITY: 'MAXIMUM_DIRECT_QUANTITY',
} as const;

export type CartAdjustmentReason =
  (typeof CART_ADJUSTMENT_REASON)[keyof typeof CART_ADJUSTMENT_REASON];

export type CartQuantityAdjustment = {
  requestedQuantity: number;
  adjustedQuantity: number;
  reasons: CartAdjustmentReason[];
  message: string;
};

export type CartQuantityDecision =
  | {
      eligible: true;
      quantity: number;
      requiresQuote: boolean;
      adjustment: CartQuantityAdjustment | null;
      issues: string[];
    }
  | {
      eligible: false;
      quantity: null;
      requiresQuote: false;
      adjustment: null;
      issues: string[];
    };

function reject(issue: string): CartQuantityDecision {
  return { eligible: false, quantity: null, requiresQuote: false, adjustment: null, issues: [issue] };
}

function reasonClause(reason: CartAdjustmentReason, rules: CartVariantPurchaseRules) {
  if (reason === CART_ADJUSTMENT_REASON.MINIMUM_ORDER_QUANTITY) {
    return `the minimum order quantity is ${rules.minimumOrderQuantity}`;
  }
  if (reason === CART_ADJUSTMENT_REASON.QUANTITY_INCREMENT) {
    return `this product is sold in increments of ${rules.quantityIncrement}`;
  }
  return `the maximum direct-order quantity is ${rules.maxDirectQuantity}`;
}

function buildMessage(
  requestedQuantity: number,
  adjustedQuantity: number,
  reasons: CartAdjustmentReason[],
  rules: CartVariantPurchaseRules,
) {
  const clauses = reasons.map((reason) => reasonClause(reason, rules));
  const because =
    clauses.length === 1
      ? clauses[0]
      : `${clauses.slice(0, -1).join(', ')} and ${clauses[clauses.length - 1]}`;
  return `Quantity adjusted from ${requestedQuantity} to ${adjustedQuantity} because ${because}.`;
}

// requestedQuantity must be the new line TOTAL (existing + delta), not the delta alone, or repeated small adds could bypass maxDirectQuantity.
export function decideCartLineQuantity(
  rules: CartVariantPurchaseRules,
  requestedQuantity: number,
): CartQuantityDecision {
  if (rules.purchaseMode === PurchaseMode.QUOTE_ONLY) {
    return reject('This product is available for bulk quotation only.');
  }
  if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
    return reject('Quantity must be greater than zero.');
  }

  const increment = Math.max(1, rules.quantityIncrement);
  const reasons: CartAdjustmentReason[] = [];
  const requested = Math.ceil(requestedQuantity);
  let quantity = requested;

  if (quantity < rules.minimumOrderQuantity) {
    quantity = rules.minimumOrderQuantity;
    reasons.push(CART_ADJUSTMENT_REASON.MINIMUM_ORDER_QUANTITY);
  }

  if (quantity % increment !== 0) {
    quantity = Math.ceil(quantity / increment) * increment;
    reasons.push(CART_ADJUSTMENT_REASON.QUANTITY_INCREMENT);
  }

  if (rules.maxDirectQuantity != null && quantity > rules.maxDirectQuantity) {
    quantity = rules.maxDirectQuantity;
    reasons.push(CART_ADJUSTMENT_REASON.MAXIMUM_DIRECT_QUANTITY);
    // Capping can land off-increment (max 48, increment 5), so step back down to
    // the nearest valid multiple rather than returning a quantity we just rejected.
    if (quantity % increment !== 0) {
      quantity = Math.floor(quantity / increment) * increment;
      if (!reasons.includes(CART_ADJUSTMENT_REASON.QUANTITY_INCREMENT)) {
        reasons.push(CART_ADJUSTMENT_REASON.QUANTITY_INCREMENT);
      }
    }
    if (quantity < rules.minimumOrderQuantity) {
      return reject('This product cannot currently be ordered directly at a valid quantity.');
    }
  }

  const requiresQuote =
    rules.purchaseMode === PurchaseMode.DIRECT_AND_QUOTE &&
    rules.bulkQuoteThreshold != null &&
    quantity >= rules.bulkQuoteThreshold;

  return {
    eligible: true,
    quantity,
    requiresQuote,
    adjustment: reasons.length
      ? {
          requestedQuantity: requested,
          adjustedQuantity: quantity,
          reasons,
          message: buildMessage(requested, quantity, reasons, rules),
        }
      : null,
    issues: [],
  };
}
