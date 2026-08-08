# Guided shopping wizard — specification

Status: decided, not yet implemented. Recorded 2026-08-08.

## Goal

Replace flat filtered product grids with a guided drill-down that carries a customer from a broad
entry point to a specific product in a small number of unambiguous taps, showing one decision per
screen and never more than six options at a time.

## Reference journey

```
Living room  ->  Paints  ->  Exterior paints  ->  Exterior emulsion  ->  Asian Paints  ->  product cards
   lens          category      category child       leaf category          brand           product + variants
```

Every step is read from inventory. Nothing in the journey is hardcoded in the storefront.

## Decisions, set one — the room journey

| # | Question | Decision |
|---|---|---|
| 1 | How does the wizard know a room contains paints, tiles, electrical? | Explicit mapping stored in inventory. Not derived from product tags. |
| 2 | Where does the wizard live? | Intercepting route. Overlay when opened in-session, full server-rendered page on direct visit or crawl. **URL scheme superseded by decision 21.** |
| 3 | How does the storefront get the data? | Reuse `getCatalogSnapshot()` in `app/live-catalog.ts`. No new storefront fetch layer. |
| 4 | Branches with no products anywhere beneath them? | Hidden entirely. The wizard must never lead to a dead end. |
| 5 | Where do staff manage the mapping? | On the owner. Open a room in the inventory Rooms tab, tick and order its categories. |
| 6 | At what depth does the mapping apply? | Root categories, plus per-owner exclusions at any depth. |
| 7 | Levels with a single option? | Auto-skipped. The skipped level still appears in the breadcrumb. |
| 8 | Brand step? | Shown, with an "any brand" option that goes straight to all products in the leaf. |
| 9 | Duplicate categories in inventory? | Clean the data before shipping. Audit first, then merge. |
| 10 | Where does the journey end? | Product grid inside the wizard, reusing the existing `ProductCard`, breadcrumb retained. |
| 11 | Existing guided flows? | New wizard replaces `GuidedProductFinder`. `StageQuestionnaire` stays — stage planning is a different job. |
| 12 | Freshness | Keep the existing `cache: "no-store"` reads. An inventory save appears on the next storefront request. |

## Decisions, set two — the wider pivot

| # | Question | Decision |
|---|---|---|
| 13 | Which entry points get the wizard? | All four lenses: room, stage, category, brand. Plus global search landing in the tree. |
| 14 | How is it built across lenses? | One engine, pluggable lens. Every journey converges on the same category → brand → product tail. |
| 15 | Stage has no relation to category either. | One generic link table serving both, with an owner type of `ROOM` or `STAGE`. |
| 16 | The flat `ProductBrowser` and its filter panel? | Leaf only, filters collapsed by default. Intermediate levels show child options and nothing else. |
| 17 | Options per screen? | Six, ranked by product count, then a "see all" expander. |
| 18 | Mid-journey lens switching? | Breadcrumb chips as a constraint stack. Every crumb removable, an "add" chip at the leaf layers a second lens. No separate lens switcher. |
| 19 | Qualifying questions (quantity, quality, budget)? | Optional refinement at the leaf, dismissible. Never blocks the path to products. |
| 20 | Expert and returning customers? | Header search lands at the matching wizard node with the breadcrumb pre-filled, and they continue from there. |
| 21 | URL scheme? | Canonical node plus lens parameters. See below. |
| 22 | Rollout? | Room end-to-end first, then the remaining lenses. **The pivot is finished only when all of section "Phases" is done** — see the completion contract. |
| 23 | Launch gate? | Every category mapped to a live room or stage must reach at least one published product. Enforced by an audit script. |
| 24 | Calculators? | Assumed out of scope. `CalculatorWizard` and its estimate flow are a different job and stay as they are. |

## URL scheme (decision 21)

Canonical content lives on the category node. Lens context is a query parameter, mirroring the
breadcrumb chips one-to-one.

```
/by-room/living-room                                    indexable entry page
/by-stage/finishing                                     indexable entry page
/brands/asian-paints                                    indexable entry page
/categories/paints?room=living-room                     journey continues
/categories/exterior-emulsion?room=living-room&brand=asian-paints
/categories/exterior-emulsion                           canonical, params stripped
```

Roughly 108 indexable URLs (60 categories, 10 rooms, 8 stages, 30 brands) instead of the ~1,100
near-duplicates a URL-per-path scheme would generate. A fifth lens later adds its entry pages and
nothing else.

Removing a chip removes its parameter. The address bar and the breadcrumb are the same object, so
back, forward, refresh and sharing need no special handling.

`/by-room?room=X` and `/by-stage?stage=X` are the current query forms and must 301 to the new path
segments.

### Overlay mechanism

vinext supports parallel (`@slot`) and intercepting (`(.)`, `(..)`, `(...)`) routes.

```
app/
  layout.tsx                        renders {children} and {wizard}
  @wizard/
    default.tsx                     null
    (.)by-room/[room]/page.tsx
    (.)by-stage/[stage]/page.tsx
    (.)categories/[slug]/page.tsx
    (.)brands/[slug]/page.tsx
  by-room/[room]/page.tsx           full page
  by-stage/[stage]/page.tsx
  categories/[slug]/page.tsx        already exists
  brands/[slug]/page.tsx            new
```

The client wizard holds the snapshot and syncs the URL with `history.pushState`, so step taps are
instant. The server routes only do work on direct entry.

## Why an explicit mapping and not derivation

`Room`, `Stage` and `Category` have no relation to each other in `schema.prisma`. All three link
only to `Product` (`ProductToRoom`, `ProductToStage`, `CategoryToProduct`). Deriving "living room
contains paints" from product tags means a category appears only once at least one product is
tagged to both, which makes the wizard silently incomplete while the catalogue is still filling in.

## Phases

Steps in phases 1 to 4 are inside `inventory-platform`, a separate pnpm workspace with its own
Prisma migrations and deployment. The storefront cannot be verified end-to-end until phase 3 ships.

### Phase 0 — audit, read-only

- Script listing every category-tree collision. `Exterior Paints` is known to exist twice under
  `Paints`, at `/exterior-paints` and at `/paints-finishing/exterior`.
- Script listing every category with no published product anywhere in its subtree.
- Output is a merge list and a coverage list, both reviewed before any write.

Done when: both reports exist and the merge list is agreed.

### Phase 1 — schema

`packages/database/prisma/schema.prisma` plus a migration:

```prisma
model TaxonomyCategoryLink {
  id         String   @id @default(cuid())
  ownerType  TaxonomyOwnerType
  roomId     String?
  room       Room?    @relation(fields: [roomId], references: [id])
  stageId    String?
  stage      Stage?   @relation(fields: [stageId], references: [id])
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id])
  mode       TaxonomyLinkMode @default(INCLUDE)
  sortOrder  Int      @default(0)

  @@unique([roomId, categoryId, mode])
  @@unique([stageId, categoryId, mode])
  @@index([ownerType, mode, sortOrder])
}

enum TaxonomyOwnerType { ROOM STAGE }
enum TaxonomyLinkMode  { INCLUDE EXCLUDE }
```

`INCLUDE` rows carry the root mapping and its display order. `EXCLUDE` rows hide a specific
subcategory from one owner at any depth.

Also on `Room` and `Stage`: add `imageUrl`. Room images are hardcoded in `app/page.tsx` today and
the wizard should read them from the database.

Done when: migration applied, seed and verify scripts updated.

### Phase 2 — data cleanup

Execute the phase 0 merge list. Merging moves product assignments, so this is not a rename.

Done when: no duplicate-name siblings remain under any parent.

### Phase 3 — NestJS API

- `RoomsService.findAll` and `StagesService.findAll` return their links.
- Guarded endpoints to set and clear links.
- Fix: rooms and stages writes pass `JwtAuthGuard` but skip the
  `requireRole(role, CATALOGUE_WRITE_ROLES)` check that `CategoriesService` enforces. Any
  authenticated staff role can currently create or delete rooms.
- Coverage endpoint backing the launch gate.

Done when: endpoints tested, and the storefront can read links without a schema guess.

### Phase 4 — inventory admin

Extend the Rooms and Stages tabs in
`apps/inventory-management/app/components/inventory-dashboard/tabs/` with the category picker,
ordering and exclusion toggles. Both tabs use the same component.

Done when: a staff member can map a room's categories, reorder them, exclude a subcategory, and
see the change reflected on the storefront on the next request.

### Phase 5 — storefront engine

- Extend `CatalogSnapshot` in `app/live-catalog.ts` with taxonomy links and a subtree
  product-count helper. The count drives empty-branch hiding, auto-skip and the six-option ranking.
- Build the wizard engine: option grid, breadcrumb chip stack, auto-skip, "see all" expander,
  leaf product grid with collapsed filters, optional refinement.
- Room lens wired end-to-end and verified in a real browser.

Done when: the reference journey at the top of this document works from the homepage room tile
through to a product card, as an overlay and as a direct-visit page.

### Phase 6 — remaining lenses

The engine is proven; these are configuration plus routes.

- Stage lens, coexisting with `StageQuestionnaire`.
- Category lens: remove `ProductBrowser` from intermediate levels of `/categories/[slug]`, keep
  it at the leaf.
- Brand lens: new `/brands/[slug]` entry pages.
- Search: header search resolves to a wizard node instead of `/categories?q=`.

Done when: all four lenses reach a product, and the chip stack composes across lenses.

### Phase 7 — retirement and link rewrite

- Delete `GuidedProductFinder` and its module CSS and test.
- Rewrite every inbound link to the new scheme: homepage discovery tiles, stage strip, room grid,
  category showcase, header dropdowns, mobile drawer, footer columns, `/more`.
- 301 the old `/by-room?room=` and `/by-stage?stage=` query forms.
- Update `app/sitemap.ts` to the canonical URL set.

Done when: no route in the storefront still renders a flat grid as its first screen, and no dead
links remain.

### Phase 8 — launch gate

Run the coverage audit. Every category mapped to a live room or stage reaches at least one
published product. Fix inventory, not code, then re-run.

Done when: the audit reports zero violations.

## Progress log

### 2026-08-08 — phase 0 done

Audit script added at `packages/database/src/audit-category-tree.ts`, run with
`npm run db:audit-category-tree`. Read-only. Results: 228 categories (68 published), 126 published
products, 0 empty root departments, 0 stranded products, 4 exact duplicate sibling pairs, 8 near
duplicates, 175 categories with no published product in their subtree.

Headline finding: two complete parallel taxonomies exist. Tree A has flat slugs
(`/exterior-paints`), the richer depth, and no products. Tree B has pathed slugs
(`/paints-finishing/exterior`), is shallower, and holds every product.

DECIDED: keep tree A's depth, migrate tree B's products onto it, retire tree B. This supersedes
the phase 2 description above — it is a taxonomy migration, not a four-node merge.

### 2026-08-08 — live catalogue outage found and fixed

Phase 0 uncovered that the storefront was serving hardcoded `app/data.ts` demo data to every
visitor. Cause: migration `20260807120000_cart_and_purchase_modes` had never been applied, so
`ProductVariant.purchaseMode` did not exist, so `/product-variants` returned 500, and
`getCatalogSnapshot`'s `Promise.all` dropped all six collections to `fallbackSnapshot()`.

Applied with `prisma migrate deploy`. Verified: all six endpoints return 200, and
`/categories` shows 11 real departments and 126 products.

Not yet deployed, written and tested but not live:

- `app/categories/[slug]` converted to `[...slug]`. 57 of 68 published categories have a slash in
  their slug, and `CategoriesService.resolvedSlug` generates `parent.slug + "/" + name` for every
  new subcategory, so single-segment routing breaks again on the next staff-created category.
  34 of the 45 category links on `/categories` still 404 until this ships.
- `app/live-catalog.ts` now degrades `stages`, `rooms`, `brands` and `product-variants`
  individually. `products` and `categories` still fall back, since without them there is no
  catalogue. One bad endpoint can no longer blank the storefront.

Both are type-clean with 47/47 unit tests passing. Neither is browser-verified: `vinext dev` does
not bind a port in this environment, and the pre-existing `storefront` launch config fails the
same way. Worth solving separately, since local browser verification is the team's definition of
done.

## Completion contract

This is a structural pivot, not an experiment. It is not finished when the room journey works.
It is finished when every phase above is done, `GuidedProductFinder` is deleted, every inbound
link points at the new scheme, and the coverage audit is clean. Phases 6 and 7 are the ones most
likely to be abandoned once the demo looks good; they are the ones that actually remove the
overwhelm from the rest of the site.
