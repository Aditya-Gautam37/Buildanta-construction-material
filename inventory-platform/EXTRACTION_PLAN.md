# Inventory extraction plan

## Dependency map

- `apps/inventory-management`: Next.js 16 UI, Supabase SSR auth, local tRPC gateway.
- `apps/nest-api`: REST catalog API and authoritative write authorization.
- `packages/database`: Prisma schema, client, migrations, and safe development seed.
- `packages/ui`: original shared components and Tailwind styling.
- `packages/typescript-config` and `packages/eslint-config`: build-time configuration.

Runtime flow:

`Browser -> Next.js /api/trpc -> NestJS REST -> Prisma -> PostgreSQL`

Authentication flow:

`Supabase Auth -> secure session cookies -> Next.js route checks -> verified bearer token -> NestJS staff-role check`

Product and brand files are stored in Supabase Storage; only durable object URLs and
metadata are stored in PostgreSQL.

## Extraction decisions

- The existing storefront in the parent workspace is unrelated and remains unchanged.
- The inventory system lives in this self-contained sub-monorepo.
- Storefront/marketing apps, generated Prisma code, dependencies, caches, builds, and
  environment files were intentionally not copied.
- Next.js 16 `proxy.ts` is used instead of the deprecated `middleware.ts` convention.
- Public signup never grants staff privileges. Staff roles are assigned only through
  existing database roles or explicit server-side email allowlists.
