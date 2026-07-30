# Database and storage

D1 stores products, quote requests, and append-only inventory events. R2 stores product-image bytes; `products.image_key` stores the durable object key.

Migrations live in `drizzle/` and must be reviewed before deployment. Backups must run automatically, be retained outside the application deployment, and be restoration-tested on a schedule. Restoration testing is a release-readiness requirement, not an assumption.
