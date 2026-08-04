# Buildanta: Website Development Guide from Scratch to Production

This document describes a practical way to build Buildanta from the initial idea through production deployment. It can also be used as an onboarding guide for developers who are unfamiliar with the project.

## 1. Define the Product

Before writing code, define the problem that Buildanta solves.

### Target users

- Customers looking for construction and home-finishing products
- Suppliers listing and maintaining their products
- Inventory staff tracking stock
- Administrators managing the platform

### Initial product goal

The first useful release should allow a customer to:

1. Browse products.
2. Filter products by category, room, or construction stage.
3. View product and variant details.
4. Request a quote.

Inventory staff should be able to:

1. Sign in securely.
2. Add and update products.
3. Manage product variants and stock.
4. Review suppliers and quote requests.

Avoid adding secondary features until these workflows work reliably.

## 2. Document the Requirements

Create user stories before implementation. For example:

> As a customer, I want to filter products by room so that I can quickly find products suitable for my project.

> As an inventory employee, I want to update available stock so that customers and staff see accurate information.

Each user story should define:

- Who performs the action
- What the user wants to do
- Why the action is valuable
- Required permissions
- Validation rules
- Expected success result
- Expected error behaviour
- Acceptance criteria

## 3. Plan the Pages

### Customer storefront

```text
Home
├── Categories
├── Products by room
├── Products by construction stage
├── Product listing
├── Product details
├── Bulk quote request
├── Login
└── Customer profile
```

### Inventory application

```text
Dashboard
├── Products
├── Product variants
├── Categories
├── Brands
├── Suppliers
├── Inventory
├── Quote requests
└── User profile
```

Every page should account for:

- Loading state
- Empty state
- Error state
- Success state
- Mobile layout
- Desktop layout
- Keyboard accessibility

## 4. Design the User Experience

Start with low-fidelity wireframes before writing production UI code.

1. Map the main user journeys.
2. Create wireframes for the important pages.
3. Create a clickable prototype.
4. Test the prototype with representative users.
5. Fix confusing navigation and forms.
6. Establish reusable colours, spacing, typography, and components.

The design should use consistent buttons, inputs, cards, tables, dialogs, alerts, and navigation patterns.

## 5. Design the Data Model

The database should reflect the business rather than individual screens.

Likely core entities include:

```text
User
Role
Supplier
Brand
Category
Room
ConstructionStage
Product
ProductVariant
ProductImage
Inventory
QuoteRequest
QuoteItem
```

Important relationships include:

```text
Supplier ──< Product
Brand ──< Product
Category ──< Product
Product ──< ProductVariant
Product ──< ProductImage
ProductVariant ──< Inventory
QuoteRequest ──< QuoteItem
QuoteItem >── ProductVariant
```

Before finalizing the schema:

- Decide which fields are required.
- Decide which values must be unique.
- Define deletion behaviour.
- Add timestamps where auditing is useful.
- Plan indexes for search and filtering.
- Decide how prices and currencies are stored.
- Decide how inventory history is recorded.

All database changes should be made through reviewed Prisma migrations.

## 6. Choose an Architecture

For a growing Buildanta platform, the following monorepo structure is reasonable:

```text
apps/
  storefront/          Customer-facing Next.js application
  inventory/           Internal inventory Next.js application
  api/                 NestJS backend

packages/
  database/            Prisma schema and database client
  ui/                  Shared UI components
  validation/          Shared Zod schemas and types
  config/              Shared TypeScript and lint configuration
```

The normal request flow should be:

```text
Browser
  → Next.js application
  → NestJS API
  → business service
  → Prisma
  → PostgreSQL
```

Supabase can provide authentication, but the NestJS API must still verify the user's identity and permissions.

If the first version is small and has only one frontend, Next.js route handlers can replace a separate NestJS API. A separate API becomes valuable when multiple clients share substantial backend logic.

## 7. Establish the Development Environment

Standardize the following:

- Node.js version
- pnpm version
- TypeScript strict mode
- ESLint
- Prettier
- Git workflow
- Environment-variable names
- Database migrations
- Seed data
- Test commands

Create a safe `.env.example` containing names but no credentials:

```env
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_API_URL=http://localhost:5173
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Never commit actual secrets.

## 8. Build Features Vertically

Complete one feature through all layers before starting many disconnected pages.

For each feature, implement:

```text
UI
→ client validation
→ API request
→ authentication
→ authorization
→ server validation
→ business logic
→ database operation
→ response
→ UI success/error state
→ automated tests
```

### Recommended implementation order

1. Authentication
2. Roles and permissions
3. Database foundation
4. Categories, brands, rooms, and stages
5. Suppliers
6. Products
7. Product variants and images
8. Storefront product browsing
9. Search and filtering
10. Quote requests
11. Inventory management
12. Administration and reporting

## 9. Define Clear Backend Boundaries

NestJS modules should represent business areas:

```text
AuthModule
UsersModule
SuppliersModule
CategoriesModule
BrandsModule
RoomsModule
StagesModule
ProductsModule
ProductVariantsModule
InventoryModule
QuotesModule
```

Use each layer consistently:

- Controllers receive HTTP requests and return responses.
- DTOs and Zod schemas validate incoming data.
- Guards verify authentication and permissions.
- Services contain business rules.
- Prisma handles database access.

Do not place important business rules only in React components.

## 10. Apply Security from the Beginning

Every protected server operation must verify:

1. The access token is valid.
2. The user exists and is active.
3. The user has permission to perform the operation.
4. The input is valid.
5. The requested record is within the user's permitted scope.

Also implement:

- Rate limiting
- Secure headers
- Restricted CORS configuration
- Safe file-upload validation
- Maximum request sizes
- Dependency vulnerability checks
- Audit logs for sensitive changes
- Secret management
- Database backups

Hiding a button in the UI is not authorization. Authorization must be enforced by the server.

## 11. Test the Application

### Unit tests

Test individual business rules, such as:

- Price calculations
- Quote validation
- Inventory adjustments
- Role and permission decisions

### Integration tests

Test:

- API validation
- Authentication guards
- Service and database behaviour
- Transactions
- Duplicate and missing records

### End-to-end tests

Test complete user journeys:

```text
Customer browses products and submits a quote
Supplier or employee creates a product
Employee updates inventory
Administrator changes user permissions
```

Every pull request should run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 12. Prepare Environments

Use three separate environments:

```text
Development → Staging → Production
```

Each environment should have:

- Separate environment variables
- Separate database
- Separate Supabase configuration when practical
- Appropriate test or production data
- Independent deployment configuration

Do not use the production database for ordinary local development.

## 13. Set Up Continuous Deployment

A safe deployment pipeline should perform:

```text
Install dependencies
→ lint
→ type-check
→ run tests
→ build
→ deploy to staging
→ run smoke tests
→ approve production
→ deploy production
→ verify application health
```

Production database migrations should be reviewed. Back up important data before destructive schema changes.

## 14. Prepare for Production

Before launch, configure:

- Domain name and HTTPS
- Production database
- Production environment variables
- Image/object storage
- Transactional email
- Application logs
- Error monitoring
- Performance monitoring
- Uptime monitoring
- Analytics
- Automated database backups
- A tested rollback process

Do not store uploaded product images inside a temporary application deployment. Use durable object storage.

## 15. Perform Pre-Launch Checks

Verify:

- Authentication and logout
- Permissions for every role
- Product creation and editing
- Product filters and search
- Quote submission
- Inventory updates
- Mobile and desktop layouts
- Major browsers
- Accessibility
- SEO metadata
- Error and empty states
- Slow-network behaviour
- Database backups and restoration
- Monitoring and alert delivery

Run a limited beta with real users before a full public launch.

## 16. Launch and Monitor

Immediately after deployment:

1. Check storefront and inventory URLs.
2. Verify API health.
3. Test authentication.
4. Complete the most important customer journey.
5. Check database connectivity.
6. Review logs and error monitoring.
7. Confirm email and external integrations.

Keep the previous production release available for rollback.

## 17. Maintain the Product

After launch:

- Review errors and performance regularly.
- Prioritize feedback by user impact.
- Deploy small, reviewable changes.
- Update dependencies carefully.
- Test database migrations.
- Review permissions and security.
- Remove unused code.
- Keep documentation current.
- Test backup restoration periodically.

## Definition of Done

A feature is complete only when:

- Requirements and acceptance criteria are satisfied.
- UI states are implemented.
- Mobile behaviour works.
- Client and server validation exist.
- Authentication and authorization are enforced.
- Errors are handled clearly.
- Appropriate automated tests pass.
- Types, linting, and builds pass.
- Documentation is updated.
- The feature works in staging.

## Recommended Documentation

Maintain these files in the repository:

```text
README.md                 Product overview and quick start
BUILD_FROM_SCRATCH.md     End-to-end development approach
ARCHITECTURE.md           Applications, packages, and data flow
CONTRIBUTING.md           Development and review workflow
.env.example              Required environment-variable names
docs/
  requirements.md
  database.md
  authentication.md
  deployment.md
  testing.md
```

## Final Development Principle

Build the smallest valuable version first. Complete each feature through the entire system, validate it with users, and expand only after the foundation works reliably.

