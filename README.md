# Buildanta

Buildanta is a construction-material sourcing platform for browsing verified products, checking availability, requesting project quotes, and managing inventory.

## Quick start

Requires Node.js 22.13 or newer.

```text
npm install
npm run dev
```

Open `http://localhost:3000`.

## Current implementation

- Responsive public storefront
- Product search and category filters
- Quote request and confirmation states
- Initial D1 schema for products, quotes, and inventory history
- R2 binding reserved for durable product images
- Deployment, security, testing, and data documentation

The next vertical slice connects quote submission to D1 and transactional email, followed by authenticated inventory management.

## Documentation

- `BUILD_FROM_SCRATCH.md`
- `ARCHITECTURE.md`
- `CONTRIBUTING.md`
- `docs/requirements.md`
- `docs/database.md`
- `docs/authentication.md`
- `docs/deployment.md`
- `docs/testing.md`
