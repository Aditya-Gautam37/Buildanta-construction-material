# Managing the Buildanta catalogue

Inventory Management is the source of truth. Staff changes flow through the NestJS API to PostgreSQL and Supabase Storage; the storefront reads only published categories, published products and active variants.

## Categories

Open **Categories** in the Inventory header. Use the tree to distinguish top-level categories, subcategories and leaf categories. Products should be assigned to the most specific leaf category.

Every category supports a parent, description, durable image, icon identifier, sort order, featured state, published/draft state and SEO text. The interface warns about empty categories and duplicate display names. Duplicate display names are allowed only when path-aware slugs keep their meaning distinct. Circular parent relationships are rejected by the API.

Archiving moves a category to draft and preserves its products, children and image. Move dependent records before any permanent database maintenance.

## Products and images

Create products from the Dashboard and manage visibility, price, unit, GST, delivery wording and gallery from **Catalogue**. Product images are uploaded to Supabase Storage. Staff can add or remove images, edit alt text, choose the primary image and save display order.

Only published products appear on the storefront. Every product should have at least one active variant with a supplier, SKU, unit, minimum order quantity and either tracked stock or an enquiry-only state.

## Demonstration seed

Run `pnpm --filter inventory-management seed:demo` from `inventory-platform` to safely restore the canonical demonstration catalogue. The seed is idempotent. It uploads the nine catalogue asset families to Supabase Storage, upserts the category hierarchy and upserts 27 products by SKU.

Replace demonstration brands, supplier details, prices and stock before relying on the data for live sales.
