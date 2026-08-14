import { describe, expect, it } from "vitest";
import { ORDER_STEPS, orderProgress } from "./order-progress";

describe("orderProgress", () => {
  it("shows an order with no sales order yet as placed, not stuck", () => {
    const progress = orderProgress(null, "SUBMITTED");
    expect(progress.currentStep).toBe("PLACED");
    expect(progress.stopped).toBe(false);
  });

  it("moves to confirmed once stock is reserved", () => {
    expect(orderProgress({ status: "CONFIRMED", dispatches: [] }, "ACCEPTED").currentStep).toBe("CONFIRMED");
  });

  it("treats an existing but unsent dispatch as packed", () => {
    const progress = orderProgress({ status: "CONFIRMED", dispatches: [{ status: "PLANNED" }] }, "ACCEPTED");
    expect(progress.currentStep).toBe("PACKED");
  });

  // The customer cares about the van, not the paperwork: a sales order can sit
  // at CONFIRMED while the goods are already on the road.
  it("reports out for delivery from the dispatch, even when the order still says confirmed", () => {
    const progress = orderProgress(
      { status: "CONFIRMED", dispatches: [{ status: "IN_TRANSIT", dispatchedAt: "2026-08-14T09:00:00Z" }] },
      "ACCEPTED",
    );
    expect(progress.currentStep).toBe("OUT_FOR_DELIVERY");
  });

  it("reports delivered from the dispatch's delivered timestamp", () => {
    const progress = orderProgress(
      { status: "CONFIRMED", dispatches: [{ status: "DELIVERED", deliveredAt: "2026-08-14T15:00:00Z" }] },
      "ACCEPTED",
    );
    expect(progress.currentStep).toBe("DELIVERED");
  });

  it("reports delivered when the order itself says so, with no dispatch record", () => {
    expect(orderProgress({ status: "DELIVERED", dispatches: [] }, "ACCEPTED").currentStep).toBe("DELIVERED");
  });

  it.each(["CANCELLED", "REJECTED", "CLOSED"])("stops the journey when the quotation is %s", (status) => {
    const progress = orderProgress({ status: "CONFIRMED", dispatches: [] }, status);
    expect(progress.stopped).toBe(true);
    expect(progress.headline).toMatch(/cancelled/i);
  });

  it("stops the journey when the order itself is cancelled", () => {
    const progress = orderProgress({ status: "CANCELLED", dispatches: [] }, "ACCEPTED");
    expect(progress.stopped).toBe(true);
  });

  // A cancelled order that had already shipped must not still read "delivered".
  it("prefers the cancellation over any progress already made", () => {
    const progress = orderProgress(
      { status: "CANCELLED", dispatches: [{ status: "DELIVERED", deliveredAt: "2026-08-14T15:00:00Z" }] },
      "ACCEPTED",
    );
    expect(progress.stopped).toBe(true);
  });

  it("gives an index that matches its step, so a progress bar cannot drift", () => {
    for (const [index, entry] of ORDER_STEPS.entries()) {
      const progress = orderProgress(
        entry.key === "DELIVERED" ? { status: "DELIVERED", dispatches: [] } : null,
        "SUBMITTED",
      );
      if (progress.currentStep === entry.key) expect(progress.currentIndex).toBe(index);
    }
  });

  it("always returns wording a customer can act on", () => {
    const progress = orderProgress({ status: "CONFIRMED", dispatches: [] }, "ACCEPTED");
    expect(progress.headline.length).toBeGreaterThan(0);
    expect(progress.detail.length).toBeGreaterThan(0);
  });
});
