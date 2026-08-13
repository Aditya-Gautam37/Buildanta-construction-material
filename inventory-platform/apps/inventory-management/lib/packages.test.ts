import assert from "node:assert/strict"
import { test } from "node:test"
import {
  canPublishPackages,
  inclusionCategories,
  inclusionCategoryLabel,
  packagePublishIssues,
  type ContractorPackageDraft,
} from "./professionals"

function draft(overrides: Partial<ContractorPackageDraft> = {}): ContractorPackageDraft {
  return {
    professionalId: "p1",
    name: "Economy",
    slug: "economy",
    tagline: null,
    summary: null,
    ratePerSqFt: "1250",
    rateBasis: "PLOT_AREA",
    inclusions: [{ category: "STRUCTURE", label: "Structure and plaster", allowanceAmount: null, allowanceUnit: null }],
    bestFor: [],
    exclusions: [],
    terms: null,
    validFrom: null,
    validUntil: null,
    materials: [],
    sortOrder: 0,
    status: "DRAFT",
    ...overrides,
  }
}

test("a complete package has nothing blocking publication", () => {
  assert.deepEqual(packagePublishIssues(draft()), [])
})

test("publication needs a name", () => {
  assert.ok(packagePublishIssues(draft({ name: "  " })).includes("a package name"))
})

test("publication needs a rate above zero", () => {
  for (const ratePerSqFt of ["0", "-100", "", "abc"]) {
    assert.ok(packagePublishIssues(draft({ ratePerSqFt })).includes("a rate above zero"), ratePerSqFt)
  }
})

test("publication needs at least one included work", () => {
  assert.ok(packagePublishIssues(draft({ inclusions: [] })).includes("at least one included work"))
})

test("an included work with only whitespace does not count", () => {
  const issues = packagePublishIssues(draft({
    inclusions: [{ category: "OTHER", label: "   ", allowanceAmount: null, allowanceUnit: null }],
  }))
  assert.ok(issues.includes("at least one included work"))
})

// An advertised rate that has already lapsed is worse than none: it quotes a
// price the contractor has stopped honouring.
test("an already-expired package cannot be published", () => {
  const issues = packagePublishIssues(draft({ validUntil: "2020-01-01" }), new Date("2026-08-13"))
  assert.ok(issues.includes("an end date in the future"))
})

test("a package valid into the future can be published", () => {
  const issues = packagePublishIssues(draft({ validUntil: "2027-01-01" }), new Date("2026-08-13"))
  assert.deepEqual(issues, [])
})

test("validity dates cannot be inverted", () => {
  const issues = packagePublishIssues(
    draft({ validFrom: "2026-12-01", validUntil: "2026-06-01" }),
    new Date("2026-01-01"),
  )
  assert.ok(issues.includes("an end date after the start date"))
})

test("unparseable dates are rejected rather than silently ignored", () => {
  assert.ok(packagePublishIssues(draft({ validUntil: "not-a-date" })).includes("a valid end date"))
})

test("only contractors may have construction packages", () => {
  assert.equal(canPublishPackages("CONTRACTOR"), true)
  for (const type of ["ARCHITECT", "BUILDER", "INTERIOR_DESIGNER", "PRODUCT_OWNER"] as const) {
    assert.equal(canPublishPackages(type), false, type)
  }
})

// The comparison table aligns packages by category, so the vocabulary has to
// stay fixed and cover the trades a contractor actually itemises.
test("the inclusion vocabulary covers the trades a package is compared on", () => {
  for (const expected of ["STRUCTURE", "ELECTRICAL", "PLUMBING", "FLOORING", "WINDOWS", "DOORS", "PAINT", "OTHER"]) {
    assert.ok(inclusionCategories.includes(expected as never), expected)
  }
})

test("category labels read as words, not database constants", () => {
  assert.equal(inclusionCategoryLabel("WATER_TANK"), "Water tank")
  assert.equal(inclusionCategoryLabel("ELECTRICAL"), "Electrical")
})
