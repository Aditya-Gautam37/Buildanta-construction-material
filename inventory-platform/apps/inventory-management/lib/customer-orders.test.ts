import assert from "node:assert/strict"
import { test } from "node:test"
import { orderView, sortByAttention, STEP_LABELS } from "./customer-orders"

test("an order with no sales order yet is awaiting confirmation", () => {
  const view = orderView(null, "SUBMITTED")
  assert.equal(view.step, "PLACED")
  assert.equal(view.nextAction, "Confirm stock and price")
})

test("a confirmed order tells staff to pick it", () => {
  const view = orderView({ status: "CONFIRMED", dispatches: [] }, "ACCEPTED")
  assert.equal(view.step, "CONFIRMED")
  assert.equal(view.nextAction, "Create a picking list")
})

test("an unsent dispatch reads as packed and waiting to go", () => {
  const view = orderView({ status: "CONFIRMED", dispatches: [{ status: "DRAFT" }] }, "ACCEPTED")
  assert.equal(view.step, "PACKED")
  assert.equal(view.nextAction, "Dispatch the picked stock")
})

// Staff and the customer must never disagree about where an order is, so this
// reads the dispatch rather than the sales order, exactly as the storefront does.
test("a dispatched order is out for delivery even while the order says confirmed", () => {
  const view = orderView(
    { status: "CONFIRMED", dispatches: [{ status: "IN_TRANSIT", dispatchedAt: new Date() }] },
    "ACCEPTED",
  )
  assert.equal(view.step, "OUT_FOR_DELIVERY")
})

test("a delivered order needs nothing further from staff", () => {
  const view = orderView(
    { status: "CONFIRMED", dispatches: [{ status: "DELIVERED", deliveredAt: new Date() }] },
    "ACCEPTED",
  )
  assert.equal(view.step, "DELIVERED")
  assert.equal(view.nextAction, null)
})

for (const status of ["CANCELLED", "REJECTED", "CLOSED"]) {
  test(`a ${status} quotation stops the order and asks nothing of staff`, () => {
    const view = orderView({ status: "CONFIRMED", dispatches: [] }, status)
    assert.equal(view.stopped, true)
    assert.equal(view.nextAction, null)
  })
}

test("cancellation wins over progress already made", () => {
  const view = orderView(
    { status: "CANCELLED", dispatches: [{ status: "DELIVERED", deliveredAt: new Date() }] },
    "ACCEPTED",
  )
  assert.equal(view.stopped, true)
})

test("every step has wording staff can read", () => {
  for (const label of Object.values(STEP_LABELS)) assert.ok(label.length > 0)
})

// The queue exists so staff know what to do next; anything waiting on us has
// to float above the orders that do not.
test("orders needing action come first, then newest", () => {
  const rows = [
    { id: "done", view: orderView({ status: "CONFIRMED", dispatches: [{ status: "DELIVERED", deliveredAt: new Date() }] }, "ACCEPTED"), placedAt: "2026-08-14" },
    { id: "old-waiting", view: orderView(null, "SUBMITTED"), placedAt: "2026-08-01" },
    { id: "new-waiting", view: orderView(null, "SUBMITTED"), placedAt: "2026-08-13" },
  ]

  assert.deepEqual(sortByAttention(rows).map((row) => row.id), ["new-waiting", "old-waiting", "done"])
})
