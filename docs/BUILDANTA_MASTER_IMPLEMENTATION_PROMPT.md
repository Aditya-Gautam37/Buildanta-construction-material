# Buildanta Connected Commerce and Inventory - Master Implementation Prompt

Copy this entire prompt into Codex while the workspace root is:

`C:\Users\adity\OneDrive\Desktop\buildanta pvt limited`

## Prompt

You are the lead full-stack engineer and product designer responsible for completing the existing Buildanta construction-material platform. Work inside the current repository. Do not create a replacement project, a second disconnected storefront, a second inventory application, or a new Supabase account.

Your objective is to evolve Buildanta into one connected, quotation-first commerce and fulfilment platform inspired by the useful operating principles of Tata Steel Aashiyana:

`location -> serviceable catalogue -> availability -> quotation -> accepted order -> reservation -> purchasing/fulfilment -> dispatch -> delivery -> return or closure`

Do not copy Tata Steel branding, text, proprietary assets, or unverified internal behaviour. Keep Buildanta's own design, data and quotation-first business model.

## 1. Existing project architecture that must be preserved

The repository already contains three connected applications:

1. Customer storefront at the repository root
   - Vinext/Next-compatible React application
   - Local URL: `http://localhost:3003`
   - Public catalogue, categories, stages, rooms, product details, customer authentication, professionals and quotation requests

2. Inventory Management
   - `inventory-platform/apps/inventory-management`
   - Next.js application
   - Local URL: `http://localhost:3002`
   - Protected staff authentication and catalogue, stock, requests, homepage and professional management

3. Inventory API
   - `inventory-platform/apps/nest-api`
   - NestJS application
   - Local URL: `http://localhost:5173`
   - Central business API for catalogue, variants, stock and enquiries

The shared operational data layer is:

- Supabase PostgreSQL through Prisma
- Supabase Authentication for staff
- Supabase Storage for durable product, brand and professional images

Preserve this target connection:

```text
Inventory Management --\
                       -> Inventory API -> Supabase PostgreSQL
Customer Storefront ---/                  Supabase Storage
```

The Inventory API must be the business-control layer. Do not implement the same pricing, stock, reservation, purchasing or order rules independently in multiple applications.

## 2. Current functionality that must not be broken

The project already supports:

- Products, brands, hierarchical categories, stages and rooms
- Product variants, SKUs, prices, GST, units, minimum order quantities and images
- Product draft, published, hidden and archived states
- Suppliers
- Variant-level physical and reserved stock
- Low-stock thresholds and stock audit transactions
- Storefront catalogue synchronization through the Inventory API
- Customer quotation requests
- Supplier product submissions
- Staff roles and authorization
- Homepage merchandising
- Professional directory management
- Customer authentication
- Responsive storefront catalogue, category, stage, room and product pages

Extend these capabilities. Do not rebuild them from scratch.

## 3. Known gaps and inconsistencies to fix first

Before building new screens, audit and correct these issues:

1. The storefront has a legacy `app/api/inventory` D1 stock override and legacy inventory UI. This creates a second stock source of truth. Retire or redirect this functionality so all operational stock changes go through the protected Inventory API and Supabase PostgreSQL.
2. The public product API currently exposes exact `stockQuantity`, `reservedQuantity` and supplier information. Create separate public and internal DTOs. Public responses must never expose purchase cost, exact warehouse stock, reserved stock, supplier contacts, margins, internal notes or audit actors.
3. The storefront can display exact variant stock. Replace this with customer-safe availability labels based on location and business rules.
4. The current quote request stores one free-text requirement and one quantity. Replace it with a proper multi-item quotation model while safely migrating existing requests.
5. Current stock is variant-level and has no warehouse or partner location.
6. Supplier, warehouse, dealer/fulfilment partner and carrier are different business roles and must not be represented as one entity.
7. Do not create UI pages for entities that do not yet have working database, API, authorization and tests.

## 4. Required implementation approach

Work in complete vertical slices. For every slice, implement:

`database migration -> Prisma models -> API DTO and validation -> service rules -> permissions -> Inventory UI -> storefront exposure where appropriate -> tests -> responsive/error-state verification`

Do not perform a visual-only redesign. Do not leave placeholder buttons, dead navigation, fake success messages or unconnected forms.

Before editing:

1. Read all repository instructions, including `inventory-platform/apps/inventory-management/AGENTS.md` and the relevant Next.js documentation inside `node_modules/next/dist/docs/`.
2. Read `docs/inventory-improvement-implementation-plan.md`.
3. Inspect the current Prisma schema, migrations, API modules, storefront catalogue adapter, authentication and Inventory navigation.
4. Inspect `git status` and preserve all unrelated user changes.
5. Write a concise implementation plan and keep it updated.

Do not reset or wipe the database. Use additive, reviewable migrations and backfill existing records safely. Never place a Supabase secret key, service-role key or database URL in browser code or a `NEXT_PUBLIC_*` variable.

## 5. Phase 0 - Architecture and public-data hardening

Implement this before new business modules:

- Remove the storefront's independent stock mutation path or make it a protected proxy to the Inventory API.
- Establish one shared source of truth for products, variants, stock and quotations.
- Create explicit public catalogue DTOs and protected internal DTOs.
- Public catalogue responses may include:
  - product name, slug, description and approved specifications
  - brand and published categories
  - approved images
  - active variants, size, grade and selling unit
  - public/indicative price or `Request latest price`
  - GST display rule
  - minimum order quantity
  - serviceability status
  - safe availability label
  - estimated lead-time label
  - public delivery and return policy summary
- Public responses must exclude:
  - cost price and landed cost
  - supplier contacts and private supplier pricing
  - exact warehouse, dealer, blocked or reserved quantities
  - internal margin and approval information
  - storage locations
  - staff and audit details
- Add contract tests proving that protected fields never appear in public API responses.
- Preserve the storefront fallback only for genuine API failure. Show a visible but calm `Live catalogue temporarily unavailable` state when fallback data is used.

## 6. Phase 1 - Location-aware inventory foundation

Add production-quality models, migrations, APIs and Inventory screens for:

- Warehouse
- WarehouseLocation or bin/yard location
- ServiceArea
- PincodeCoverage
- InventoryBalance
- InventoryReservation
- StockTransfer and StockTransferItem
- StockCount and StockCountItem
- blocked, damaged, quarantine and in-transit quantities
- controlled units and UnitConversion
- SupplierProduct
- SupplierPrice with valid-from and valid-until dates
- SupplierLeadTime
- Dealer or FulfilmentPartner
- DealerProduct or partner assortment
- DealerInventory or confirmed partner availability
- DealerServiceArea
- Carrier or TransportPartner

Each inventory balance must be unique for a variant and fulfilment location.

Use these invariants:

```text
available stock = max(0, physical - reserved - blocked - damaged)

available to promise = available stock
                     + confirmed incoming quantity that arrives before the required date
```

Never allow reserved stock to become negative or exceed valid available capacity. Use database transactions and safe concurrency controls for stock-changing operations.

Support fulfilment modes:

- STOCKED: owned and stored by Buildanta
- PARTNER_STOCK: availability confirmed by a dealer or supplier
- ON_REQUEST: price and availability require confirmation

Customer-safe labels must include:

- In stock
- Limited stock
- Available from partner
- Available in 3-5 days
- Request confirmation
- Not serviceable for this PIN code

## 7. Phase 2 - Quotation and sales-order workflow

Replace the single-line enquiry with a complete quotation workflow:

- Quotation
- QuotationItem
- QuotationRevision
- QuotationStatusHistory
- QuotationApproval
- quotation validity date
- freight, GST, discount and margin breakdown
- customer notes and internal notes stored separately
- supplier, warehouse or dealer allocation per item
- alternative product or brand suggestions
- reservation expiry

Required status workflow:

```text
DRAFT -> SUBMITTED -> REVIEWING -> QUOTED -> ACCEPTED or REJECTED -> EXPIRED or CLOSED
```

When an authorized user accepts a valid quotation:

1. Create a SalesOrder and SalesOrderItems atomically.
2. Create location-specific reservations atomically.
3. Record immutable status history and audit information.
4. Reject the operation cleanly if stock, serviceability, price validity or permissions fail.
5. Release reservations when an order is cancelled or expires.

Do not add online payment yet. Support payment terms and payment-status placeholders only after orders are reliable.

## 8. Phase 3 - Purchasing and fulfilment

Implement connected modules for:

- PurchaseRequisition
- SupplierRFQ and supplier responses
- supplier price comparison
- PurchaseOrder and PurchaseOrderItem
- approval status and approval history
- GoodsReceipt and GoodsReceiptItem
- quality check, shortage, excess, rejected and damaged quantities
- batch or lot tracking where appropriate
- supplier return
- PickingList
- DeliverySchedule
- Dispatch
- DispatchItem
- DeliveryChallan
- delivery status history
- proof of delivery
- cancellation
- ReturnRequest and ReturnItem
- inspection
- Replacement
- CreditNote

Business rules:

- Stock normally increases through an approved goods receipt, not an unrestricted manual edit.
- Goods receipt must update the correct location balance and stock ledger in one transaction.
- Dispatch must consume the correct reservation and location stock.
- Customer returns must enter quarantine until inspected.
- Every stock movement must reference a business document or an authorized manual correction.

## 9. Phase 4 - Inventory Management experience

Refactor Inventory Management into a clear operations workspace with responsive navigation:

- Overview
- Catalogue
  - Products
  - Categories
  - Brands
  - Stages
  - Rooms
- Inventory
  - Stock by location
  - Reservations
  - Transfers
  - Stock counts
  - Stock ledger
- Warehouses and service areas
- Suppliers
- Dealers and fulfilment partners
- Quotations
- Sales orders
- Purchasing
- Goods receipts
- Dispatch and delivery
- Returns and replacements
- Homepage content
- Professionals
- Reports
- Staff and permissions
- Settings

Every menu item must lead to a real working route. Hide unfinished modules rather than showing dead links.

Required dashboard information:

- stock by warehouse
- available-to-promise summary
- low-stock items
- pending and expiring reservations
- new quotations
- average quote response time
- quote conversion rate
- accepted quotes awaiting allocation
- open sales orders
- delayed dispatches
- pending purchase orders and goods receipts
- supplier price comparison
- supplier delivery performance
- stock ageing and inventory valuation
- gross-margin reporting restricted to authorized roles

Use clear loading, empty, error, success and permission-denied states. Tables must remain usable on phones through responsive cards or intentional horizontal scrolling with sticky identifiers.

## 10. Phase 5 - Connected customer storefront

Update the storefront only after the underlying API behaviour exists.

Implement:

- A PIN-code selector near the start of the shopping journey
- Persistence of the selected PIN code for the customer session/device
- Serviceability checks without requiring login
- Location-filtered product discovery
- Location-aware safe availability and delivery estimates
- Search and filters by category, brand, stage, room, price, availability and fulfilment mode
- A quotation basket that supports multiple products, variants, units and quantities
- A clear quotation summary before submission
- Customer account pages for quotations, accepted orders and delivery tracking
- Quote and order status timelines
- Cancellation/return entry points only when business rules allow them
- Helpful unsupported-PIN-code and unavailable-product alternatives
- Existing category, stage, room, professional and product-detail journeys must keep working

Do not display one universal exact stock quantity. Do not promise free delivery, guaranteed delivery, lowest price, GST inclusion or easy returns unless the managed business data proves the claim.

Use safe wording such as:

- Request latest price
- Delivery confirmed after PIN-code review
- GST and transportation confirmed in quotation
- Available for enquiry

## 11. Roles and authorization

Keep customer and staff access separate. Extend roles or granular permissions for:

- ADMIN
- DATA_ENTRY or CATALOG_MANAGER
- SALES
- WAREHOUSE_MANAGER
- PROCUREMENT
- FINANCE
- SUPPORT
- CUSTOMER

Enforce permissions on the server for every protected read and write. Hiding a button is not authorization.

Examples:

- Catalogue staff can edit products but cannot approve purchase orders.
- Sales staff can prepare quotations but cannot perform warehouse adjustments.
- Warehouse staff can receive, reserve, pick and dispatch stock but cannot view supplier bank information or profit margins.
- Finance can manage payment status and credit notes but cannot silently rewrite stock history.
- Only authorized users can override prices, release reservations or make manual corrections.

Every sensitive action must have actor, timestamp, reason, reference and before/after values where applicable.

## 12. Responsive, clickable and accessible UI requirements

Apply these requirements to the storefront and Inventory Management:

- Design mobile-first for 360px and larger screens.
- Verify tablet, laptop and wide desktop layouts.
- No accidental horizontal page overflow.
- All navigation, cards, tabs, buttons and list rows must be keyboard accessible.
- Every interactive control must have a visible focus state and accessible label.
- Touch targets must be at least 44px where practical.
- Modals must trap focus, close with Escape and restore focus.
- Forms must provide client and server validation with field-level messages.
- Submit buttons must show loading state and prevent duplicate submission.
- Destructive actions require confirmation and explain the impact.
- Empty states must provide a useful next action.
- API failures must never produce a blank screen or generic runtime overlay.
- All links and buttons must either work or be removed.
- Preserve Buildanta's navy, white and orange visual identity, but organize the operations UI more clearly.
- Use real, licensed construction-product photography or existing durable product images. Do not use copied Tata Steel assets. Store uploads in durable Supabase Storage.
- Prevent broken images with validated URLs and meaningful fallbacks.
- Preserve valid UTF-8. Do not introduce corrupted characters or mojibake. Prefer simple ASCII punctuation in source copy.

## 13. Demo data requirements

Create an idempotent development seed that enriches existing data without duplicating it.

Seed clearly labelled demonstration data for:

- 2 Buildanta warehouses or yards
- 1 fulfilment partner/dealer
- several demonstration Kanpur PIN-code coverage records
- existing published products distributed across locations
- stocked, partner-stock and on-request fulfilment modes
- physical, reserved, blocked and low-stock examples
- supplier prices and lead times
- at least one stock transfer
- multi-item quotations in several statuses
- one accepted quotation and sales order
- one purchase order and goods receipt
- one dispatch and delivery timeline
- one return/replacement example

Do not present demonstration prices, serviceability or stock as verified real-world claims. Mark seeded operational records as demo/test data and make the seed safe to rerun.

## 14. Tests and acceptance criteria

Add unit, service, contract and focused end-to-end tests for critical rules.

The implementation is not complete until these journeys pass:

1. Staff creates a product with variant, image, price, supplier, category, stage and room; publishes it; the storefront displays it on the next request.
2. Staff assigns a product to a serviceable location; a supported PIN code sees a safe availability label; an unsupported PIN code sees `Not serviceable` without private stock details.
3. Customer adds multiple products to a quotation basket and submits one quotation.
4. Sales staff prepares a revision with GST, freight, validity and item allocation.
5. Accepting the quotation creates one sales order and correct reservations atomically.
6. Cancelling an eligible order releases reservations and records history.
7. An approved goods receipt increases the correct warehouse balance exactly once.
8. Dispatch consumes the correct reservation and stock exactly once.
9. A return enters quarantine and does not become saleable until inspection.
10. Public APIs never expose private costs, exact balances, supplier contacts, margins or audit data.
11. Each staff role receives only authorized routes and actions.
12. Core flows work on 360px mobile and desktop without broken controls or overflow.
13. Loading, empty, invalid, unavailable, unauthorized and API-failure states are handled clearly.

Run and pass the relevant repository checks:

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

Also run focused API tests and catalogue verification after schema and seed changes.

## 15. Delivery and reporting rules

- Make small, reviewable commits by complete vertical feature.
- Keep migrations and seed changes in source control.
- Update architecture, database, authentication, deployment and testing documentation.
- Do not deploy destructive migrations without a verified backup and rollback plan.
- Do not report a feature as complete when only its UI exists.
- Do not claim success without running proportional tests.
- Report exactly what was completed, what was verified, any data migration performed and what remains for later phases.
- Keep payments, coupons, reviews, advanced calculators, project planning, expense tracking, split fulfilment and dealer self-service behind later milestones until inventory, orders, purchasing and delivery are reliable.

## 16. Final definition of done

Buildanta is ready for this milestone only when staff can manage customer-safe catalogue information once in Inventory Management and the approved data automatically appears in the storefront through the Inventory API, while private operational data remains protected.

The minimum complete business journey is:

```text
Staff manages product and location stock
-> customer enters PIN code
-> customer finds serviceable products
-> customer submits a multi-item quotation
-> sales prepares and sends a valid quotation
-> customer accepts it
-> system creates an order and reserves stock
-> staff purchases or fulfils material
-> dispatch and delivery are tracked
-> cancellation or return updates inventory correctly
-> every important action remains auditable
```

Start with Phase 0 and proceed in order. Do not skip database and API foundations to work on later visual features.
