# Architecture

Buildanta uses a Vinext application deployed as a Cloudflare Worker.

- Public storefront: server-rendered React routes with client-side search, filters and sorting
- Structured records: D1 (`DB`) for products, quotes, supplier submissions, inventory overrides and audit history
- Product images: R2 (`PRODUCT_IMAGES`); uploaded images must never be written to deployment storage
- Database access: Drizzle schema in `db/schema.ts`, with prepared statements at runtime
- Authentication: public catalogue; inventory routes use dispatch-owned sign-in and server-verified identity
- Monitoring: provider configuration is environment-driven and must be enabled in staging and production

Every inventory mutation is written to an audit table with the authenticated actor. Supplier image bytes are stored in R2 while searchable submission metadata remains in D1.
