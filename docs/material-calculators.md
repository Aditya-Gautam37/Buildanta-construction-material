# Material calculators

Buildanta's calculator centre is a connected catalogue and quotation feature. It does not maintain a second product list or a separate enquiry table.

## Customer workflow

```text
Storefront /calculators
  -> validated server-side formula
  -> immutable estimate snapshot
  -> published product and active variant mappings
  -> PIN-code serviceability and customer-safe availability
  -> indicative public price snapshot
  -> existing multi-item quotation
  -> Inventory staff review, pricing and final approval
  -> customer account: Book complete BOQ
  -> Sales Order plus line-level stock reservations
  -> Inventory fulfilment and customer order tracking
```

The preliminary estimate is never booked directly. Staff first verifies products, quantities, stock, GST, freight, delivery conditions and quote validity in Inventory. When the approved final quotation is sent, the customer can open `/account` and select **Book complete BOQ**. The authenticated booking endpoint verifies that the quotation belongs to the customer's email, creates one Sales Order, copies every approved quotation line and reserves available stock at the selected fulfilment locations in a single transaction. Repeating the booking request returns the existing Sales Order instead of creating a duplicate.

The connected set contains Cement and Concrete, Bricks and AAC Blocks, Tiles and Flooring, Paint, and the Complete Construction Material Planner. Specialist calculations accept canonical metric measurements; the project planner accepts square feet and converts internally where required. Wastage is explicit and limited to 0-20 percent.

## Complete construction material planner

The route `/calculators/complete-construction-material` accepts:

- Project name, site location and delivery PIN code
- Plot area and built-up area per floor in square feet
- Floors, rooms, bathrooms and kitchens
- Residential or commercial project use and RCC-frame or load-bearing structural system
- Floor-to-floor height, tile-coverage percentage and optional ceiling painting
- Foundation only, foundation plus structural shell, or full-finish planning scope
- Economy, Standard or Premium Inventory mapping tier
- Managed wastage allowance

The foundation scope returns cement, sand, aggregate and an indicative TMT allowance. Structural scope adds masonry. Full-finish scope also adds a managed preliminary schedule for tiles, the painting system, electrical wire and conduit, plumbing pipe, sanitary fixture sets, doors and windows.

The published planner profile is version 3. It produces a stage-grouped preliminary BOQ with calculated and purchase quantities, mapped Inventory products, package sizes, rates, GST snapshots, stage subtotals and an indicative project total. Customers can print the BOQ, download it as CSV, or convert the same immutable estimate into the existing multi-item quotation workflow. Earlier versions remain retained for the auditability of estimates created before the formula corrections.

Calculator option behaviour is explicit:

- Economy, Standard and Premium select different Inventory variants and price snapshots.
- Foundation-only planning uses the building footprint plus a managed additional-floor load factor instead of multiplying foundation materials by every floor.
- Structural-shell and full-finish scopes use the same core structural quantities; full-finish adds finishing, electrical, plumbing, sanitaryware, doors and windows without silently increasing the structure.
- Red-clay brick walls use brick dimensions and cement-sand mortar. AAC walls use the AAC face module and thin-bed block adhesive.
- Floor and wall tile selections map to different products and coverage profiles.
- Paint quantities change with the ceiling and coat selections, while purchase quantities continue to round up to complete Inventory pack sizes.

Project-use and structural-system multipliers are managed configuration, not hidden storefront constants. The demonstration version currently distinguishes residential/commercial and RCC/load-bearing planning profiles. These multipliers, product mappings, coverage assumptions and rates require structural, architectural and commercial approval before production use.

This is a preliminary quantity and budget planning aid. TMT output is not a reinforcement design, and full-finish service allowances do not replace architectural, structural or MEP drawings. Inventory staff must approve the managed profile and replace or remap demonstration products before production.

## Architecture

- Formula implementations are registered in `inventory-platform/apps/nest-api/src/calculators/formula-registry.ts`.
- The storefront never executes business formulas and never reads calculator tables directly.
- Calculator definitions, immutable versions, mappings, estimates, items and audit events are stored in Supabase PostgreSQL through Prisma.
- The Nest API matches only published products and active variants.
- Exact stock, warehouse positions, supplier details, cost prices, margins, unpublished configuration and audit data are excluded from public responses.
- Calculator estimates link to the existing `Quotation` model atomically. Repeat estimate or quotation submissions are idempotent, while a deliberate recalculation creates a new auditable estimate.

## Inventory operation

Open `http://localhost:3002/calculators` with an authorized staff account.

- `ADMIN`: edit, map and publish versions; view estimates.
- `CATALOG_MANAGER`: edit drafts and mappings; view estimates.
- `DATA_ENTRY`: create and map drafts; cannot publish or view customer estimates.
- `SALES` and `SUPPORT`: view estimate-to-quotation traceability; cannot edit formulas.
- Other roles have no calculator operations navigation or API access.

Published versions are immutable. To change assumptions, create the next draft version, add product mappings, test the configuration, and have an administrator publish it. The previous published version is retired while existing estimates retain their original snapshots.

## Demonstration data

Run from `inventory-platform`:

```text
pnpm.cmd db:seed-calculators
```

The seed is idempotent and creates clearly labelled `Buildanta Calculator Demo` products, active variants, prices, pack sizes and Economy/Standard/Premium mappings. These records prove the end-to-end flow only. Their coverage values, mix assumptions and prices require commercial, architectural and technical approval before production.

## Database deployment

```text
pnpm.cmd db:generate
pnpm.cmd db:deploy
pnpm.cmd db:seed-calculators
```

Calculator tables have Row Level Security enabled and `anon`/`authenticated` table privileges revoked. Operational access goes through the Inventory API's authorization rules.

## Verification

```text
pnpm.cmd --filter nest-api test -- calculators --runInBand
pnpm.cmd --filter nest-api typecheck
pnpm.cmd --filter inventory-management typecheck
pnpm.cmd --filter @workspace/db typecheck
```

The public calculator write endpoints are rate-limited in the Nest API. Before production, also configure distributed edge/API-gateway protection, replace or remap demonstration products, approve every formula configuration and pack size, configure production PIN-code coverage, and complete the repository's launch, backup, monitoring and rollback checks.
