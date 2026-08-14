import assert from "node:assert/strict"
import { test } from "node:test"
import { buildRequirementBrief, type RequirementBriefSource } from "./requirement-brief"

function enquiry(overrides: Partial<RequirementBriefSource> = {}): RequirementBriefSource {
  return {
    reference: "PKG-ABC123-XYZ9",
    packageNameSnapshot: "Standard",
    rateSnapshot: "1450.00",
    rateBasisSnapshot: "PLOT_AREA",
    amountSnapshot: "1305000.00",
    areaSqFt: "900.00",
    projectLocation: "Kakadeo",
    plotDimensions: "20 x 45 ft",
    floors: 2,
    constructionType: "New house",
    expectedStart: "Within 3 months",
    requirement: "Corner plot, needs a boundary wall quote separately.",
    createdAt: "2026-08-14T10:00:00.000Z",
    ...overrides,
  }
}

// The customer consented to Buildanta contacting them, not to a contractor
// receiving their details. This is the test that keeps that promise.
test("never includes the customer's name, phone or email", () => {
  const brief = buildRequirementBrief({
    ...enquiry(),
    // Fields deliberately absent from the type, simulating a careless spread.
    ...({ customerName: "Some Person", customerPhone: "9812345678", customerEmail: "a@b.com" } as object),
  } as RequirementBriefSource)

  assert.ok(!brief.includes("Some Person"))
  assert.ok(!brief.includes("9812345678"))
  assert.ok(!brief.includes("a@b.com"))
})

test("tells the contractor that Buildanta holds the contact details", () => {
  const brief = buildRequirementBrief(enquiry())
  assert.match(brief, /Customer contact details are held by Buildanta/)
  assert.match(brief, /PKG-ABC123-XYZ9/)
})

test("carries the project details a contractor needs to quote", () => {
  const brief = buildRequirementBrief(enquiry())
  for (const expected of ["Standard", "900 sq ft", "Kakadeo", "20 x 45 ft", "New house", "Within 3 months"]) {
    assert.ok(brief.includes(expected), expected)
  }
})

test("formats money in Indian digit grouping", () => {
  const brief = buildRequirementBrief(enquiry())
  assert.ok(brief.includes("Rs 13,05,000"), brief)
  assert.ok(brief.includes("Rs 1,450 per sq ft"), brief)
})

test("states which area the rate is quoted against", () => {
  assert.match(buildRequirementBrief(enquiry()), /per sq ft of plot area/)
  assert.match(
    buildRequirementBrief(enquiry({ rateBasisSnapshot: "BUILT_UP_AREA" })),
    /per sq ft of built-up area/,
  )
})

// A brief that reads like a price the contractor has already agreed to would
// be doing the exact thing the whole feature avoids.
test("says plainly that the amount is not a quotation", () => {
  const brief = buildRequirementBrief(enquiry())
  assert.match(brief, /It is not a quotation/)
  assert.match(brief, /advertised rate multiplied by the area/)
})

test("omits optional details the customer left blank, rather than printing empty labels", () => {
  const brief = buildRequirementBrief(enquiry({
    projectLocation: null,
    plotDimensions: null,
    floors: null,
    constructionType: null,
    expectedStart: null,
    requirement: null,
  }))

  assert.ok(!brief.includes("Area of Kanpur:"))
  assert.ok(!brief.includes("Plot size:"))
  assert.ok(!brief.includes("Floors:"))
  assert.ok(!brief.includes("Customer notes:"))
  // The essentials survive.
  assert.ok(brief.includes("Standard"))
  assert.ok(brief.includes("900 sq ft"))
})

test("treats whitespace-only notes as absent", () => {
  const brief = buildRequirementBrief(enquiry({ requirement: "   " }))
  assert.ok(!brief.includes("Customer notes:"))
})

test("includes the customer's own notes when they wrote some", () => {
  const brief = buildRequirementBrief(enquiry())
  assert.match(brief, /Customer notes:/)
  assert.match(brief, /Corner plot/)
})
