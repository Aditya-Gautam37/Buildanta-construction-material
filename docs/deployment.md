# Deployment

Use separate staging and production environments. Configure transactional email, logs, error and performance monitoring, uptime checks, analytics, D1 backups, and alert delivery before launch.

Product images belong in R2 object storage and must not be written into a temporary deployment.

Keep the previous production version available. A rollback includes application version selection, database compatibility verification, health checks, and a recorded decision owner.

## Release checks

1. Run `npm run lint` and `npm test`.
2. Verify `/`, `/by-stage`, `/by-room`, `/categories`, `/bulk-quotes`, `/list-product`, `/login`, and `/inventory`.
3. Submit a quote and confirm its D1 record.
4. Upload a product image and confirm both the R2 object and D1 metadata.
5. Sign in, change one inventory value, and confirm its audit record.
6. Check desktop and mobile layouts, alerts, logs and integration health.
