# Homepage management

The storefront homepage is connected to the Buildanta Inventory application.

## Manage rotating banners

1. Sign in to Inventory at `http://localhost:3002`.
2. Open **Homepage** in the left navigation.
3. Add or edit a slide, upload a landscape image, enter accessible alternative text, and choose whether it is active.
4. Use the position field to control the display order.

Uploaded images are stored in the configured Supabase Storage bucket. They are not saved inside the temporary application deployment.

## Manage featured products

Use **Featured inventory products** on the same page to choose and reorder up to 12 products. Product names, images, prices and detail links continue to come from the inventory catalogue, so catalogue edits automatically appear on the storefront.

If no slides or featured products are selected, the storefront uses its existing hero image and newest catalogue products as safe fallbacks.
