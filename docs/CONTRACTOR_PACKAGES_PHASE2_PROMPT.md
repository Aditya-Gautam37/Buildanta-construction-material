# Contractor Packages, Phase 2 — Build Prompt

Supersedes `CONTRACTOR_PACKAGE_CALCULATOR_PROMPT.md`, which covered phase 1
(now shipped).

---

## What I changed from the original draft, and why

| Your draft said | Changed to | Why |
| --- | --- | --- |
| Create a new `ConstructionPackage` model | **Extend the existing `ContractorPackage`** | Packages already exist and are live. A second model would fork the schema: two admin screens, two APIs, silently diverging data |
| Calculator takes built-up area + floors | **The package states its own rate basis** | Your earlier decision was plot area, and that is what is live. Rather than guess, each contractor records whether their rate is per sq ft of plot or built-up area |
| Comparison across named categories | **Categories become a fixed enum** | Rows cannot align between packages if the category is free text. Structured comparison requires a controlled vocabulary |
| One large delivery | **Five stages** | The original is 5–10× a normal change. Staged, each part is reviewable and revertible |
| (not mentioned) | **Remove the dead enquiry link** | The current "Enquire" button sends parameters `/bulk-quotes` silently discards. Fix or remove it — do not leave it |
| (not mentioned) | **Enquiry PII rules** | The enquiry table is the first place Buildanta stores customer phone numbers at scale. Retention and access need deciding before it is built |

---

## Current state (verified — do not re-derive)

**Already built and deployed:**

| Item | Detail |
| --- | --- |
| `ContractorPackage` | `professionalId, name, tagline, ratePerSqFt (Decimal 12,2), inclusions String[], bestFor String[], sortOrder, published, timestamps`. Unique on `(professionalId, name)` |
| `ContractorPackageMaterial` | `packageId, category, detail, sortOrder` |
| Migration | `20260813090000_contractor_packages` |
| Public API | Packages ride on `GET /professionals` and `/professionals/:slug`, filtered `published: true` at the query |
| Admin | `app/professionals/package-manager.tsx` — create/edit/delete/publish |
| Storefront | `app/professionals/package-calculator.tsx` + `package-estimate.ts` (pure, tested) |
| Live data | Three published packages on one contractor |

**Known defects to fix as part of this work:**

1. `app/bulk-quotes/page.tsx` reads only `product`; the calculator's
   `professional`, `package`, `area`, `ref` params are discarded
2. `app/globals.css` — `.professional-card-body > p` (0,1,1) outranks
   `.professional-card-category` (0,1,0), forcing 8px text on mobile
3. Calculator heading skip: `h3` → `h5`, should be `h4`
4. `docs/professionals.md` is stale — still tells staff contact details are published

---

## Stage plan

Deliver in this order. Each stage ends with tests, typecheck, lint and a
working site. Stop between stages for review.

| Stage | Scope |
| --- | --- |
| **1** | Extend the package model: rate basis, exclusions, terms, validity, status lifecycle, structured inclusions |
| **2** | Admin controls for the new fields; duplicate and reorder |
| **3** | Public display: profile section, directory card hint, comparison view |
| **4** | Enquiry system, and fix the dead enquiry link |
| **5** | Brochure, docs, material-quotation handoff |

---

## Stage 1 — Data model

Extend `ContractorPackage`. Do not create a parallel model.

**Add to `ContractorPackage`:**

- `slug` — unique per professional, for stable public URLs
- `summary` — short description
- `rateBasis` — enum `PLOT_AREA | BUILT_UP_AREA`, default `PLOT_AREA`
- `exampleArea`, `exampleCost` — the worked example from the contractor's own
  flyer, optional
- `exclusions` — what the rate does not cover
- `terms` — contractor's stated conditions
- `validFrom`, `validUntil` — optional; an open-ended advertised rate is an
  open-ended commitment
- `status` — enum `DRAFT | UNDER_REVIEW | PUBLISHED | ARCHIVED`

**Replace `inclusions String[]` with `ContractorPackageInclusion`:**

- `packageId`, `category` (enum, below), `label`, `description`,
  `allowanceAmount` (Decimal, nullable), `allowanceUnit`, `sortOrder`

The allowance fields exist because contractors advertise "tiles up to
₹40/sq ft" — a number customers compare directly.

**Extend `ContractorPackageMaterial`:**

- Rename `detail` → `specification`
- Add `preferredBrands`, `substitutionNote`

**Comparison category enum** (the controlled vocabulary that makes comparison
possible):

`STRUCTURE, PLASTER, ELECTRICAL, PLUMBING, FLOORING, WINDOWS, DOORS, KITCHEN,
BATHROOM, PAINT, CEILING, ELEVATION, WATER_TANK, RAILING, OTHER`

**On `status` vs `published`:** migrate the existing boolean into the enum and
drop the boolean. Two sources of truth for visibility is how draft content
leaks.

**Money:** keep `Decimal(12,2)`. Never floats.

**Migration:** must preserve the three live packages and their rates. Backfill
`status = PUBLISHED` where `published = true`, `slug` from a slugified name,
`rateBasis = PLOT_AREA`, and move each `inclusions` string into an inclusion row
with `category = OTHER` for staff to re-categorise.

---

## Rules

- A professional may have zero or many packages
- **Only `CONTRACTOR` professionals may publish packages.** Enforce in the
  service, not just the UI
- Slug unique within a professional
- `DRAFT`, `UNDER_REVIEW`, `ARCHIVED` are never public
- Publication requires: name, positive rate, at least one inclusion, and
  `validUntil` either unset or in the future
- The API filters by status at the query. Never rely on the client
- Deleting a professional cascades, as today

---

## Stage 2 — Admin

Extend the existing package manager. Staff can: create, edit, **duplicate**
(Economy → Standard is mostly a copy), **reorder**, set validity, move through
the status lifecycle, and archive.

Validation must block publishing when required fields are missing, when the
professional is not a contractor, when dates are inverted, or when any amount is
negative. Show *why* publication is blocked, not just that it is.

---

## Stage 3 — Public display

**Directory card** — only when the professional is a contractor **and** has a
published package: show package count and `Packages from ₹X/sq ft*`, plus a
"View packages" action. Never show a starting rate otherwise. Keep the card
compact.

**Profile** — a "Construction packages" section, only when published packages
exist. Per package: name, summary, rate with its basis stated, suitable-for,
key inclusions, key materials, validity when present, and both "View details"
and "Request detailed quotation". Omit empty fields entirely.

**Comparison** — when two or more published packages exist. Align rows by the
category enum. Desktop: readable table. Mobile: stacked sections or a
deliberately scrollable table. **Exclusions must be shown, not hidden.** Do not
style the cheapest as recommended, and do not call any package "best" unless
staff entered suitable-for text saying so.

---

## Stage 4 — Calculator and enquiry

**Calculator** takes area and the selected package. The input is labelled from
the package's `rateBasis` — "Plot area (sq ft)" or "Built-up area (sq ft)" — so
the customer is never guessing which number to enter. Floors only appear if a
package is quoted per built-up area.

Result labelled **"Preliminary package estimate"**, with:

> This is an indicative calculation based on the professional's advertised rate.
> Final pricing depends on approved drawings, site conditions, built-up area,
> specifications, taxes and material availability.

**Enquiry** — a structured request from a package, capturing name, phone,
optional email, Kanpur area, plot dimensions, area, floors, construction type,
expected start, selected professional and package, additional requirement, and
explicit consent to be contacted. Reuse authenticated customer details when
available.

**The server must reload the package and recompute the amount.** Never trust a
professionalId, packageId, rate or total from the browser. Store the rate and
computed amount as a **snapshot**, so later price changes do not rewrite
historical enquiries.

**Status:** `SUBMITTED, REVIEWING, PROFESSIONAL_CONTACTED, CALLBACK_SCHEDULED,
SITE_VISIT_SCHEDULED, QUOTATION_PREPARED, CLOSED, CANCELLED`. Staff can update
status and add internal notes.

**Do not** auto-notify the contractor or share customer details until an
authorised notification workflow exists.

**Also in this stage:** fix `app/bulk-quotes/page.tsx` to read the parameters,
or remove the dead link. Do not leave a button that silently loses its context.

**PII:** this is the first table holding customer phone numbers at scale. Public
endpoints must never return enquiry records. Decide who can read them and how
long they are kept before building.

---

## Stage 5 — Brochure, docs, handoff

Brochure is **optional and supplementary**: it never replaces structured data,
is never evidence of completed work, and is never the directory card image.
Reuse the existing authenticated upload route with its type and size validation.

**Material-quotation handoff:** preserve inclusion categories and material
specifications so staff can later raise a bulk material quotation from an
enquiry. Do not derive quantities from marketing text. If the existing quotation
domain cannot carry a professional-package reference, **document the integration
point rather than shipping a button that does nothing.**

---

## Claims policy

Show: *"Package information and advertised rates are supplied by the
professional. Buildanta does not guarantee final project pricing. Request a
detailed quotation after drawings and site conditions are reviewed."*

Never show "Buildanta Verified", "guaranteed rate", "guaranteed completion",
"best contractor", "verified experience" or "approved brands" — there is no data
or workflow behind any of them. Material brands are **preferred / proposed /
contractor-supplied specification**, never a Buildanta endorsement.

---

## SEO

Update contractor metadata when packages exist — no prices in titles. Use
professional-service schema semantics; do not mark indicative packages as
fixed-price purchasable products.

---

## Tests

**Service:** only contractors publish; draft/under-review/archived stay private;
published are returned in stable order; decimal precision holds; inverted
validity fails; an expired package is not public; an unpublished professional
exposes no packages.

**Public UI:** card shows a starting rate only with a published package;
non-contractors show none; profile hides drafts; comparison uses real inclusion
data; missing optional fields are omitted; no unsupported claims; Kanpur
formatting intact.

**Calculator:** area × rate correct; invalid areas refused; **client-supplied
totals ignored**; snapshot unchanged after the package price later changes.

**Enquiry:** valid succeeds; mismatched professional/package fails; unpublished
package fails; missing consent fails; illegal status transitions fail; PII never
returned by public endpoints.

**Admin:** authorised staff can create/update; unauthorised cannot; publication
validation works; reorder and duplicate work; archive removes from public view.

Run: unit and integration tests, `tsc --noEmit` in each workspace, lint, and
production builds for affected apps.

---

## Verification

Run the apps and inspect: directory, contractor category, profile with zero /
one / three packages, comparison, calculator, enquiry form, success and error
states, admin editor.

At 1440 / 1024 / 768 / 390 px check: no horizontal overflow, table readability,
mobile form usability, labelled controls, keyboard navigation, visible focus,
contrast, no console errors, no hydration errors.

---

## Scope boundaries

Kanpur only. Contractor packages only. Non-contractor profiles keep working.
Existing professional routes stay valid. No online construction payment, no
automatic contractor assignment, no ratings, no reviews, no multi-city logic,
no guaranteed pricing. Nothing hard-coded — no rates, names, phone numbers or
package content in production code.

## Acceptance criteria

Staff can create structured packages for Kanpur contractors; drafts never appear
publicly; profiles show published packages; customers can compare real
structured inclusions and calculate an indicative amount; the server computes
and snapshots the amount; customers can request a detailed quotation; staff can
track it; no package reads as a guaranteed quotation; the material-quotation
boundary is implemented or documented; tests, types and builds pass; desktop and
mobile verified.
