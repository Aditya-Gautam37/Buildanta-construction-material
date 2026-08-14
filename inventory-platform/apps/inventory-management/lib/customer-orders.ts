// The five-step view of a customer order, for staff.
//
// This deliberately mirrors app/account/order-progress.ts in the storefront:
// staff and the customer must never see a different answer to "where is this
// order". The two apps share no package today, so the mapping is duplicated
// rather than imported — if you change the steps here, change them there too.

export const ORDER_STEPS = ["PLACED", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"] as const

export type OrderStep = (typeof ORDER_STEPS)[number]

export const STEP_LABELS: Record<OrderStep, string> = {
  PLACED: "Order placed",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
}

const STOPPED = new Set(["CANCELLED", "REJECTED", "CLOSED"])

export type OrderView = {
  step: OrderStep
  label: string
  stopped: boolean
  /** What staff should do next, or null when nothing is waiting on us. */
  nextAction: string | null
}

type SalesOrderLike = {
  status: string
  dispatches?: { status: string; dispatchedAt?: Date | string | null; deliveredAt?: Date | string | null }[]
} | null | undefined

export function orderView(order: SalesOrderLike, quotationStatus: string): OrderView {
  if (STOPPED.has(quotationStatus) || (order && STOPPED.has(order.status))) {
    return { step: "PLACED", label: "Cancelled", stopped: true, nextAction: null }
  }

  if (!order) {
    return { step: "PLACED", label: STEP_LABELS.PLACED, stopped: false, nextAction: "Confirm stock and price" }
  }

  const dispatches = order.dispatches ?? []

  if (dispatches.some((d) => d.status === "DELIVERED" || d.deliveredAt)) {
    return { step: "DELIVERED", label: STEP_LABELS.DELIVERED, stopped: false, nextAction: null }
  }

  if (dispatches.some((d) => d.dispatchedAt || ["DISPATCHED", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(d.status))) {
    return { step: "OUT_FOR_DELIVERY", label: STEP_LABELS.OUT_FOR_DELIVERY, stopped: false, nextAction: "Record proof of delivery" }
  }

  if (dispatches.length > 0) {
    return { step: "PACKED", label: STEP_LABELS.PACKED, stopped: false, nextAction: "Dispatch the picked stock" }
  }

  if (order.status === "CONFIRMED" || order.status === "PROCESSING") {
    return { step: "CONFIRMED", label: STEP_LABELS.CONFIRMED, stopped: false, nextAction: "Create a picking list" }
  }

  return { step: "PLACED", label: STEP_LABELS.PLACED, stopped: false, nextAction: "Confirm stock and price" }
}

/** Orders needing staff attention first, then newest. */
export function sortByAttention<T extends { view: OrderView; placedAt: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aWaiting = a.view.nextAction ? 0 : 1
    const bWaiting = b.view.nextAction ? 0 : 1
    if (aWaiting !== bWaiting) return aWaiting - bWaiting
    return b.placedAt.localeCompare(a.placedAt)
  })
}
