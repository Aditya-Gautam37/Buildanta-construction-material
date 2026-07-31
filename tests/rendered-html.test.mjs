import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("Buildanta reference homepage and primary routes are present", async () => {
  const [home, chrome, layout, data] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/site-chrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data.ts", import.meta.url), "utf8"),
  ]);
  assert.match(home, /Everything you need to finish/);
  assert.match(home, /Trusted Brands/);
  assert.match(home, /Shop by Construction Stage/);
  assert.match(home, /Browse Building Categories/);
  assert.match(home, /For Professionals/);
  assert.match(chrome, /Search products, brands, categories/);
  assert.match(chrome, /Inventory Management/);
  assert.match(layout, /Every Build Detail in One Place/);
  assert.match(data, /Foundation & Structure/);
  assert.match(data, /Sanitaryware & Bathware/);
});

test("public storefront reads the separate inventory catalogue without caching", async () => {
  const [catalog, inventoryPage, home] = await Promise.all([
    readFile(new URL("../app/live-catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/inventory/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(catalog, /INVENTORY_API_URL/);
  assert.match(catalog, /cache: "no-store"/);
  assert.match(catalog, /product-variants/);
  assert.match(inventoryPage, /NEXT_PUBLIC_INVENTORY_MANAGEMENT_URL/);
  assert.match(inventoryPage, /redirect/);
  assert.match(home, /Live catalogue powered by Buildanta Inventory/);
});

test("quote, supplier upload, and inventory workflows use durable services", async () => {
  const [quoteForm, supplierRoute, inventoryRoute, hosting] = await Promise.all([
    readFile(new URL("../app/bulk-quotes/quote-form.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/suppliers/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/inventory/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);
  assert.match(quoteForm, /fetch\("\/api\/quotes"/);
  assert.match(supplierRoute, /PRODUCT_IMAGES\.put/);
  assert.match(supplierRoute, /supplier_submissions/);
  assert.match(inventoryRoute, /getChatGPTUser/);
  assert.match(inventoryRoute, /inventory_audit/);
  assert.match(hosting, /"d1": "DB"/);
  assert.match(hosting, /"r2": "PRODUCT_IMAGES"/);
  for (const asset of ["logo.png", "homepage_img.png", "forprofessionalsbanner.png", "whyus.png"]) {
    await access(new URL(`../public/${asset}`, import.meta.url));
  }
});
