# Buildanta — Complete Project Context

## 1. Project summary

Buildanta is an early-stage construction-material catalog and marketplace platform. It is designed to help customers discover materials for building or finishing a home and to help administrators maintain the product catalog.

The platform organizes products in several useful ways:

- By product category, such as tiles, paint, electrical, plumbing, and sanitary ware
- By construction stage, such as foundation, structure, and finishing
- By room, such as kitchen, bathroom, bedroom, living room, and balcony
- By brand

The repository contains a public storefront, an inventory/catalog dashboard, a backend API, a shared database package, and a shared UI component library.

> Current status: this is a functional prototype and catalog-management system, not yet a complete production e-commerce or warehouse-inventory platform.

---

## 2. Product vision

The intended end-to-end business flow is:

1. An administrator signs into the inventory dashboard.
2. The administrator creates brands, categories, rooms, construction stages, suppliers, products, and product variants.
3. The information is stored in PostgreSQL.
4. The public Buildanta store retrieves the catalog through the backend.
5. Customers browse products by category, stage, room, or brand.
6. Customers can explore bulk-quote and product-listing interfaces.

A future complete version would also include carts, checkout, orders, payments, delivery, quote processing, and real stock tracking.

---

## 3. Repository location

The actual monorepo is inside the nested directory:

```text
C:\Users\adity\Downloads\buildanta-monorepo-master\buildanta-monorepo-master
```

Run all project commands from this directory.

---

## 4. Technology stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui-style shared components
- Lucide React icons
- Next Themes

### API and validation

- NestJS 11
- tRPC 11
- Zod 3

### Database

- PostgreSQL
- Prisma 7
- Prisma PostgreSQL adapter

### Authentication

- Supabase Authentication
- `@supabase/supabase-js`
- `@supabase/ssr`

### Monorepo tooling

- pnpm workspaces
- Turborepo
- Shared ESLint configuration
- Shared TypeScript configuration
- Prettier

---

## 5. High-level architecture

```text
                         ┌──────────────────────────┐
                         │       Customer           │
                         └────────────┬─────────────┘
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │ Storefront: store-web    │
                         │ Next.js, port 3001       │
                         └────────────┬─────────────┘
                                      │ Local tRPC gateway
                                      ▼
┌───────────────────┐     ┌──────────────────────────┐
│ Inventory admin   │────▶│ Inventory Management     │
└───────────────────┘     │ Next.js, port 3002       │
                          └───────────┬──────────────┘
                                      │
                         ┌────────────┴─────────────┐
                         │                          │
                         ▼                          ▼
                ┌─────────────────┐       ┌─────────────────┐
                │ Supabase Auth   │       │ Local tRPC      │
                └─────────────────┘       └────────┬────────┘
                                                   │ REST
                                                   ▼
                                      ┌──────────────────────────┐
                                      │ NestJS API, port 5173    │
                                      └────────────┬─────────────┘
                                                   │
                                                   ▼
                                      ┌──────────────────────────┐
                                      │ Shared Prisma package    │
                                      └────────────┬─────────────┘
                                                   │
                                                   ▼
                                      ┌──────────────────────────┐
                                      │ PostgreSQL database      │
                                      └──────────────────────────┘
```

---

## 6. Monorepo structure

```text
buildanta-monorepo-master/
├── apps/
│   ├── web/                    Unfinished marketing/landing application
│   ├── store-web/              Main customer-facing Buildanta storefront
│   ├── inventory-management/   Authenticated catalog administration app
│   └── nest-api/               Central REST backend
│
├── packages/
│   ├── database/               Prisma schema and shared database client
│   ├── ui/                     Shared UI component library
│   ├── eslint-config/          Shared ESLint rules
│   └── typescript-config/      Shared TypeScript configurations
│
├── package.json                Root commands and package metadata
├── pnpm-workspace.yaml         Workspace definitions
├── pnpm-lock.yaml              Locked dependency versions
├── turbo.json                  Turborepo task definitions
└── PROJECT_CONTEXT.md          This document
```

---

## 7. Applications

### 7.1 `apps/web`

This is a separate, unfinished marketing application. It runs on port `3000`.

```text
http://localhost:3000
```

Its current page contains placeholder sections such as:

- Hero Section
- By stage
- By category
- Why us

This is why starting `pnpm --filter web dev` displays a basic page. It is not the polished Buildanta storefront.

Important files:

```text
apps/web/app/page.tsx
apps/web/app/layout.tsx
apps/web/components/Navbar.tsx
apps/web/components/Hero-section.tsx
apps/web/components/Footer.tsx
```

### 7.2 `apps/store-web`

This is the main customer-facing Buildanta storefront. It runs on port `3001`.

```text
http://localhost:3001
```

It contains the polished interface with:

- Buildanta navigation and logo
- Search field
- Login and sign-up actions
- Hero image and headline
- Browse by stage
- Browse by room
- Product categories
- Trusted brands
- Professional services
- Why Buildanta section
- Footer

Important routes:

| URL | Purpose |
|---|---|
| `/` | Store homepage |
| `/categories` | Category listing |
| `/categories/[slug]` | Products for a particular category |
| `/by-stage` | Browse using construction stages |
| `/by-room` | Browse using rooms |
| `/bulk-quotes` | Bulk quote interface |
| `/list-product` | Product-listing interface |
| `/more` | Additional content |
| `/api/trpc/[trpc]` | Internal Next.js tRPC endpoint |

Important components:

```text
src/components/Navbar.tsx
src/components/Hero-Section.tsx
src/components/TrustedBrandsSection.tsx
src/components/CategoriesSection.tsx
src/components/ByStageSection.tsx
src/components/ByRoomSection.tsx
src/components/ProfessionalsSection.tsx
src/components/WhyUsSection.tsx
src/components/ProductCard.tsx
src/components/CategoryProductsClient.tsx
src/components/Footer.tsx
```

Static images are stored under:

```text
apps/store-web/public/
```

This directory contains:

- Homepage and room images
- Product fallback images
- Brand logos
- Other public assets

The storefront currently uses both real API data and static/dummy data. Dummy data made it possible to design the interface before the backend was complete.

### 7.3 `apps/inventory-management`

This is the authenticated administration dashboard. It runs on port `3002`.

```text
http://localhost:3002
```

Opening `/` redirects to `/dashboard`.

The dashboard manages:

- Products
- Product variants
- Brands
- Categories
- Rooms
- Construction stages
- Suppliers
- User profile synchronization

Important routes:

| URL | Purpose |
|---|---|
| `/dashboard` | Main inventory/catalog dashboard |
| `/login` | Administrator login |
| `/signup` | Account creation |
| `/fast` | Alternative authentication page |
| `/profile/complete` | Required profile completion |
| `/api/trpc/[trpc]` | Internal tRPC endpoint |

The dashboard is divided into reusable tabs:

```text
app/components/inventory-dashboard/tabs/
├── products-tab.tsx
├── categories-tab.tsx
├── brands-tab.tsx
├── stages-tab.tsx
├── rooms-tab.tsx
└── suppliers-tab.tsx
```

The main dashboard page performs these actions:

1. Creates a server-side Supabase client.
2. Checks the current authenticated user.
3. Redirects unauthenticated users to `/login`.
4. Checks the corresponding local database profile.
5. Redirects incomplete profiles to `/profile/complete`.
6. Loads products and taxonomy data through the local tRPC router.
7. Passes the results to the dashboard interface.

### 7.4 `apps/nest-api`

This is the central REST backend. It runs on port `5173` by default.

```text
http://localhost:5173
```

The backend is divided into NestJS feature modules:

```text
src/
├── auth/
├── brands/
├── categories/
├── database/
├── products/
├── product-variants/
├── rooms/
├── stages/
└── suppliers/
```

Most entity modules contain:

```text
entity.controller.ts   HTTP routes
entity.service.ts      Business and database logic
entity.module.ts       NestJS module registration
dto/                   Create and update request types
```

Typical REST endpoints are:

```text
GET    /products
GET    /products/:id
POST   /products
PUT    /products/:id
DELETE /products/:id
```

Similar endpoints exist for:

- Brands
- Categories
- Rooms
- Stages
- Suppliers
- Product variants

Read endpoints are generally public. Create, update, and delete operations generally require a valid Supabase access token.

---

## 8. Shared packages

### 8.1 `packages/database`

This package contains:

- The Prisma schema
- The generated Prisma client
- PostgreSQL adapter setup
- Shared database exports
- Database generation and migration commands

Important files:

```text
packages/database/prisma/schema.prisma
packages/database/prisma.config.ts
packages/database/src/client.ts
packages/database/src/index.ts
packages/database/src/seed.ts
```

Both NestJS and server-side Next.js code can import:

```ts
import { prisma } from "@workspace/db";
```

### 8.2 `packages/ui`

This is the shared component library used by the frontend applications.

It includes reusable:

- Buttons
- Cards
- Inputs
- Labels
- Dialogs
- Dropdown menus
- Tables
- Tabs
- Charts
- Drawers
- Navigation components
- Forms
- Toast notifications
- Calendars and date pickers

Applications import components through workspace exports:

```tsx
import { Button } from "@workspace/ui/components/button";
```

### 8.3 `packages/eslint-config`

This provides shared linting rules so applications follow consistent code-quality conventions.

### 8.4 `packages/typescript-config`

This provides shared compiler settings for:

- General TypeScript
- Next.js applications
- React libraries

---

## 9. Frontend design approach

The polished storefront follows a typical marketplace landing-page journey:

```text
Navigation
   ↓
Hero and primary value proposition
   ↓
Trusted brands
   ↓
Product categories
   ↓
Browse by construction stage
   ↓
Browse by room
   ↓
Professional/customer support content
   ↓
Reasons to trust Buildanta
   ↓
Footer
```

### Component-first development

Each visual section was built as a separate React component. The homepage combines these components instead of placing the entire design in one file.

Benefits:

- Sections are easier to understand.
- Changes remain localized.
- Components can be reused.
- Multiple developers can work on different sections.

### Tailwind CSS

Most visual styling is defined using Tailwind utility classes inside JSX.

Example:

```tsx
<button className="rounded-lg bg-orange-500 px-6 py-3 text-white">
  Browse by Room
</button>
```

This controls layout, spacing, color, typography, responsive behavior, and interaction states without requiring a separate CSS class for every element.

### Responsive behavior

Tailwind breakpoints allow layouts to adapt for mobile, tablet, and desktop.

Example:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
```

This creates one column on small screens, two on medium screens, and four on large screens.

---

## 10. Data flow

### Public storefront reads

```text
Next.js storefront page
    → local tRPC procedure
    → HTTP GET request
    → NestJS controller
    → NestJS service
    → Prisma
    → PostgreSQL
```

The result travels back through the same layers and is transformed into a UI-friendly product.

The storefront's tRPC router can load:

- Products
- Brands
- Categories
- Rooms
- Stages

### Inventory writes

Example: creating a product.

```text
Administrator submits form
    → browser obtains Supabase access token
    → inventory tRPC mutation
    → POST /products with Bearer token
    → NestJS JWT guard validates token
    → product service validates input and related IDs
    → Prisma transaction creates records
    → response returns to dashboard
```

### Why tRPC and REST are both present

NestJS is the central REST API. The local Next.js tRPC routers act as typed adapters between the React applications and NestJS.

This provides:

- Typed frontend procedures
- Zod runtime validation
- A reusable central REST API
- A place to transform backend records into frontend-friendly structures

The trade-off is that some schemas and transformations are repeated across Prisma, NestJS DTOs, Zod schemas, and tRPC procedures.

---

## 11. Authentication flow

Supabase handles identity and sessions.

```text
User enters email and password
    → Supabase verifies credentials
    → Supabase creates a session
    → session cookie is stored
    → local Buildanta user profile is synchronized
    → dashboard access is allowed
```

The Next.js middleware protects routes such as:

- `/dashboard`
- `/checkout`
- `/profile`

If a user is not signed in, they are redirected to `/login`.

If first name or last name is missing, they are redirected to `/profile/complete`.

For protected NestJS requests:

1. The frontend sends the Supabase access token in the `Authorization` header.
2. The NestJS JWT guard verifies it using Supabase.
3. The request continues if the token is valid.

Supabase proves the user's identity. The local `User` model is intended to store application roles and permissions.

---

## 12. Database model

The Prisma schema is located at:

```text
packages/database/prisma/schema.prisma
```

### 12.1 User

Represents the Buildanta profile corresponding to a Supabase Auth user.

Fields include:

- Supabase UUID
- Email
- First name
- Last name
- Role
- Custom JSON permissions

Roles:

- `ADMIN`
- `CUSTOMER`
- `DATA_ENTRY`
- `CUSTOM`

### 12.2 Brand

Represents a manufacturer or product brand.

Fields include:

- Name
- Unique slug
- Logo URL
- Description
- Website

A brand can contain many products.

### 12.3 Category

Represents product classification. Categories support parent-child relationships.

Example:

```text
Electrical
├── Wires
├── Switches
└── Distribution boards
```

A product can belong to multiple categories.

### 12.4 Stage

Represents a stage of construction and supports a hierarchy.

Example:

```text
Construction
├── Foundation
├── Structural work
└── Finishing
```

A product can be associated with multiple stages.

### 12.5 Room

Represents where a product is used and supports a hierarchy.

Example:

```text
Home
├── Bathroom
├── Kitchen
├── Bedroom
└── Balcony
```

A product can be associated with multiple rooms.

### 12.6 Product

A product contains:

- Name
- Description
- Key specifications
- Brand
- Selling price
- Optional cost price
- Optional dummy/MSRP price
- Categories
- Stages
- Rooms
- Images
- Reviews
- Variants

### 12.7 ProductVariant

A variant represents a particular purchasable version of a product.

Example:

```text
Product: Floor tile
Variant A: 600 × 600 mm, white
Variant B: 800 × 800 mm, grey
```

It contains:

- Unique SKU
- Optional variant price
- Flexible JSON attributes
- Supplier
- Variant images

### 12.8 Supplier

A supplier contains:

- Name
- Contact information
- Email
- Address
- Supplied product variants

### 12.9 ProductImage

Every image belongs to a product. It may optionally belong to a particular product variant.

### 12.10 Review

A review connects a user and product and contains:

- Rating
- Comment
- Date

---

## 13. Product creation rules

The NestJS product service currently enforces these rules:

- A product must have at least one category.
- A product must have at least one construction stage.
- A product must have at least one room.
- The selected brand must exist.
- Every selected category, stage, and room ID must exist.
- A default variant requires a supplier and SKU.
- The selected supplier must exist.
- Product and default-variant creation occur inside a transaction.

Using a transaction means related writes either all succeed or all fail, helping prevent partially created products.

---

## 14. Local development setup

### Requirements

- Node.js 20 or newer
- pnpm 9.0.6
- PostgreSQL or a Supabase PostgreSQL database
- A Supabase project with email/password authentication

The currently installed versions are suitable:

```text
Node.js: v24.18.0
pnpm:    9.0.6
```

### Install dependencies

From the monorepo root:

```bat
pnpm install
```

### Required environment variables

The project expects approximately:

```dotenv
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
NEXT_PUBLIC_API_URL="http://localhost:5173"
PORT="5173"
```

Do not commit real passwords or private credentials.

### Generate Prisma client

```bat
pnpm --filter @workspace/db db:generate
```

### Create/apply a development migration

```bat
pnpm --filter @workspace/db db:migrate
```

### Start individual applications

Placeholder marketing application:

```bat
pnpm --filter web dev
```

Main storefront:

```bat
pnpm --filter store-web dev
```

Inventory dashboard:

```bat
pnpm --filter inventory-management dev
```

NestJS backend:

```bat
pnpm --filter nest-api dev
```

### Start all applications

```bat
pnpm dev
```

### Local addresses

| Service | Address |
|---|---|
| Placeholder marketing app | `http://localhost:3000` |
| Main Buildanta storefront | `http://localhost:3001` |
| Inventory dashboard | `http://localhost:3002` |
| NestJS API | `http://localhost:5173` |

### Stop a development server

Press:

```text
Ctrl+C
```

If Windows asks `Terminate batch job (Y/N)?`, enter `Y` and press Enter.

---

## 15. Root commands

The root `package.json` defines:

```bat
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm typecheck
```

Turborepo runs the corresponding command across relevant workspaces.

The configured task dependencies ensure database-client generation runs before tasks that require it.

---

## 16. Likely development sequence

The code suggests that the project was developed approximately in this order:

1. Create the pnpm/Turborepo monorepo.
2. Add a shared shadcn-style component package.
3. Create a basic placeholder marketing application.
4. Design the polished customer storefront.
5. Use local images and dummy product data to build the interface quickly.
6. Design the PostgreSQL catalog model with Prisma.
7. Create NestJS CRUD APIs.
8. Add typed tRPC adapters to the Next.js applications.
9. Build the inventory dashboard.
10. Add Supabase authentication and profile synchronization.
11. Connect protected dashboard writes to the NestJS API.

This is primarily a frontend-first prototype that later gained a structured backend and administrative workflow.

---

## 17. What is complete or substantially implemented

- Polished Buildanta storefront design
- Responsive homepage sections
- Category, stage, and room browsing pages
- Shared UI component package
- PostgreSQL/Prisma catalog model
- NestJS modules for core catalog entities
- CRUD services for major entities
- Inventory dashboard tabs and dialogs
- Supabase login, signup, session, and profile flow
- Bearer-token protection for many write endpoints
- Product-to-brand/category/stage/room relationships
- Suppliers and product variants
- Monorepo development and build orchestration

---

## 18. What is incomplete

### Commerce features

- Shopping cart
- Checkout
- Customer orders
- Payment processing
- Delivery and shipment tracking
- Saved addresses
- Returns and refunds
- Quote-request persistence and workflow

### Real inventory features

Despite the name "inventory management," the current system mainly manages a catalog. It does not yet model:

- Stock quantity
- Warehouses
- Stock locations
- Stock movements
- Purchase orders
- Goods received
- Reserved stock
- Reorder levels
- Inventory valuation
- Supplier purchase history

### Product experience

- Complete product-detail UI
- Fully implemented search
- Consistent real product images
- Removal of all dummy data
- Pagination
- Advanced filtering and sorting
- Product availability

### Administration and security

- Complete role-based authorization
- Permission enforcement for `ADMIN`, `DATA_ENTRY`, and custom roles
- Audit logs
- Account-management screens
- Rate limiting
- Complete production security configuration

### Engineering and operations

- Proper project-specific README
- `.env.example`
- Complete database migration history
- Production deployment configuration
- Comprehensive unit and end-to-end tests
- Monitoring and logging
- Continuous integration
- Backup and recovery documentation

---

## 19. Known technical concerns

1. The root README still describes the original template rather than Buildanta.
2. The repository does not provide a proper `.env.example`.
3. The seed script is outdated: it attempts to write a password field that is not present in the current `User` model.
4. The old seed script contains hard-coded credentials and should be replaced.
5. The Prisma migration directory does not contain a useful migration history.
6. Authentication-token validation exists, but application role enforcement is incomplete.
7. The storefront still mixes API data with dummy/static data.
8. Product list responses do not consistently include product images, causing fallback images to be used.
9. Applications use slightly different Next.js and React patch versions.
10. The NestJS bootstrap does not visibly configure CORS and other production hardening.
11. Many tests appear to be generated starter tests rather than real business tests.
12. Some logic is duplicated across Prisma models, NestJS DTOs, Zod schemas, tRPC routes, and UI transformations.

---

## 20. Recommended next steps

### Phase 1 — Make local development reliable

1. Add `.env.example`.
2. Configure Supabase and PostgreSQL.
3. Correct the Prisma seed script.
4. Create an initial migration.
5. Document exact startup steps.
6. Verify all four applications.

### Phase 2 — Complete catalog functionality

1. Make storefront pages entirely database-driven.
2. Include product images and prices in all required API responses.
3. Build product-detail pages.
4. Add search, filtering, sorting, and pagination.
5. Add file upload using Supabase Storage.

### Phase 3 — Secure administration

1. Enforce database roles in NestJS guards.
2. Separate administrator and data-entry permissions.
3. Validate every request DTO.
4. Add audit logging.
5. Add rate limiting and secure CORS configuration.

### Phase 4 — Add inventory

1. Add warehouses and locations.
2. Add stock levels per variant and warehouse.
3. Add stock movements.
4. Add supplier purchase orders.
5. Add receiving and adjustment workflows.
6. Add low-stock warnings and reorder levels.

### Phase 5 — Add commerce

1. Add customer profiles and addresses.
2. Add cart and checkout.
3. Add orders and order items.
4. Integrate payments.
5. Add fulfillment, shipping, cancellation, and returns.
6. Implement bulk-quote records and internal processing.

### Phase 6 — Production readiness

1. Add automated tests.
2. Add CI/CD.
3. Add structured logging and monitoring.
4. Define backup and recovery procedures.
5. Deploy the storefront, dashboard, API, and database securely.

---

## 21. Short explanation for a new developer

Buildanta consists of three relevant user interfaces and one backend:

- `web` is an unfinished placeholder at port `3000`.
- `store-web` is the real customer storefront at port `3001`.
- `inventory-management` is the authenticated catalog dashboard at port `3002`.
- `nest-api` is the REST backend at port `5173`.

The frontend applications use React and Next.js. Shared visual components come from `packages/ui`. The Next.js applications use local tRPC endpoints as typed gateways to the NestJS REST API. NestJS implements business logic and uses the shared Prisma package to read and write PostgreSQL. Supabase handles administrator identity and sessions.

The system currently handles a construction-product catalog well enough for a prototype, but it does not yet provide complete e-commerce or real stock-management functionality.

---

## 22. Rebuilding Buildanta from scratch

This section is the recommended blueprint for creating a new, maintainable Buildanta system. Do not blindly copy the existing repository. Preserve its useful product ideas and visual direction, but correct its architectural, security, database, and workflow problems.

### 22.1 Define the first release before coding

Buildanta can grow into a large system, so divide it into releases.

#### Release 1: catalog MVP

Build only:

- Public storefront
- Categories, brands, rooms, and construction stages
- Product and product-variant pages
- Search and filters
- Admin login
- Admin CRUD for catalog records
- Product-image upload
- Supplier records

Do not initially build:

- Payments
- Delivery integrations
- Multiple warehouses
- Complex permissions
- Returns
- Marketplace seller onboarding

#### Release 2: quote and order system

Add:

- Customer accounts
- Addresses
- Cart
- Quote requests
- Order creation
- Order status management
- Email notifications

#### Release 3: inventory and purchasing

Add:

- Warehouses
- Stock levels
- Stock movements
- Purchase orders
- Goods receipts
- Stock reservations
- Low-stock warnings

#### Release 4: payments and fulfillment

Add:

- Payment provider
- Shipping and delivery
- Refunds
- Returns
- Invoices
- Operational reports

This release-based approach avoids trying to solve every business problem simultaneously.

---

## 23. Recommended architectural changes

### 23.1 Remove the duplicate public application

The existing repository has both `apps/web` and `apps/store-web`.

Recommended change:

- Delete the placeholder `web` application in the new project.
- Rename `store-web` to `storefront`.
- Keep one clear public application.

Target:

```text
apps/
├── storefront/
├── admin/
└── api/
```

### 23.2 Do not duplicate API contracts unnecessarily

The current system uses:

```text
Next.js → tRPC → REST → NestJS → Prisma
```

That creates several representations of the same input:

- React form type
- Zod schema
- tRPC input
- REST body
- NestJS DTO
- Prisma input

For a clean rebuild, choose one of these approaches.

#### Recommended approach: NestJS REST with generated client

```text
Next.js → generated REST client → NestJS → Prisma → PostgreSQL
```

Use:

- NestJS controllers and services
- DTO validation with `class-validator`
- OpenAPI/Swagger
- An OpenAPI-generated TypeScript client for the storefront and admin app

Benefits:

- One central API contract
- Mobile applications can reuse the API
- Swagger documents every endpoint
- Less duplicated validation and transformation
- Easier debugging

#### Valid alternative: end-to-end tRPC

Use tRPC directly as the main backend if:

- Buildanta will only have TypeScript clients
- You do not require a separate NestJS service
- You want the simplest full-stack TypeScript setup

Do not maintain both a complete tRPC business layer and a complete NestJS REST layer without a clear reason.

### 23.3 Use one version of shared frameworks

All applications should use the same versions of:

- Next.js
- React
- TypeScript
- Zod
- ESLint

Use pnpm workspace catalogs or root overrides to keep versions aligned.

### 23.4 Keep Prisma generated code out of source control

Generate Prisma clients during:

- Local installation
- CI builds
- Production builds

Do not commit a large generated Prisma client directory unless the deployment environment specifically requires it.

### 23.5 Separate identity from authorization

Supabase Auth answers:

```text
Who is this user?
```

Buildanta authorization answers:

```text
What is this user allowed to do?
```

Every protected backend operation must perform both checks.

Recommended initial roles:

- `ADMIN`
- `CATALOG_MANAGER`
- `INVENTORY_MANAGER`
- `ORDER_MANAGER`
- `CUSTOMER`

Do not automatically make every newly registered user an administrator.

### 23.6 Do not allow public administrator signup

Recommended flow:

1. Customers may sign up publicly.
2. Administrators are invited by an existing administrator.
3. The backend assigns staff roles.
4. The browser can never choose its own privileged role.

### 23.7 Use a single source of truth for profile completion

The current code checks both Supabase metadata and the PostgreSQL `User` record.

Recommended change:

- Treat PostgreSQL as the source of truth for Buildanta profile data.
- Use Supabase only for authentication identity and essential token claims.
- Synchronize a user record through a secure backend endpoint or auth webhook.

### 23.8 Store money safely

Continue using database decimal types. Never use JavaScript floating-point numbers as the authoritative value for money.

Recommended fields:

```text
amount       Decimal
currency     String, default "INR"
taxIncluded  Boolean
```

At the API boundary, serialize money as strings or integer minor units such as paise.

### 23.9 Use explicit product publication states

Add:

```text
DRAFT
ACTIVE
ARCHIVED
```

Only `ACTIVE` products should appear publicly.

This is safer than making a partially created product immediately visible.

### 23.10 Use object storage for images

Use Supabase Storage, S3, or an equivalent object store.

Store only metadata in PostgreSQL:

- Storage path
- Public or signed URL information
- Alt text
- Sort order
- Width and height
- MIME type

Validate file size and type on the server.

---

## 24. Recommended new repository structure

```text
buildanta/
├── apps/
│   ├── storefront/              Public Next.js application
│   ├── admin/                   Staff-only Next.js application
│   └── api/                     NestJS REST API
│
├── packages/
│   ├── database/                Prisma schema and database client
│   ├── api-client/              Generated TypeScript API client
│   ├── ui/                      Shared UI components and tokens
│   ├── validation/              Truly shared domain validation only
│   ├── eslint-config/
│   └── typescript-config/
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   ├── local-development.md
│   └── deployment.md
│
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

Do not create a shared package merely because two files look similar. A package should have a clear, stable responsibility.

---

## 25. Recommended database design

### 25.1 Catalog entities

Keep:

- User
- Brand
- Category
- Stage
- Room
- Product
- ProductVariant
- ProductImage
- Supplier
- Review

Improve them with:

- Publication status
- Soft-deletion/archive timestamps
- SEO slug
- Image sort order
- Currency
- Audit fields
- Database constraints

### 25.2 Recommended product structure

```text
Product
├── General marketing information
├── Brand
├── Categories
├── Rooms
├── Construction stages
├── Product images
└── Variants
    ├── SKU
    ├── Attributes
    ├── Selling price
    ├── Cost price
    ├── Tax class
    ├── Supplier relationships
    └── Stock records
```

Prefer storing price on the purchasable `ProductVariant`. A product-level price may be a cached `startingAtPrice`, but the variant should be the sellable unit.

### 25.3 Slugs

Add a unique slug to public entities:

- Product
- Brand
- Category
- Room
- Stage

Never use display names as durable URL identifiers.

Example:

```text
/products/asian-paints-tractor-emulsion
```

### 25.4 Product attributes

Flexible JSON attributes are useful during an MVP, but uncontrolled JSON becomes hard to filter.

Recommended eventual model:

```text
AttributeDefinition
├── name
├── code
├── type
└── allowed values

VariantAttributeValue
├── variant
├── attribute definition
└── value
```

This supports reliable filters such as:

- Tile size
- Paint finish
- Pipe diameter
- Cement grade
- Wire length

Use JSON initially only if speed matters more than advanced filtering.

### 25.5 Inventory entities

When real inventory is introduced, add:

```text
Warehouse
StockLevel
StockMovement
StockReservation
PurchaseOrder
PurchaseOrderItem
GoodsReceipt
GoodsReceiptItem
```

Never update stock by directly editing a quantity without recording why it changed.

Use an immutable movement ledger:

```text
RECEIPT      +100
SALE          -5
RETURN        +1
ADJUSTMENT    -2
TRANSFER_OUT -20
TRANSFER_IN  +20
```

Current stock is calculated or maintained from these movements.

### 25.6 Order entities

For commerce, add:

```text
Customer
Address
Cart
CartItem
Order
OrderItem
Payment
Shipment
QuoteRequest
QuoteRequestItem
```

Order items must snapshot:

- Product name
- Variant name
- SKU
- Unit price
- Tax
- Quantity

Do not rely on the live product price after an order is created.

### 25.7 Auditability

Add:

```text
createdAt
createdBy
updatedAt
updatedBy
archivedAt
```

For critical operations, add an `AuditLog` containing:

- Actor
- Action
- Entity type
- Entity ID
- Before value
- After value
- Timestamp
- Request/IP metadata where appropriate

---

## 26. Build-from-scratch implementation plan

Follow these phases in order. Each phase has an exit gate. Do not proceed merely because the UI looks finished.

### Phase 0 — Learn the minimum foundations

Before writing Buildanta, be comfortable with:

- HTML semantics
- CSS layout, Flexbox, and Grid
- JavaScript fundamentals
- TypeScript objects, unions, generics, and async functions
- React components, props, state, effects, and forms
- Next.js server and client components
- HTTP methods and status codes
- SQL tables, keys, joins, and transactions
- Git commits and branches

You do not need to master everything first. Build small exercises for any concept that blocks you.

**Exit gate:** you can build a small React CRUD page that calls a simple API.

### Phase 1 — Product requirements and wireframes

Write down:

- Target customers
- Administrator roles
- Supported product types
- Product discovery paths
- Required catalog fields
- First-release exclusions

Create wireframes for:

- Store homepage
- Category page
- Search results
- Product-detail page
- Admin login
- Admin dashboard
- Product create/edit flow

**Exit gate:** every Release 1 screen and user action is listed.

### Phase 2 — Create the monorepo

Create:

- pnpm workspace
- Turborepo configuration
- `storefront`, `admin`, and `api` applications
- Shared TypeScript and ESLint packages
- Environment-variable validation

Add root commands:

```text
dev
build
lint
typecheck
test
format
```

Add:

```text
.editorconfig
.env.example
.gitignore
README.md
```

**Exit gate:** a clean clone can install, lint, type-check, test, and build using documented commands.

### Phase 3 — Build the design system

Define tokens before building many pages:

- Brand colors
- Neutral colors
- Typography
- Spacing
- Border radius
- Shadows
- Breakpoints

Build shared components:

- Button
- Input
- Select
- Checkbox
- Card
- Dialog
- Table
- Pagination
- Empty state
- Error state
- Loading skeleton
- Toast

Ensure keyboard navigation, focus states, labels, and color contrast.

**Exit gate:** components work on mobile and desktop and pass basic accessibility checks.

### Phase 4 — Design the database

Create an entity-relationship diagram first.

Implement the Release 1 schema:

- Users and roles
- Brands
- Categories
- Stages
- Rooms
- Products
- Variants
- Images
- Suppliers

Create a real initial migration and safe development seed data.

Seed data must:

- Use fake accounts
- Read secrets from environment variables
- Never contain a real password
- Be repeatable

**Exit gate:** a new empty database can be migrated and seeded with one documented command.

### Phase 5 — Build the API foundation

Configure NestJS with:

- Global validation pipe
- Environment validation
- Swagger/OpenAPI
- CORS allowlist
- Structured logging
- Consistent error responses
- Request IDs
- Health endpoint
- Graceful shutdown

Create modules for:

- Auth
- Users
- Brands
- Categories
- Stages
- Rooms
- Suppliers
- Products
- Variants
- Uploads

Use:

- Controllers for HTTP concerns
- Services for business rules
- Repositories/Prisma for persistence
- Transactions for multi-record changes

**Exit gate:** API tests prove CRUD behavior, invalid-input handling, authentication, and authorization.

### Phase 6 — Implement authentication and authorization

Configure Supabase:

- Email/password or approved identity providers
- Correct redirect URLs
- Secure session-cookie handling
- Separate local and production projects

Implement:

- Customer signup
- Staff invitation
- Login
- Logout
- Password reset
- User synchronization
- Role guards

Permission examples:

| Operation | Admin | Catalog manager | Customer |
|---|---:|---:|---:|
| View public products | Yes | Yes | Yes |
| Create products | Yes | Yes | No |
| Archive products | Yes | Yes | No |
| Manage staff roles | Yes | No | No |
| View own profile | Yes | Yes | Yes |

**Exit gate:** API tests demonstrate that a customer cannot perform staff actions.

### Phase 7 — Build catalog APIs

Implement in this order:

1. Brands
2. Categories
3. Rooms
4. Stages
5. Suppliers
6. Products
7. Variants
8. Images

For list endpoints, add:

- Pagination
- Search
- Filtering
- Sorting
- Stable response shapes

Do not return unlimited database rows.

**Exit gate:** the entire catalog can be managed through Swagger or automated API tests without using the frontend.

### Phase 8 — Build the admin application

Implement:

1. Login and session handling
2. Protected layout
3. Dashboard navigation
4. Brands
5. Category hierarchy
6. Rooms and stages
7. Suppliers
8. Product form
9. Variant editor
10. Image upload and ordering

Forms should provide:

- Client validation for fast feedback
- Server validation for security
- Loading state
- Success state
- Clear field-level errors
- Protection from double submission

**Exit gate:** a catalog manager can create and publish a complete product without database access.

### Phase 9 — Build the public storefront

Implement:

1. Shared storefront layout
2. Navigation
3. Homepage
4. Category pages
5. Room pages
6. Stage pages
7. Search results
8. Product details
9. SEO metadata
10. Empty, loading, and error states

Use server-rendered pages for public catalog content where practical.

Add:

- Responsive images
- Image optimization
- Semantic headings
- Product structured data
- Canonical URLs
- Sitemap
- Robots configuration

**Exit gate:** all public catalog journeys work on mobile and desktop with JavaScript errors absent.

### Phase 10 — Testing and quality

Use several test levels:

- Unit tests for pure business rules
- API integration tests with a test database
- Component tests for complex forms
- End-to-end tests for critical user journeys

Minimum end-to-end journeys:

1. Administrator logs in.
2. Administrator creates a product.
3. Product appears on the storefront.
4. Customer searches for it.
5. Customer opens its detail page.
6. Unauthorized customer cannot edit it.

Run automatically:

```text
lint
typecheck
unit tests
integration tests
production build
```

**Exit gate:** CI passes from a clean checkout.

### Phase 11 — Security review

Verify:

- Every write endpoint requires authentication.
- Every staff endpoint checks role/permission.
- Inputs are validated on the server.
- File uploads are restricted.
- Secrets are not exposed through `NEXT_PUBLIC_` unless they are intentionally public.
- Database credentials are server-only.
- CORS uses an allowlist.
- Rate limiting protects login and expensive endpoints.
- Error responses do not leak credentials or stack traces.
- Logs do not contain access tokens or passwords.
- Dependency vulnerabilities are reviewed.

**Exit gate:** complete a written security checklist and attempt common unauthorized actions manually and automatically.

### Phase 12 — Deployment

Use separate environments:

- Local
- Staging
- Production

Recommended deployment units:

- Storefront
- Admin application
- API
- PostgreSQL/Supabase
- Object storage

Production deployment sequence:

1. Run tests.
2. Build immutable artifacts.
3. Back up the database.
4. Apply migrations as a controlled job.
5. Deploy API.
6. Deploy admin and storefront.
7. Run smoke tests.
8. Monitor errors and performance.

Never run development migrations interactively against production. Use:

```text
prisma migrate deploy
```

**Exit gate:** staging deployment can be reproduced from written documentation before production is attempted.

### Phase 13 — Operations and iteration

After launch, monitor:

- API errors
- Slow database queries
- Authentication failures
- Image-delivery failures
- Search behavior
- Product-page conversion
- Administrator errors
- Database capacity

Create:

- Backup schedule
- Restore drill
- Incident procedure
- Migration rollback/forward-fix strategy
- Dependency-update schedule

---

## 27. Development rules to follow

1. Build vertical slices. Complete one feature from database to UI before starting many unfinished features.
2. Make small Git commits with meaningful messages.
3. Never edit the production database manually as a normal workflow.
4. Every schema change must have a migration.
5. Every privileged operation must be authorized on the backend.
6. Never trust role, price, or stock values supplied by the browser.
7. Validate at system boundaries.
8. Return consistent API errors.
9. Add loading, empty, error, and success states to every screen.
10. Use realistic seed data but fake credentials.
11. Keep secrets out of Git.
12. Do not optimize prematurely, but add pagination from the beginning.
13. Measure before introducing caching.
14. Write documentation while decisions are fresh.
15. Do not proceed to payments until orders and pricing are thoroughly tested.

---

## 28. Suggested feature-building pattern

Build every feature using the same order.

Example: brands.

```text
1. Define the business rules.
2. Add/update the Prisma model.
3. Create a migration.
4. Add seed data if required.
5. Implement service methods.
6. Implement secured API endpoints.
7. Add API integration tests.
8. Regenerate the frontend API client.
9. Build the admin list and form.
10. Add admin component/end-to-end tests.
11. Add storefront usage.
12. Verify loading, empty, error, and permission states.
13. Document the feature.
```

Repeat this sequence for categories, rooms, stages, suppliers, products, variants, and images.

---

## 29. Mentor checkpoints

Use these questions before considering a phase complete.

### Architecture checkpoint

- Can you explain why every application and package exists?
- Is there one clear owner for each business rule?
- Are API types generated or centrally defined?
- Is duplicated architecture justified?

### Database checkpoint

- Do foreign keys prevent invalid relationships?
- Are unique fields actually constrained by the database?
- Are destructive deletes intentional?
- Can migration and seed commands rebuild a new environment?
- Are money and stock changes auditable?

### API checkpoint

- Are inputs validated?
- Are errors consistent?
- Are endpoints paginated?
- Are authentication and authorization both enforced?
- Are transactions used for related writes?

### Frontend checkpoint

- Does the screen work on mobile?
- Can it be used with a keyboard?
- Does it have loading, empty, error, and success states?
- Are server errors shown clearly?
- Does refreshing a page preserve correct behavior?

### Deployment checkpoint

- Can staging be deployed from scratch?
- Are migrations controlled?
- Are secrets stored outside the repository?
- Are logs and alerts available?
- Has a database restore been tested?

---

## 30. Definition of “finished”

Software is not finished merely because the homepage looks correct.

A Buildanta release is ready when:

- Requirements are documented.
- Database migrations work on a clean database.
- Seed data is safe and repeatable.
- API inputs are validated.
- Permissions are tested.
- Mobile and desktop interfaces work.
- Loading and failure states work.
- Automated tests cover critical journeys.
- Production builds succeed.
- Deployment is reproducible.
- Monitoring and backups exist.
- Known limitations are documented.

The best first objective is not “build the entire final company.” It is:

> Build a secure, fully tested catalog MVP in which an authorized staff member can publish a product and a customer can reliably discover it.

Once that vertical slice works from end to end, expand toward quotes, orders, inventory, payments, and fulfillment.
