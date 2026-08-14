// Turns an order's status into the plain "where is my order" answer.
//
// The database has several statuses across quotation, sales order and dispatch.
// A customer does not want to reconcile three vocabularies — they want one
// line telling them where their materials are, and a sense of what happens
// next. This maps all of it onto a single five-step journey.

export const ORDER_STEPS = [
  { key: "PLACED", label: "Order placed", detail: "We have your order and are confirming stock." },
  { key: "CONFIRMED", label: "Confirmed", detail: "Stock is reserved for you." },
  { key: "PACKED", label: "Packed", detail: "Your materials are ready to leave the warehouse." },
  { key: "OUT_FOR_DELIVERY", label: "Out for delivery", detail: "On the way to your address." },
  { key: "DELIVERED", label: "Delivered", detail: "Delivered. Thank you." },
] as const;

export type OrderStepKey = (typeof ORDER_STEPS)[number]["key"];

export type OrderProgress = {
  currentStep: OrderStepKey;
  currentIndex: number;
  /** True when the order stopped rather than completed. */
  stopped: boolean;
  headline: string;
  detail: string;
};

type OrderLike = {
  status: string;
  dispatches?: Array<{ status: string; deliveredAt?: string | null; dispatchedAt?: string | null }>;
} | null | undefined;

const CANCELLED = new Set(["CANCELLED", "REJECTED", "CLOSED"]);

/**
 * Reads the furthest point the order has actually reached.
 *
 * Deliberately driven by dispatch state where one exists: a sales order can sit
 * at CONFIRMED while its dispatch is already out for delivery, and the customer
 * cares about the van, not the paperwork.
 */
export function orderProgress(order: OrderLike, quotationStatus: string): OrderProgress {
  if (CANCELLED.has(quotationStatus) || (order && CANCELLED.has(order.status))) {
    return {
      currentStep: "PLACED",
      currentIndex: 0,
      stopped: true,
      headline: "This order was cancelled",
      detail: "Nothing further will be delivered. Contact us if this looks wrong.",
    };
  }

  // No sales order yet: staff are still confirming the request.
  if (!order) {
    return step("PLACED", false);
  }

  const dispatches = order.dispatches ?? [];
  const delivered = dispatches.some((dispatch) => dispatch.status === "DELIVERED" || dispatch.deliveredAt);
  if (delivered || order.status === "DELIVERED" || order.status === "COMPLETED") {
    return step("DELIVERED", false);
  }

  const outForDelivery = dispatches.some(
    (dispatch) => dispatch.dispatchedAt || ["DISPATCHED", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(dispatch.status),
  );
  if (outForDelivery) return step("OUT_FOR_DELIVERY", false);

  // A dispatch exists but has not left yet — the goods are being made ready.
  if (dispatches.length > 0) return step("PACKED", false);

  if (order.status === "CONFIRMED" || order.status === "PROCESSING") return step("CONFIRMED", false);

  return step("PLACED", false);
}

function step(key: OrderStepKey, stopped: boolean): OrderProgress {
  const index = ORDER_STEPS.findIndex((entry) => entry.key === key);
  const entry = ORDER_STEPS[index]!;
  return { currentStep: key, currentIndex: index, stopped, headline: entry.label, detail: entry.detail };
}
