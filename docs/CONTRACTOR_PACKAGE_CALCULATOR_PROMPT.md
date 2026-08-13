# Contractor Package & Cost Calculator — Production Build Prompt

## Decisions (settled — build to these, do not re-open)

| Question | Decision |
| --- | --- |
| Who creates packages | **Buildanta staff only**, in the admin app. No contractor logins, no contractor auth system |
| Package names | **Each contractor defines their own.** Free text, any number of packages — not fixed Economy/Standard/Premium slots |
| What the customer enters | **Plot area only.** No floors, no built-up area — matches how Kanpur contractors quote today |
| Output | **Exact figure per package**, plus an overall range summary. Driven entirely by rates staff can edit at any time |
| Kanpur market benchmark | **Not shown.** Staff enter realistic rates and keep them current; no average is displayed or maintained |
| After the estimate | **Enquiry with context** — link to the existing `/bulk-quotes` flow carrying the area and chosen package. No new form |

## Goal

On a contractor's public profile, let a customer enter their plot area and
immediately see what that contractor would charge across their published
packages — the estimated cost, what each package includes, and which materials
are used — updating live as the area changes.

Modelled on how contractors in Kanpur actually advertise: tiered packages with a
per-square-foot rate, a fixed inclusion list, named material brands, and a
worked example for a typical plot.

---

## Current state (verified — do not re-derive)

| Area | Reality today |
| --- | --- |
| Professional record | `id, name, slug, type, headline, bio, photoUrl, location, yearsExperience, website, portfolioUrl, services[], featured` |
| Pricing data | **None.** No rates, packages, inclusions or material fields exist |
| Public API | `GET /professionals`, `GET /professionals/:slug` — contact fields deliberately excluded |
| Storefront profile | `app/professionals/[type]/[slug]/page.tsx` |
| Card / directory | `app/professional-card.tsx`, `app/professionals/page.tsx` |
| Location helper | `app/professionals/location.ts` — `formatLocation`, `SERVICE_CITY` |
| Admin | `inventory-platform/apps/inventory-management/app/professionals/` — reads Prisma directly |
| API service | `inventory-platform/apps/nest-api/src/professionals/professionals.service.ts` |
| Styling | `app/globals.css` + CSS modules. No UI library. Icons via `app/ui-icon.tsx` |
| Tests | `vitest` (storefront), `jest` (nest-api), `node:test` (admin) |

There is a separate whole-project calculator system
(`CalculatorDefinition` / `CalculatorVersion` / `MaterialEstimate`). **Do not
reuse it.** That engine models multi-material project estimation; this is a
per-contractor rate card. Keep them independent.

---

## Data model

Add two models. Additive only — do not alter existing tables.

**`ContractorPackage`** — one row per package per professional
- `professionalId` (FK, cascade delete)
- `name` — e.g. "Economy", "Standard", "Premium"
- `ratePerSqFt` — Decimal, required, positive
- `tagline` — short line, optional
- `inclusions` — string array ("Structure + Plaster Both Sides", ...)
- `bestFor` — string array ("Budget friendly homes", ...)
- `sortOrder` — integer
- `published` — boolean, default false

**`ContractorPackageMaterial`** — named materials per package
- `packageId` (FK, cascade delete)
- `category` — e.g. "Cement", "Steel", "Bricks"
- `detail` — e.g. "UltraTech / ACC"
- `sortOrder`

Constraints:
- Unique `(professionalId, name)`
- Follow the repo's migration conventions: `YYYYMMDDHHMMSS_snake_case_name/migration.sql`,
  PascalCase quoted tables, named constraints, 63-char identifier limit

---

## Backend

Extend the existing public professionals endpoints to include **published
packages only**, ordered by `sortOrder`. Do not create a separate endpoint —
the profile page should not need a second round trip.

Unpublished packages must be invisible to customers and indistinguishable from
"no packages", exactly as unpublished professionals are today.

Validation via Zod in `common/request-schemas.ts`, `.strict()`, following the
existing convention. Rate must be positive and finite; cap array lengths.

---

## Admin

Add package management to the existing professionals admin screen. Staff-only —
this build adds **no contractor-facing login**.

Rates change with the market, so editing must be quick: a staff member should be
able to open a contractor, change a rate, and save without touching anything
else.

- Add / edit / remove packages per professional
- Reorder packages
- Publish and unpublish independently of the professional record
- Materials editable as category + detail rows
- Role gating consistent with the existing professionals screen
- Publishing blocked unless the package has a name, a positive rate, and at
  least one inclusion

---

## The calculator (storefront)

Lives on the contractor's profile page, below the About section.

**Input**
- Plot area in sq ft — numeric, sensible min/max, live update on change
- A few quick-pick chips (e.g. 500 / 900 / 1200 / 1800) to avoid typing
- **Plot area is the only input.** No floors and no built-up area: contractors
  here quote against plot size, and adding a floor multiplier nobody prices by
  would make every number wrong.

**Output — one card per published package, side by side**
- Package name and rate per sq ft
- **Estimated cost** = `rate × area`, rounded to the nearest ₹100, formatted
  Indian-style (`₹11,25,000`)
- Inclusions list
- Materials used (category → brands)
- "Best for" points

**Behaviour**
- Recomputes instantly and client-side. No network call, no AI.
- Deterministic arithmetic in a pure, separately tested module — mirroring
  `app/material-knowledge/quantity-calculator.ts`
- Highlight the cheapest and most expensive as a range summary:
  "₹6,25,000 – ₹8,00,000 for 500 sq ft"

**Honesty rules — non-negotiable**
- Label the output an **estimate**, never a quote, price or contract
- State plainly that the final cost depends on site conditions, design and
  material choices, and is confirmed by the contractor
- Show only rates the contractor actually published. Never interpolate,
  average, or infer a missing tier
- Do not invent inclusions or material brands
- Do not display a package the contractor has not published

**Empty state**
If the contractor has no published packages, show a short line inviting the
customer to send an enquiry, and link to the existing enquiry flow. Do not show
an empty calculator or a zero cost.

---

## After the estimate

The primary action stays the existing Buildanta enquiry route
(`/bulk-quotes`). Carry the chosen area and package name through as query
parameters so the enquiry arrives with context. Do not build a new form and do
not expose contractor contact details.

---

## Design

- Match existing Buildanta branding: navy structure, orange primary action,
  white / warm light-grey surfaces
- Reuse existing CSS variables and spacing. No new UI dependency
- No inline styles. Readable components, not one-line JSX
- Package cards must read as a comparison — aligned rows, consistent heights
- Legible type; avoid the very small font sizes used elsewhere in `globals.css`
- Semantic HTML, correct heading order, visible focus states
- The area input must be a labelled form control, keyboard and screen-reader usable

## Responsive

Verify at 1440 / 1024 / 768 / 390 px.
- Desktop: packages side by side
- Tablet: two across or horizontal scroll with clear affordance
- Mobile: stacked, one column, input sticky or prominent, no horizontal overflow
- Tap targets comfortable

---

## Tests

1. Cost maths: rate × area, rounding, Indian number formatting
2. Boundary cases: zero, negative, non-numeric, very large area, fractional rates
3. Range summary picks the true minimum and maximum
4. Unpublished packages never reach the customer payload
5. A professional with no packages renders the empty state, not a zero estimate
6. Output is labelled an estimate and carries the "final cost may vary" note
7. Admin validation blocks publishing an incomplete package
8. Existing professional routes, cards and profile links still work

Run: storefront `vitest`, nest-api `jest`, `tsc --noEmit` in each workspace,
`eslint`, and a production build.

---

## Verification

Start the dev servers and check in a real browser:
- Typing an area updates every package instantly
- Numbers match hand calculation (`1450 × 900 = ₹13,05,000`)
- Estimate wording is present and unmissable
- A contractor with no packages degrades cleanly
- No console errors, no horizontal overflow at any breakpoint
- Header, footer, breadcrumbs and existing profile content unchanged

---

## Scope boundaries

- Do not deploy. Work on a branch.
- Do not change production data without explicit approval.
- Do not expose contractor email or phone — that decision stands.
- Do not add ratings, reviews, verification badges or availability.
- Do not modify the existing project calculator system.
- Do not invent pricing for the existing contractor record.

## Acceptance criteria

- A customer can enter an area and instantly compare that contractor's real
  published packages
- Every figure traces to a rate the contractor published
- Nothing reads as a binding quote
- Contractors with no packages degrade gracefully
- Admin can create, publish and reorder packages
- Works on desktop and mobile; tests, types, lint and build all pass
