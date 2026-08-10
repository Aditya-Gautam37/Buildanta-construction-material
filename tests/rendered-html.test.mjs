import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("Buildanta reference homepage and primary routes are present", async () => {
  const [home, hero, homepageContent, chrome, layout, data] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/hero-slider.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/homepage-content.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/site-chrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data.ts", import.meta.url), "utf8"),
  ]);
  assert.match(homepageContent, /Everything you need to finish/);
  assert.match(hero, /aria-roledescription="carousel"/);
  assert.match(home, /Trusted Brands/);
  assert.match(home, /Shop by Construction Stage/);
  assert.match(home, /Materials organized by category/);
  assert.match(home, /For Professionals/);
  assert.match(chrome, /Search products, brands, categories/);
  assert.match(chrome, /Inventory Management/);
  assert.match(layout, /Every Build Detail in One Place/);
  assert.match(data, /Foundation & Structure/);
  assert.match(data, /Sanitaryware & Bathware/);
});

test("public storefront reads the separate inventory catalogue without caching", async () => {
  const [catalog, homepageContent, inventoryPage, hero] = await Promise.all([
    readFile(new URL("../app/live-catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/homepage-content.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/inventory/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/hero-slider.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(catalog, /INVENTORY_API_URL/);
  assert.match(catalog, /cache: "no-store"/);
  assert.match(catalog, /product-variants/);
  assert.match(catalog, /availabilityStatus/);
  assert.doesNotMatch(catalog, /stockQuantity|reservedQuantity|lowStockThreshold/);
  assert.match(inventoryPage, /NEXT_PUBLIC_INVENTORY_MANAGEMENT_URL/);
  assert.match(inventoryPage, /redirect/);
  assert.match(homepageContent, /homepage-content/);
  assert.match(homepageContent, /cache: "no-store"/);
  assert.match(hero, /Live catalogue powered by Buildanta Inventory/);
});

test("quote and supplier workflows use durable services while storefront stock mutation is retired", async () => {
  const [quoteForm, quoteRoute, supplierRoute, inventoryRoute, hosting] = await Promise.all([
    readFile(new URL("../app/bulk-quotes/quote-form.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/quotes/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/suppliers/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/inventory/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
  ]);
  assert.match(quoteForm, /fetch\("\/api\/quotes"/);
  assert.match(quoteRoute, /quote-requests/);
  assert.match(supplierRoute, /PutObjectCommand/);
  assert.match(supplierRoute, /supplier-submissions/);
  assert.match(inventoryRoute, /STOREFRONT_INVENTORY_RETIRED/);
  assert.match(inventoryRoute, /status: 410/);
  assert.doesNotMatch(inventoryRoute, /D1Database|inventory_overrides|inventory_audit/);
  assert.match(hosting, /"d1": "DB"/);
  assert.match(hosting, /"r2": "PRODUCT_IMAGES"/);
  for (const asset of ["logo.png", "homepage_img.png", "forprofessionalsbanner.png", "whyus.png"]) {
    await access(new URL(`../public/${asset}`, import.meta.url));
  }
});

test("PIN-code serviceability is proxied through the public Inventory API contract", async () => {
  const [route, checker, productDetail] = await Promise.all([
    readFile(new URL("../app/api/serviceability/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/serviceability-checker.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/product-detail-client.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(route, /inventory-locations\/public\/availability/);
  assert.match(route, /cache: "no-store"/);
  assert.doesNotMatch(route, /SUPABASE_SERVICE|DATABASE_URL|stockQuantity|reservedQuantity/);
  assert.match(checker, /Not serviceable at this PIN code/);
  assert.match(checker, /buildanta-delivery-pincode/);
  assert.match(productDetail, /ServiceabilityChecker/);
});

test("quotation workflow submits a reviewed multi-item basket through the Inventory API", async () => {
  const [form, route] = await Promise.all([
    readFile(new URL("../app/bulk-quotes/quote-form.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/quotes/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(form, /items: items\.map/);
  assert.match(form, /REVIEW BEFORE SUBMISSION/);
  assert.match(form, /variantId/);
  assert.match(form, /deliveryPincode/);
  assert.match(route, /\/quote-requests/);
  assert.doesNotMatch(route, /DATABASE_URL|SUPABASE_SERVICE/);
});

test("customer signup keeps a stable form reference across the Supabase request", async () => {
  const form = await readFile(new URL("../app/customer-auth-form.tsx", import.meta.url), "utf8");
  assert.match(form, /const formElement = event\.currentTarget/);
  assert.match(form, /formElement\.reset\(\)/);
  assert.doesNotMatch(form, /event\.currentTarget\.reset\(\)/);
  assert.match(form, /Account created\. Open the confirmation link sent to your email/);
});

test("calculator defaults are valid and each recalculation receives a fresh estimate reference", async () => {
  const wizard = await readFile(new URL("../app/calculators/[slug]/calculator-wizard.tsx", import.meta.url), "utf8");
  assert.match(wizard, /name="wallThicknessM"[\s\S]*?step="0\.005"[\s\S]*?defaultValue="0\.115"/);
  assert.match(wizard, /submissionReference\.current = `calc-\$\{crypto\.randomUUID\(\)\}`/);
  assert.match(wizard, /constructionScope: String\(data\.get\("constructionScope"\)\)/);
  assert.match(wizard, /qualityTier: String\(data\.get\("qualityTier"\)\)/);
  assert.match(wizard, /name="constructionScope" defaultValue="FULL_FINISH"/);
  assert.match(wizard, /Calculate all stages/);
});

test("the More page links only to real, working destinations", async () => {
  const more = await readFile(new URL("../app/more/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(more, /Coming soon/);
  assert.doesNotMatch(more, /href="#"/);
  assert.match(more, /\/calculators/);
});

test("every professional-type page has its own metadata and no leaked placeholder copy", async () => {
  const [typePage, profilePage] = await Promise.all([
    readFile(new URL("../app/professionals/[type]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/professionals/[type]/[slug]/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(typePage, /generateMetadata/);
  assert.doesNotMatch(profilePage, /before public launch|Demo portfolio content/i);
});
