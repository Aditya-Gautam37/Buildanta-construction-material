# Deployment

Use separate staging and production environments. Configure transactional email, logs, error and performance monitoring, uptime checks, analytics, D1 backups, and alert delivery before launch.

Product images belong in R2 object storage and must not be written into a temporary deployment.

Keep the previous production version available. A rollback includes application version selection, database compatibility verification, health checks, and a recorded decision owner.
