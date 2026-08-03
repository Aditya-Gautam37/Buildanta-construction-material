# Professional directory

Buildanta's professional directory is controlled from the inventory application and displayed on the public storefront.

## Management workflow

1. Sign in to Inventory Management as an `ADMIN` or `DATA_ENTRY` user.
2. Open **Professionals** in the top navigation.
3. Choose one of the five supported types: Contractor, Interior Designer, Builder, Architect, or Product Owner.
4. Add the person's name, photo, location, experience, services, biography, contact details, and past-work link.
5. Enable **Publish on storefront** and save.

Unpublished profiles remain available to inventory staff but are never returned by the public API. Deleting a profile removes it from the public directory.

## Data flow

- Inventory Management writes professional records to the shared Supabase Postgres database.
- Photos are uploaded through the authenticated inventory upload route to durable Supabase Storage.
- The Nest API exposes published records through `GET /professionals` and `GET /professionals/:slug`.
- The storefront reads those endpoints without caching, so saved dashboard changes appear on the next page request.

## Public routes

- `/professionals`
- `/professionals/contractors`
- `/professionals/interior-designers`
- `/professionals/builders`
- `/professionals/architects`
- `/professionals/product-owners`
- `/professionals/:type/:profile-slug`
