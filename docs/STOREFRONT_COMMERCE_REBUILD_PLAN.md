# Storefront commerce rebuild — decisions and plan

Covers the buying flow, the account area, the blue-glass rebrand, and how
orders reach the inventory app.

## Decisions (settled — build to these)

| Question | Decision |
| --- | --- |
| Guest checkout | **No.** Browsing and cart stay open to everyone; **login is required to place an order** |
| Order tracking | **Login required.** No public order-ID lookup |
| Order history | **Orders link to the account at checkout.** Email matching stays only as a fallback for older records |
| Visual style | **Full rebrand to blue glass.** Orange reduces to a small accent or goes |
| Animation | **Rich** — scroll reveals, parallax heroes, page transitions |
| Related products in cart | **Curated pairings first, same-category as fallback** |
| Order handling in inventory | **Simple queue**: New → Confirmed → Packed → Out for delivery → Delivered |
| Homepage goal | **Buy materials.** Browse and order is the primary path |
| Build order | **The broken buying flow first**, looks second |

## The bug that started this

`customer-portal.service.ts:13` finds a customer's quotations by matching
`customerEmail` against their login email. Nothing links an order to a user
account. So an order placed with a different email — or as a guest — is
invisible after login, even though it exists.

That is why `/account` showed "No quotations yet".

Fixing it properly is why "orders link to the account at checkout" is decision
three, and why the buying flow is being done before the rebrand.

## Stages

Each stage ends deployable, tested, and reviewable on its own.

### Stage A — the buying flow (first)

1. **Login-gated checkout.** Browsing and cart stay open to guests. At
   checkout, an anonymous customer is sent to log in and returned to their cart
   with it intact. The cart must survive the round trip.
2. **Orders carry the account.** Add `customerUserId` to the order at
   checkout. Backfill nothing; email matching remains for older rows.
3. **Order history by account.** `/account` lists orders for the logged-in
   user by account first, falling back to email so existing records still show.
4. **Order tracking page.** A real page per order showing where it is, gated to
   the account that placed it.
5. **Account area rebuild.** Profile, saved address, order list, order detail.

### Stage B — orders in the inventory app

6. **Order queue** with the five states, showing which customer placed each
   order and what they bought.
7. **Status changes** that the customer sees on their tracking page.

### Stage C — the rebrand

8. **Design tokens first** — a blue-glass palette, surfaces, blur and depth
   defined once, so every page inherits it rather than being restyled by hand.
9. **Storefront pages** rebuilt on those tokens: homepage, category, product,
   cart, checkout, account.
10. **Inventory app** brought onto the same tokens.

### Stage D — merchandising

11. **Homepage** built around browsing and buying.
12. **Product cards and listing** reworked.
13. **Related products in cart** — curated, category fallback.

## Constraints carried from earlier work

- Never present an estimate as a quotation.
- No invented ratings, verification badges or project counts.
- Contractor and customer contact details stay off public pages.
- The server owns every price. Nothing is trusted from the browser.
- Money is decimal, never floating point.

## Risks worth stating

**Login before ordering will cost some orders.** It is the right call for
tracking and history, but expect a drop-off at the login step. Worth measuring
once live, and worth making the login screen as short as possible.

**Rich animation on mid-range Android.** Most Kanpur customers will be on
budget phones. Every animation must respect `prefers-reduced-motion`, run on
compositor-friendly properties, and be tested on a throttled device profile
rather than a laptop.

**The logo is orange and navy.** A full blue-glass rebrand will fight it. Either
the logo needs a variant, or blue becomes the surface language while the logo
keeps its colours as the one warm accent.
