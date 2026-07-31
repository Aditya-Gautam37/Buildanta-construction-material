# Buildanta

Buildanta is a public construction-material sourcing website for browsing products and requesting project quotes. Catalogue administration lives in the separate Buildanta Inventory application.

## Quick start

Requires Node.js 22.13 or newer.

```text
npm install
npm run dev
```

Open the URL printed by Vinext (normally `http://localhost:3000`).

## Current implementation

- Faithful responsive Buildanta homepage using the authorised reference assets
- Live stage, room, category, brand, product, variant, price and image data read from the inventory API
- Stage, room and category discovery with search, sorting and empty states
- Product detail pages and pre-filled bulk quote requests
- Durable D1 quote, supplier-submission and inventory-audit records
- Durable R2 product-image uploads
- A clear hand-off to the separate, authenticated inventory-management application
- Desktop/mobile navigation, validation, success and error states

## Storefront and inventory

- Storefront: this repository and its Sites deployment
- Inventory management: `inventory-platform/apps/inventory-management`
- Shared source of truth: `INVENTORY_API_URL`

The storefront fetches catalogue collections with `cache: "no-store"`. Product, brand, category, room, stage, variant, price and image changes made in the inventory dashboard therefore appear on subsequent storefront requests. If the inventory API is temporarily unavailable, the storefront renders its built-in fallback catalogue instead of failing.

## Documentation

- `BUILD_FROM_SCRATCH.md`
- `ARCHITECTURE.md`
- `CONTRIBUTING.md`
- `docs/requirements.md`
- `docs/database.md`
- `docs/authentication.md`
- `docs/deployment.md`
- `docs/testing.md`
