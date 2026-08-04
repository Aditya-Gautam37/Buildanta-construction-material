# Architecture

Buildanta uses two separate applications connected through the catalogue API.

- Public storefront: this Vinext/Cloudflare Worker application, with server-rendered catalogue data and client-side search, filters and sorting
- Inventory management: the separate Next.js application in `inventory-platform/apps/inventory-management`
- Shared catalogue: the inventory NestJS API is the business-control layer and source of truth for publishing, products, variants, stock, reservations, durable image URLs, suppliers, brands, categories, stages and rooms
- Structured records: the inventory NestJS/Prisma API (`inventory-platform/apps/nest-api`) owns quotes, supplier submissions and inventory audit history; the storefront reaches it through `INVENTORY_API_URL`
- Product images: R2 (`PRODUCT_IMAGES`); uploaded images must never be written to deployment storage
- Authentication: the storefront catalogue is public; inventory management owns its own protected login and authorization
- Monitoring: provider configuration is environment-driven and must be enabled in staging and production

The storefront uses uncached server-side API reads, so a saved inventory change is visible on the next storefront request. `/inventory` is only a compatibility redirect to the separate inventory application; the private dashboard is never embedded in the storefront.

Every inventory mutation is authenticated and remains the responsibility of the inventory application. Uploaded product images use durable object-storage URLs and are never written to temporary application deployment storage.

Public catalogue reads include only `PUBLISHED` products and `ACTIVE` variants. Stock availability is calculated as physical stock minus reserved stock. Variants that have not been initialized through the stock workflow are shown as available for enquiry, preventing unverified stock claims.
