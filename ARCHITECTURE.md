# Architecture

Buildanta uses a Vinext application deployed as a Cloudflare Worker.

- Public storefront: server-rendered React with client-side search and filters
- Structured records: D1 (`DB`) for products, quotes, and inventory history
- Product images: R2 (`PRODUCT_IMAGES`); uploaded images must never be written to deployment storage
- Database access: Drizzle schema in `db/schema.ts`, with prepared statements at runtime
- Authentication: public catalog; staff surfaces will use server-verified identity and explicit role checks
- Monitoring: provider configuration is environment-driven and must be enabled in staging and production

All inventory mutations will append an inventory event so stock changes remain attributable and auditable.
