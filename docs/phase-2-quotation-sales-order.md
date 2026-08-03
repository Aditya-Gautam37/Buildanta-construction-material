# Phase 2 - Quotation and sales-order workflow

Implemented on 2026-08-03 in the existing Buildanta storefront, Inventory Management application, Inventory API and Supabase PostgreSQL database.

## Complete vertical workflow

```text
Customer builds a multi-item enquiry basket
        -> public Inventory API validates published products and variants
        -> canonical quotation and compatibility request are created atomically
        -> sales staff reviews every line
        -> a priced, location-allocated revision is prepared
        -> finance/admin approves or rejects the revision
        -> sales sends the approved, time-limited quotation
        -> authorized staff records customer acceptance
        -> sales order, order lines and stock reservations are created atomically
        -> cancellation releases every active reservation atomically
```

The Inventory API remains the only business-control layer. Neither the storefront nor Inventory Management writes quotation, order or stock tables directly.

## Database migration

Migration: `20260803213000_quotation_sales_order_workflow`

Added:

- canonical multi-item quotations and requested lines
- immutable numbered quotation revisions and priced lines
- quotation status history
- revision approvals
- sales orders and sales-order lines
- a one-to-one link from each order line to its stock reservation
- payment-terms and payment-status placeholders, without online payment processing
- explicit staff roles for sales, finance, warehouse, procurement, catalogue and support work

Existing `QuoteRequest` records are preserved and backfilled into canonical quotations. The compatibility model remains available while current storefront and legacy operational screens migrate. The migration contains no destructive table or data operations.

## Status and permission controls

Quotation statuses:

```text
DRAFT -> SUBMITTED -> REVIEWING -> QUOTED -> ACCEPTED
                                  |          -> REJECTED
                                  |          -> EXPIRED
                                  `----------> CLOSED
```

- Admin and Sales can review, prepare, send and record acceptance.
- Admin and Finance can approve or reject a revision.
- Admin, Sales and Support can cancel an order and release reservations.
- Only Admin and Finance can receive margin values in the overview response.
- Sales users cannot submit an internal margin value.
- Customer notes and internal notes are stored separately.

## Server-enforced commercial rules

- A revision must price every requested item exactly once.
- Products and variants must still be active and published.
- The delivery PIN code and selected fulfilment location must be serviceable.
- Supplier and dealer allocations must match the selected variant.
- A dealer allocation must match the selected dealer fulfilment location.
- A line cannot use both supplier and dealer allocation.
- Prices, discounts, GST, freight and grand total are calculated server-side.
- A quotation cannot be sent without a current approved, unexpired revision.
- Acceptance rejects expired, unapproved, unserviceable, fractional-stock or insufficient-stock lines.
- Acceptance uses a serializable transaction to create the order, reserve all lines, write inventory ledger history and update quotation/request states together.
- Cancellation uses a transaction to release all active reservations, update balances, write ledger history and close the order and quotation together.

## Storefront

The `/bulk-quotes` page is now a responsive multi-item material basket backed by the live public catalogue. Customers can:

- add and remove product lines
- select an exact active variant
- provide quantities and units
- enter delivery and project information
- review a complete summary before submission
- submit once with duplicate-submit protection

The existing `/api/quotes` storefront proxy remains the public boundary and sends the canonical request to the Inventory API.

## Inventory workspace

The connected `/quotations` workspace provides:

- filters and status summaries
- request and customer detail
- review and rejection actions
- line-by-line variant and fulfilment allocation
- supplier or dealer allocation
- GST, discount, freight, validity and lead-time controls
- separate customer and internal notes
- approval decisions
- quotation send and acceptance actions
- sales-order and reservation visibility
- order cancellation and reservation release
- immutable status and actor history

The header now links staff to `/quotations`. The older `/requests` page remains available for supplier submissions and compatibility during later cleanup.

## Security

Row Level Security is enabled on all eight Phase 2 tables, and direct table privileges are revoked from Supabase `anon` and `authenticated` roles. Trusted server-side Prisma connections retain access. Public users can only submit through the validated Inventory API contract.

## Demo data and verification

The idempotent development seed creates clearly labelled records for:

- a submitted two-line quotation
- a reviewing quotation with pending approval
- an approved and quoted quotation
- an accepted quotation with a confirmed sales order
- two linked active reservations and matching inventory-ledger entries

Rerunning the seed preserves reservation quantities and never duplicates the order, reservations or ledger movements.

Run:

```text
pnpm db:verify-phase2
```

The verifier checks canonical backfill coverage, multi-line preservation, accepted-order linkage, reservation totals, non-negative stock, RLS on every Phase 2 table and the absence of direct browser-role grants.

Quality gate completed:

- all 9 database migrations applied
- inventory workspace typecheck, lint, 37 tests and production builds passed
- storefront lint, contract tests and production build passed
- database Phase 2 invariant and security verification passed

## Deliberate boundary

Phase 2 records customer acceptance through authorized staff. Customer self-service acceptance, authentication and account history are part of the later customer-account phase. Online payment is not implemented; only non-financial terms/status placeholders exist.

## Rollback

Deploy the previous API, Inventory and storefront releases for an application rollback. The Phase 2 migration is additive, so old application releases can ignore the new tables. Do not drop the quotation, order or reservation structures after operational use without exporting and reconciling commercial and stock history.
