# Phase 1 - Location-aware inventory foundation

Implemented on 2026-08-03 in the existing Buildanta storefront, Inventory Management application, Inventory API and Supabase PostgreSQL database.

## Connected architecture

```text
Inventory Operations UI
        -> protected Inventory API
        -> location inventory services
        -> Supabase PostgreSQL

Storefront PIN-code checker
        -> storefront safe proxy
        -> public availability API
        -> customer-safe status only
```

The Inventory API remains the business-control layer. The legacy storefront stock mutation route stays retired. The old protected `/stock/adjustments` API now delegates to the location-aware balance service so it cannot become a second stock source.

## Database migration

Migrations:

- `20260803190000_location_aware_inventory_foundation`
- `20260803201500_lock_private_tables_from_data_api`

Added:

- controlled units and conversions
- warehouses and warehouse locations
- service areas and PIN-code coverage
- fulfilment locations and delivery coverage
- location-specific inventory balances
- reservations and an auditable inventory ledger
- stock transfers and stock counts
- supplier products, dated prices and lead times
- dealers, dealer assortments and dealer service areas
- carriers and carrier service areas

The inventory migration is additive. It creates a `Kanpur legacy stock` warehouse and copies every existing variant's physical, reserved and low-stock values into a location balance. Existing product and variant records are not deleted or reset.

The security migration enables Row Level Security and revokes all table privileges from Supabase `anon` and `authenticated` browser roles across the application schema. Browser clients cannot query private inventory, supplier, user, quote or audit tables directly. The storefront uses the public Inventory API contract; trusted Prisma server connections retain access. This was verified with the configured publishable key, which receives PostgreSQL error `42501` for `InventoryBalance`.

## Enforced inventory rules

```text
available = max(0, physical - reserved - blocked - damaged - quarantine)
```

- All quantity buckets must be non-negative.
- Reserved, blocked, damaged and quarantine totals cannot exceed physical stock.
- Reservations require sufficient available stock.
- Transfer origin and destination must differ.
- Transfer dispatch and receipt are posted in serializable transactions.
- Approved counts correct physical stock once and create ledger history.
- Stock-changing transactions retry safe PostgreSQL serialization conflicts.
- Existing variant totals are maintained only as a compatibility summary derived from location balances.

## API contracts

Protected staff endpoints are under `/inventory-locations` and require a valid Supabase staff token. They cover controlled units and conversions, warehouses, bins, service areas, extra PIN codes, delivery coverage, balance adjustments, reservations, transfers, counts, supplier terms, dealers, carriers and partner-to-area assignments.

Public endpoint:

```text
GET /inventory-locations/public/availability?pincode=208001&productId=<optional>
```

It returns only:

- whether the PIN code is serviceable
- product ID
- safe availability status
- safe lead-time label

It never returns exact quantities, warehouse/bin names, supplier data, private prices, margins or audit records.

## Inventory workspace

The connected staff page is `/inventory-locations`; the former `/stock` page redirects to it. It provides responsive forms and states for:

- warehouse and service-area setup
- additional warehouse bins and PIN codes
- controlled units and conversion factors
- PIN-code fulfilment links
- physical, reserved, blocked, damaged, quarantine and in-transit balances
- reservations and releases
- draft, dispatch and receipt transfer states
- draft, submit and approval count states
- supplier product pricing and lead time
- dealer availability
- dealer and transport-partner service areas
- recent auditable ledger entries

## Storefront behavior

The storefront exposes a PIN-code checker on the categories page and product detail pages. The browser calls the storefront's `/api/serviceability` proxy, which validates input and forwards only to the public Inventory API endpoint.

Customer labels are deliberately non-sensitive: `Available in your area`, `Limited availability`, `Request availability`, `Available on enquiry` and `Not serviceable`.

## Demo data

The idempotent development seed creates clearly marked `DEMO` records, including:

- one warehouse and storage location
- Kanpur service area with PIN codes `208001`, `208002` and `208010`
- stocked, reserved, blocked, damaged and quarantine quantities
- one supplier price and lead-time record
- one dealer and reported product availability
- one carrier
- one draft transfer and one draft count

These records are demonstration data and must not be presented as verified commercial claims.

## Rollback

Application rollback: deploy the previous API, Inventory and storefront releases.

Database rollback is not required for an application rollback because the migration only adds tables/enums and preserves prior columns. Do not drop the Phase 1 tables after operational writes without first exporting the new records.
