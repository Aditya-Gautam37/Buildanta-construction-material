# Buildanta End-to-End Material Calculators - Execution Prompt

Copy this complete prompt into Codex while the workspace root is:

`C:\Users\adity\OneDrive\Desktop\buildanta pvt limited`

## Prompt

You are the lead full-stack engineer, product designer and test owner responsible for implementing Buildanta's construction-material calculators as complete, connected business features.

Read this entire prompt before making changes. Then execute it phase by phase. Do not stop after creating database models, API endpoints or UI-only calculator screens. Continue until the calculator results use live published Inventory products, can create a multi-item quotation, appear correctly in Inventory Management and pass proportional automated and responsive tests.

## 1. Objective

Build a responsive calculator centre that helps customers estimate construction-material quantities and indicative costs, select real Buildanta products and request one quotation containing all calculated items.

The complete journey must be:

```text
Customer opens Calculator Centre
-> selects a calculator
-> enters dimensions, project details and delivery PIN code
-> API validates inputs and runs a versioned formula
-> result returns material quantities, assumptions and wastage
-> API matches results to published products and active variants
-> location serviceability and safe availability are checked
-> customer selects brands or suggested alternatives
-> current public prices produce an indicative value or Request latest price
-> customer adds all selected materials to the existing quotation basket
-> customer reviews and submits one multi-item quotation
-> Inventory staff sees the calculator source, inputs, items and estimate snapshot
-> staff prepares a valid quotation using existing quotation operations
```

The calculator must not become a disconnected lead form or a second catalogue. Inventory Management and the Inventory API remain the source of truth.

## 2. Preserve the existing architecture

Do not create a replacement application, a second database or a separate Supabase project.

Use the existing applications:

1. Storefront at the repository root
   - Local URL: `http://localhost:3003`
   - Vinext/Next-compatible React application

2. Inventory Management
   - `inventory-platform/apps/inventory-management`
   - Local URL: `http://localhost:3002`

3. Inventory API
   - `inventory-platform/apps/nest-api`
   - Local URL: `http://localhost:5173`

4. Shared operational data
   - Prisma models in `inventory-platform/packages/database`
   - Supabase PostgreSQL
   - Supabase Authentication for staff access
   - Supabase Storage for durable images

Preserve this connection:

```text
Inventory Management --\
                       -> Inventory API -> Supabase PostgreSQL
Customer Storefront ---/                  Supabase Storage
```

All calculator execution, catalogue matching, location checks and estimate-to-quotation conversion must go through the Inventory API. Do not duplicate business formulas or pricing rules in the storefront and Inventory Management.

## 3. Mandatory preparation

Before editing:

1. Read `docs/BUILDANTA_MASTER_IMPLEMENTATION_PROMPT.md` and continue to respect its security, architecture and public-data rules.
2. Read `docs/inventory-improvement-implementation-plan.md`.
3. Read every applicable `AGENTS.md`, especially `inventory-platform/apps/inventory-management/AGENTS.md`.
4. Read the relevant Next.js documentation inside `node_modules/next/dist/docs/` before changing Inventory Management.
5. Inspect the Prisma schema, migrations, seed process, public catalogue DTOs, location/serviceability code, quotation basket, quotation API and staff authorization.
6. Inspect `git status` and preserve unrelated user changes.
7. Verify current Supabase guidance and changelog before changing Supabase integration, RLS or storage.
8. Write a short implementation plan and keep it updated.

Do not wipe or reset the database. Use additive migrations and safe backfills. Do not place database URLs, Supabase secret keys or service-role keys in browser code or `NEXT_PUBLIC_*` variables.

## 4. Required calculator catalogue

Implement these calculators in phases, starting with the first four as the minimum reliable release.

### Phase A - Minimum launch set

1. Cement and concrete
   - Inputs: component type, length, width, depth/thickness, quantity, concrete grade or approved mix configuration, unit system and wastage.
   - Outputs: concrete volume, cement bags, sand and aggregate quantities.

2. Bricks and AAC blocks
   - Inputs: wall length, height, thickness, openings, brick/block size, mortar option and wastage.
   - Outputs: net wall area/volume, brick or block count and approved mortar-material estimates where configuration exists.

3. Tiles and flooring
   - Inputs: floor/wall dimensions, openings where relevant, tile size, pattern and wastage.
   - Outputs: covered area, tile pieces, purchase boxes, adhesive and grout where configured.

4. Paint
   - Inputs: walls/ceilings, dimensions, doors/windows, surface condition, number of coats, product system and wastage.
   - Outputs: paintable area, primer, putty and paint litres rounded to purchasable pack sizes.

### Phase B - Connected expansion

5. Waterproofing
   - Terrace, bathroom, basement or exterior-wall system.
   - Output coating/membrane, primer, tape, sealant and accessories using managed coverage rules.

6. TMT/rebar budget estimator
   - Inputs may include built-up area, floors, construction component and an approved estimation profile.
   - Output indicative steel weight and matching TMT variants.
   - This is a budgeting aid, not structural design. Never claim that the result is a safe reinforcement design. Require structural-engineer confirmation.

7. Building material budget
   - Inputs: PIN code, built-up area, floors, rooms, construction stage and Economy/Standard/Premium quality tier.
   - Aggregate outputs from approved calculator profiles by category.
   - Show category and stage breakdowns rather than one unexplained total.

### Later calculators

Only after the required calculators work end to end, add roofing/shed, electrical, plumbing/sanitary and home-loan EMI calculators. EMI calculations must never be mixed with material quotation totals.

## 5. Calculation design rules

1. Calculate physical quantities first. Product matching and pricing happen afterward.
2. Keep formula implementations in a server-side, typed formula registry identified by safe `formulaKey` values.
3. Do not allow administrators to enter executable JavaScript, SQL or arbitrary formulas in Inventory Management.
4. Store only validated parameters as configuration: coverage, density, dry-volume factor, joint allowance, mix profile, package size, wastage limits and conversion factors.
5. Every published calculator configuration must be versioned and immutable. Editing a published version creates a new draft version.
6. Store calculation inputs, outputs, formula version and product/price snapshots so an old estimate does not change when catalogue prices or formulas change.
7. Support metric and common Indian construction units where appropriate, but convert to canonical units before calculation.
8. Use existing controlled units and conversions whenever possible.
9. Round physical results only at the correct stage. Round purchase quantities up to complete bags, boxes, buckets, coils, bars or other saleable packages.
10. Include an explicit wastage value in both inputs and results. Apply safe minimum and maximum validation rather than accepting arbitrary percentages.
11. Never silently invent missing coverage, package or conversion data. Return `Configuration required` and identify what Inventory staff must complete.
12. Treat TMT and structural calculations as indicative estimates requiring professional approval.

Representative non-structural rules include:

```text
net area = gross area - openings
required material = net area * coats / managed coverage
quantity with wastage = required material * (1 + wastage percentage)
purchase packs = ceiling(quantity with wastage / package size)
```

Concrete, mortar and rebar rules must use reviewed, named configuration profiles. Do not hardcode a generic construction ratio as universally correct.

## 6. Database and audit model

Design the exact Prisma implementation to fit the existing schema, but support these concepts:

### CalculatorDefinition

- id, name, slug and calculator type
- description and customer instructions
- active/published status
- image/icon reference
- sort order
- public disclaimer
- created/updated audit fields

### CalculatorVersion

- definition relation
- version number
- registered formula key
- validated configuration JSON
- draft/published/retired status
- effective date and published timestamp
- author/publisher audit fields
- immutable after publication

### CalculatorProductMapping

- calculator version and output key such as `cement`, `sand`, `tiles` or `primer`
- category, product and optional variant relations
- quality tier: Economy, Standard or Premium where relevant
- preferred and alternative priority
- expected output unit and conversion factor
- active status

### MaterialEstimate

- public reference
- calculator version
- authenticated customer or anonymous session reference where permitted
- delivery PIN code
- canonical validated inputs JSON
- calculation results and assumptions JSON
- indicative subtotal, GST, delivery and value range where available
- price-valid-until or estimate-expiry timestamp
- status
- quotation relation when converted
- timestamps

### MaterialEstimateItem

- output key and description
- raw calculated quantity
- wastage quantity
- purchase quantity and unit
- matched product and variant, if selected
- safe availability snapshot
- public unit-price and tax snapshot
- line-value snapshot
- mapping/configuration snapshot needed for audit

### Audit requirements

Track calculator configuration creation, publication, retirement and mapping changes with actor, timestamp and before/after values. Reuse the project's established audit patterns where possible.

Use decimal database types for quantities and money. Do not use floating-point numbers for persisted prices or totals. Add appropriate unique constraints and indexes for slugs, versions, status, estimate references and quotation relations.

## 7. Supabase and data security

1. Keep calculator administration, unpublished configurations and estimate internals behind the Inventory API.
2. Use Supabase publishable credentials only where browser access is genuinely required. Never expose secret or service-role credentials.
3. If calculator tables are in an exposed schema, enable RLS and add narrowly scoped policies. Prefer keeping operational access behind the API instead of granting broad Data API access.
4. `authenticated` alone is not authorization. Check staff permissions and record ownership as appropriate.
5. Never base authorization on user-editable metadata.
6. Public calculator DTOs must not expose:
   - cost price, margins or supplier price
   - exact warehouse, blocked or reserved stock
   - supplier contacts
   - internal mapping notes
   - unpublished formulas/configuration
   - staff identities or audit history
7. Rate-limit anonymous calculations and estimate creation. Validate request size and reject abusive input ranges.
8. Sanitize customer text and do not execute content stored in configuration JSON.

## 8. Inventory API

Implement typed DTOs, Zod/class validation consistent with the existing API, service rules, authorization and tests.

Required public capabilities:

```text
GET  /public/calculators
GET  /public/calculators/:slug
POST /public/calculators/:slug/calculate
GET  /public/material-estimates/:reference
POST /public/material-estimates/:reference/selection
POST /public/material-estimates/:reference/add-to-quotation
```

Adapt names to existing routing conventions where necessary. Do not expose direct database-shaped payloads.

Required protected capabilities:

```text
calculator definition CRUD
draft version creation and validation
product-mapping CRUD
preview using a draft version
publish/retire/rollback-to-new-version operations
estimate search and detail
calculator usage and quote-conversion summaries
```

The calculation response must include:

- normalized inputs and units
- formula/configuration version
- result lines and assumptions
- wastage details
- matched published product and active variant options
- package rounding
- PIN-code serviceability
- customer-safe availability and lead-time labels
- indicative price or `Request latest price`
- GST and delivery information only when supported by managed data
- warnings and missing-configuration messages
- estimate reference and expiry

Use the existing public catalogue DTOs, location-aware availability service and quotation service. Never query a second stock source.

## 9. Product matching and pricing

1. Mappings must point to existing published products and active variants.
2. Allow Inventory staff to configure preferred products and ordered alternatives for every output key and quality tier.
3. Filter customer options by selected PIN code and active service areas.
4. Show customer-safe labels only: In stock, Limited stock, Available from partner, Available in 3-5 days, Request confirmation or Not serviceable for this PIN code.
5. If a required item has no serviceable product, retain the calculated material line and show `Product selection requires staff confirmation`.
6. Use the current public selling price when allowed. If price is unavailable or volatile, use `Request latest price` rather than zero.
7. Show material subtotal, GST and delivery separately. Do not claim that delivery or GST is included without managed data proving it.
8. Preserve the estimate's price snapshot and expiry. A new calculation may use new prices; an existing estimate remains auditable.

## 10. Inventory Management experience

Add a real `Calculators` operations section to Inventory Management with permission-aware navigation.

Required screens:

1. Calculator overview
   - published/draft status
   - calculation count
   - quote conversion count/rate
   - configuration warnings

2. Calculator editor
   - customer copy, image/icon and disclaimer
   - formula profile selection from the safe registry
   - validated parameters and allowed wastage
   - preview inputs and results

3. Product mapping
   - output keys
   - categories, products and variants
   - Economy/Standard/Premium tiers
   - preferred/alternative priority
   - unit and package conversion validation

4. Version and publication history
   - draft comparison
   - publish confirmation
   - immutable version history
   - create-new-version rollback workflow

5. Estimate and quotation traceability
   - search by reference, calculator, PIN code, date and conversion status
   - open the connected quotation
   - display the exact input/result/product snapshot used

Permissions:

- ADMIN: full management and publication
- CATALOG_MANAGER: edit drafts and product mappings
- SALES: view estimates and connected quotations, without formula publication
- DATA_ENTRY: only the explicitly granted draft-edit actions
- CUSTOMER: no Inventory Management access

Enforce every permission on the server. Hiding buttons is not sufficient.

## 11. Storefront experience

Add a polished `/calculators` hub and individual routes such as `/calculators/tiles`.

The hub must include:

- clear calculator cards with relevant construction imagery or existing durable assets
- grouping by Structure, Finishing and Project Planning
- a short explanation of what each calculator estimates
- `Start calculation` actions
- truthful professional-confirmation messaging

Each calculator should be a mobile-first wizard:

```text
1. Project and PIN code
2. Measurements and options
3. Assumptions and wastage
4. Material results
5. Product and brand selection
6. Quotation review
```

Required result-page behaviour:

- show formulas in understandable language without exposing internal code
- show the customer's entered measurements
- show raw requirement and rounded purchase quantity separately
- explain wastage
- allow preferred product/variant selection
- show safe availability and lead time
- show alternatives for unavailable items
- provide `Add all to quotation` and per-item controls
- preserve the result when navigating to product detail and back
- provide Print/Save as PDF only after the HTML result is correct; do not make PDF generation a launch blocker

Use the existing header, footer, design tokens, PIN-code state and quotation basket. Do not introduce a visually disconnected mini-site.

## 12. Quotation integration

Do not create a new quote table or a calculator-only enquiry workflow.

When a customer chooses `Add all to quotation`:

1. Convert selected estimate items to the existing quotation-basket item shape.
2. Preserve estimate reference, calculator/version, selected variant, quantity, unit, assumptions and price snapshot.
3. Merge only genuinely identical product variants and units. Keep distinct items separate when assumptions differ.
4. Allow customer quantity adjustment, but warn when it is below the calculated or minimum-order quantity.
5. Submit one multi-item quotation through the existing quotation API.
6. Link the resulting quotation to the material estimate atomically or idempotently.
7. Prevent duplicate quotations on double submission.
8. Show the estimate source and calculation snapshot in Inventory's quotation detail.
9. Allow Sales staff to revise price, freight, GST, fulfilment allocation and lead time without rewriting the original estimate.

The estimate is advisory evidence; the staff quotation is the commercial offer.

## 13. Customer-facing wording

Use wording such as:

- Estimated material requirement
- Indicative material value
- Wastage included: X%
- Request latest price
- Delivery confirmed after PIN-code review
- GST and transportation confirmed in quotation
- Final quantities should be reviewed by your contractor or engineer

Do not claim:

- exact final project cost
- guaranteed structural safety
- guaranteed delivery
- universal stock availability
- lowest price
- free delivery
- GST included

unless current managed business data proves the statement.

Display a visible disclaimer on results:

`This estimate is for preliminary planning. Actual quantities and costs can vary with design, site conditions, workmanship, product coverage and market prices. Confirm final quantities with a qualified contractor, architect or engineer.`

Add stronger structural-engineer wording to TMT/rebar results.

## 14. Responsive, accessible and error-state requirements

- Mobile-first from 360px upward.
- No page-level horizontal overflow.
- Wizard progress remains understandable on mobile.
- Inputs include units, examples and field-level errors.
- Provide keyboard access, visible focus and at least 44px practical touch targets.
- Prevent duplicate submissions and show loading progress.
- Preserve user inputs after recoverable API errors.
- Handle invalid measurements, extreme values, unsupported units, missing configuration, unsupported PIN codes, unpublished products, expired estimates and unavailable APIs explicitly.
- Never show a blank screen, runtime overlay, `[object Object]` or generic `Internal error` to customers.
- Provide loading skeletons and useful empty states.
- Avoid broken images and corrupted UTF-8 characters.

## 15. Demo data

Create an idempotent development seed that adds clearly labelled demo calculator configuration without duplicating existing records.

Seed:

- published definitions and versions for the four launch calculators
- safe example coverage/mix profiles
- product mappings to appropriate existing demo categories/products/variants
- Economy/Standard/Premium mappings where the catalogue supports them
- a mixture of priced, request-price and unavailable examples
- several saved estimate snapshots
- one estimate converted to a multi-item quotation

Do not invent claims that seeded prices, coverage or structural rules are verified commercial or engineering data. Mark them as demonstration configuration requiring business/technical approval before production.

## 16. Tests

Implement and run:

### Formula unit tests

- known input/output fixtures for every formula version
- metric/unit conversions
- openings and negative-area protection
- wastage boundaries
- package rounding
- decimal precision
- missing profile/configuration failures
- very small and maximum allowed inputs

### API and security tests

- public list returns published calculators only
- draft configurations cannot be executed publicly
- no private product, supplier, exact stock, cost or audit fields leak
- invalid and abusive inputs are rejected
- unsupported PIN codes produce safe results
- staff role permissions are enforced
- published versions are immutable

### Integration tests

- calculation -> estimate snapshot -> product matching
- live public price and Request latest price behaviour
- estimate -> quotation basket -> submitted multi-item quotation
- duplicate submission remains idempotent
- Inventory quotation shows calculator provenance
- changing a product price affects a new estimate but not an old snapshot
- retiring a calculator prevents new public runs without corrupting old estimates

### Responsive end-to-end tests

- Calculator hub and all launch calculators at 360px and desktop width
- keyboard-only completion of a calculator
- recoverable API error retains user data
- unsupported PIN-code journey
- add-all-to-quotation and submission journey
- staff editing, previewing and publishing a new version

Run the relevant repository commands:

```text
Storefront:
npm.cmd run lint
npm.cmd run build
npm.cmd test

Inventory platform:
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd test
pnpm.cmd build
```

Also run targeted API/formula tests after every vertical slice. Report any pre-existing failure separately and do not conceal it.

## 17. Implementation phases

### Phase 0 - Audit and design

- Confirm existing quotation, catalogue, serviceability, unit-conversion and authorization contracts.
- Produce the exact schema/API plan.
- Identify reusable UI components and current tests.
- Do not redesign unrelated pages.

### Phase 1 - Calculator foundation

- Add schema and additive migration.
- Add typed formula registry, versioning, estimate snapshots and unit tests.
- Implement public and protected API contracts with security tests.

### Phase 2 - Inventory Management

- Add calculator navigation and working management screens.
- Add safe configuration, mappings, preview, version publishing and audit history.
- Add idempotent demo seed.

### Phase 3 - Storefront launch calculators

- Build responsive hub and the Cement/Concrete, Bricks/AAC, Tiles and Paint calculators.
- Connect live product mappings, PIN-code serviceability, availability and public pricing.
- Verify error and empty states.

### Phase 4 - Quotation integration

- Connect estimates to the existing multi-item basket and quotation submission.
- Add Inventory estimate provenance and traceability.
- Pass the complete customer-to-staff acceptance journey.

### Phase 5 - Expansion

- Add Waterproofing and TMT/Rebar budgeting.
- Add Building Material Budget only after component calculators and live mappings are stable.
- Do not add later calculators at the expense of correctness.

## 18. Definition of done

The calculator milestone is complete only when all of the following are true:

1. Authorized staff can configure product mappings and create/publish a new immutable calculator version in Inventory Management.
2. A customer can run every launch calculator on mobile and desktop with validated inputs.
3. Results contain explainable quantities, wastage, package rounding and professional disclaimers.
4. Results use real published Buildanta products, active variants and the selected PIN-code context.
5. Customer-safe availability is shown without exposing private stock or supplier data.
6. Priced products show an auditable indicative snapshot; volatile/unpriced products show Request latest price.
7. The customer can add all chosen results to the existing quotation basket and submit one multi-item quotation.
8. Inventory staff can open that quotation and see the calculator reference and original estimate snapshot.
9. Double submissions do not create duplicate estimates or quotations.
10. Old estimates remain unchanged after formula, mapping or catalogue-price updates.
11. Public API contract tests prove that private operational data is not exposed.
12. Formula, API, integration, role and responsive tests pass.
13. Documentation for architecture, database, calculator configuration, testing and production approval is updated.

Do not report completion when only UI screens exist. For each phase, report the database, API, Inventory, storefront and tests completed; identify anything still blocked; and continue to the next safe phase until the end-to-end launch set is working.
