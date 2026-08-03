# Phase 0 - Public Catalogue Security and Source of Truth

## Status

Implemented as the architecture-hardening foundation for the connected Buildanta platform.

## Source of truth

Operational catalogue and stock data follows this path:

```text
Inventory Management
        |
        v
Inventory API
        |
        v
Supabase PostgreSQL

Customer Storefront
        |
        v
Public Inventory API contract
```

The storefront no longer owns a separate stock-adjustment database. Its legacy stock mutation endpoint returns HTTP 410 and directs all operational changes to the protected Inventory workspace.

## Public catalogue contract

The unauthenticated product and variant endpoints expose only customer-safe fields:

- Published products and active variants
- Product and variant identifiers
- Names, descriptions, approved specifications and taxonomy
- Brand name
- Approved images
- SKU, unit and public price
- Minimum order quantity
- GST and public delivery information
- Customer-safe availability status

Public availability values are:

- `IN_STOCK`
- `LOW_STOCK`
- `OUT_OF_STOCK`
- `ENQUIRY`

The API calculates these values internally from physical, reserved and threshold data. It does not send those quantities to the browser.

## Protected internal contract

Authenticated Inventory endpoints retain the operational fields staff need, including:

- Exact physical and reserved quantities
- Low-stock thresholds
- Supplier relationships
- Draft, hidden and archived records
- Internal product details and costs

Protected routes include:

- `GET /products/inventory/all`
- `GET /products/inventory/:id`
- `GET /product-variants/inventory/all`
- `GET /product-variants/inventory/:id`

These routes require the Inventory API JWT guard.

## Storefront behaviour

- The storefront consumes only public availability statuses.
- Product pages never display exact stock or a private supplier relationship.
- Product and variant images remain sourced from durable Inventory-managed storage.
- If the Inventory API is unavailable, the storefront shows a limited fallback catalogue with a visible status notice.
- Fallback pricing and availability are explicitly subject to confirmation.

## Verification

Automated tests cover:

- Availability calculations
- Public product field filtering
- Public variant field filtering
- Continued availability of exact data through protected service methods
- Retirement of the legacy storefront D1 stock mutation path
- Presence of the storefront fallback notice and public status adapter
