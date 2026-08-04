# Database and storage

Supabase PostgreSQL is the operational source of truth for the connected Inventory catalogue, variants, location-aware stock, quotations, fulfilment and material calculators. Prisma models and additive migrations live in `inventory-platform/packages/database/prisma/`.

Supabase Storage is the durable home for product and catalogue media managed by Inventory. Uploaded images must never be stored inside a temporary application deployment. The storefront retains an R2-backed route for supplier-submission image uploads and a hardcoded fallback catalogue for when the Inventory API is unreachable; neither is a second Inventory source of truth.

Calculator definitions, immutable formula versions, product mappings, estimate snapshots and quotation links are documented in `docs/material-calculators.md`. Calculator tables are accessed through the Inventory API, with RLS enabled and direct `anon`/`authenticated` table privileges revoked.

All migrations must be reviewed before deployment. Backups must run automatically, be retained outside the application deployment, and be restoration-tested on a schedule. Restoration testing is a release-readiness requirement, not an assumption.
