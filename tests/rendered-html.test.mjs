import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("Buildanta storefront and quote endpoint are included", async () => {
  const [page, catalog, layout, quoteRoute] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/catalog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/quotes/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<Catalog \/>/);
  assert.match(catalog, /Build better/);
  assert.match(catalog, /Source smarter/);
  assert.match(catalog, /Request a quote/);
  assert.match(catalog, /fetch\("\/api\/quotes"/);
  assert.match(layout, /Buildanta — Construction materials/);
  assert.match(layout, /\/og\.png/);
  assert.match(quoteRoute, /deliveryPincode/);
  assert.match(quoteRoute, /db\.insert\(quoteRequests\)/);
  await access(new URL("../public/og.png", import.meta.url));
});
