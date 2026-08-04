# Buildanta Inventory Platform

This is a standalone extraction of Buildanta's inventory-management system. It
preserves the original Next.js dashboard, shared UI components, Supabase
authentication, tRPC gateway, NestJS API, Prisma data model, and PostgreSQL
catalog workflows without depending on the source monorepo.

## Architecture

```text
Browser
  -> Next.js 16 inventory app (http://localhost:3002)
  -> same-origin tRPC gateway (/api/trpc)
  -> NestJS API (http://localhost:5173)
  -> Prisma
  -> PostgreSQL
```

Supabase provides email/password authentication and durable image storage.
PostgreSQL stores users, roles, catalog data, relationships, and storage URLs.
Protected API mutations verify the Supabase access token and then require an
`ADMIN` or `DATA_ENTRY` database role.

## Project structure

```text
apps/
  inventory-management/  Next.js UI, auth, tRPC gateway, upload route
  nest-api/               REST API, validation, authorization, health endpoint
packages/
  database/               Prisma schema, migrations, client, safe seed
  ui/                     Original shared UI and Tailwind styles
  eslint-config/
  typescript-config/
```

See `EXTRACTION_PLAN.md` for the dependency map and extraction decisions.

## Prerequisites

- Node.js 20 or newer
- pnpm 9.0.6 (`corepack enable` is recommended)
- PostgreSQL 15 or newer, or Docker Desktop
- A Supabase project with email/password authentication enabled
- Public `ProductImages` and `BrandLogos` Storage buckets

## Environment setup

Copy `.env.example` to `.env` at this project root for shared tasks. For Next.js
development, place the same values in
`apps/inventory-management/.env.local`. Never commit either file.

Browser-safe values are limited to:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ASSET_HOSTS`

`DATABASE_URL`, allowlists, and `SUPABASE_SERVICE_ROLE_KEY` are server-only.
The service-role key is optional; when omitted, the upload route uses the signed-in
user token and therefore requires appropriate Supabase Storage RLS policies.

Public signups are created as `CUSTOMER`. Add comma-separated staff emails to
`ADMIN_EMAIL_ALLOWLIST` or `DATA_ENTRY_EMAIL_ALLOWLIST` before their first login.
Existing database roles are never overwritten during login synchronization.

To operate against the deployed Buildanta catalog rather than the local Nest API,
set `NEXT_PUBLIC_API_URL` to the deployed API origin. Authentication must use the
same Supabase project that issued the API's accepted access tokens. Existing logo
and product-photo hosts can be added to `NEXT_PUBLIC_ASSET_HOSTS`.

## PostgreSQL

For local Docker PostgreSQL:

```bash
docker compose up -d postgres
```

The compose service binds to local port `5433` to avoid conflicting with a
machine-wide PostgreSQL installation on the conventional port.

For an existing PostgreSQL service, replace the three database URLs in `.env`.
`DIRECT_URL` is used by Prisma for migration operations. Create a separate shadow
database when using `prisma migrate dev`.

## Install and initialize

```bash
pnpm install
pnpm db:generate
pnpm db:deploy
pnpm db:seed
```

`db:deploy` applies the checked-in migration to a clean or existing compatible
database. The development seed adds only fictitious catalog data and never
creates an authentication account or password.

## Run locally

Start both applications from the project root:

```bash
pnpm dev
```

Or start them separately:

```bash
pnpm dev:api
pnpm dev:web
```

- Inventory UI: http://localhost:3002
- Nest API: http://localhost:5173
- Health check: http://localhost:5173/health

### Core catalogue workflow

- `/dashboard` manages product structure, variants, suppliers and images.
- `/catalog-control` manages draft, published, hidden and archived states plus commercial product fields.
- `/stock` records physical stock changes, quotation reservations and an immutable staff audit trail.
- Public API catalogue routes return only published products and active variants.
- Existing variants remain `stockTracked: false` until the first real stock adjustment; the storefront therefore says “Available for enquiry” instead of claiming stock that has not been verified.

The implemented business flow is:

```text
Create product -> add variant and supplier -> publish -> customer discovers product
-> customer requests quote -> staff reserves or releases stock -> audit history records the change
```

## Supabase setup

1. Enable email/password authentication.
2. Add `http://localhost:3002/**` to the permitted redirect URLs.
3. Create `ProductPhotos` and `BrandLogos` Storage buckets.
4. Either set the optional service-role key only in the server environment, or
   add Storage RLS policies allowing authenticated staff uploads.
5. Keep the anon key in both public and server variables; it is intentionally
   public. Never expose the service-role key.

## Quality commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For production, run `pnpm db:deploy` before starting the release. Deploy the
Next.js and NestJS applications as persistent Node services, point both at the
same PostgreSQL and Supabase projects, restrict `CORS_ORIGINS`, use managed
database backups, and retain the previous release for rollback.

## Known external requirements

- Live authentication and catalog reads have been verified against the deployed
  Buildanta services.
- Local role synchronization and Prisma operations require a reachable PostgreSQL
  database.
- New uploads require Storage RLS policies for authenticated staff or a
  server-only service-role key from the same Supabase project.
- Product images are attached to product variants, matching the source workflow;
  standalone product-level ordering is not exposed by the current source UI.
