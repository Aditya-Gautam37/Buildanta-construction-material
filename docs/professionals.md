# Professional directory and contractor packages

Buildanta's professional directory is managed from the inventory application
and shown on the public storefront. It serves **Kanpur only** in this release.

## Three things that are easy to confuse

| | What it is | Who creates it |
| --- | --- | --- |
| **Profile** | Who the professional is — name, photo, location, experience, services | Staff |
| **Package** | An advertised offering: a rate per square foot and what it covers. Contractors only | Staff |
| **Quotation** | A project-specific commercial response, prepared after seeing drawings and the site | The contractor, off-platform |

**A package is not a quotation.** Every figure the storefront shows from a
package is labelled an estimate, because a rate multiplied by an area is not a
price anyone has agreed to.

## Public routes

- `/professionals`
- `/professionals/{contractors|interior-designers|builders|architects|product-owners}`
- `/professionals/:type/:profile-slug`

## Managing a profile

1. Sign in to Inventory Management as `ADMIN` or `DATA_ENTRY`.
2. Open **Professionals**.
3. Add name, photo, location, experience, services and biography.
4. Tick **Publish on storefront** and save.

**Contact details are not published.** Email and phone are stored for staff use
and are deliberately excluded from the public API — customers reach a
professional by sending an enquiry through Buildanta, never by seeing their
personal number on the open web.

Unpublished profiles are invisible to the public API. Deleting a profile
removes it, its packages and its enquiries.

## Managing packages

Packages appear on a contractor's row in the Professionals screen. Other
professional types do not have them in this release, and the server refuses to
create one for them.

### Lifecycle

| Status | Who can see it |
| --- | --- |
| `DRAFT` | Staff only |
| `UNDER_REVIEW` | Staff only |
| `PUBLISHED` | Customers |
| `ARCHIVED` | Staff only — retired, kept for reference |

Publication is refused unless the package has a name, a rate above zero, at
least one included work, valid dates, and a `validUntil` in the future. The
rules live in the server action, not only the form, because the action can be
called directly.

**Validity dates matter.** A package past its `validUntil` disappears from the
storefront automatically. An advertised rate with no expiry is an open-ended
commitment.

### Categorising included works

Every included work carries a category from a fixed list (Structure,
Electrical, Plumbing, Flooring, …). **This is what makes the comparison table
work** — two packages saying "Basic wiring" and "Premium concealed wiring" only
line up on the same row because both are filed under `ELECTRICAL`.

Works migrated from the old free-text field all landed as `OTHER` on purpose,
so the migration would not guess wrong. Until they are re-categorised, the
comparison renders as one large "Other works" row: correct, but not useful.

### Rate basis

Each package records whether its rate is per square foot of **plot area** or
**built-up area**. Contractors in Kanpur use both, and for a two-storey house
the difference is roughly double. The storefront labels its input from this
field, so a customer is never guessing which number to type.

### Materials

Shown to customers as the contractor's own proposed specification and preferred
brands — never as a Buildanta endorsement or an approved-brand list.

## Enquiries

A customer opens a package, enters an area, and requests a detailed quotation.
The form appears on the package card itself.

**The server owns the price.** Nothing about rate or total is accepted from the
browser: the package is reloaded by slug, scoped to that professional,
re-checked for publication and validity, and the amount recomputed server-side.
The rate, package name, basis and amount are then **snapshotted** onto the
enquiry, so a later price change cannot rewrite what a customer was shown.

Consent is stored as a timestamp, not a boolean — when it was given is the part
that matters if it is ever questioned.

### Enquiry workflow

`SUBMITTED` → `REVIEWING` → `PROFESSIONAL_CONTACTED` → `CALLBACK_SCHEDULED` →
`SITE_VISIT_SCHEDULED` → `QUOTATION_PREPARED` → `CLOSED` / `CANCELLED`

Staff can change status and add internal notes. **Nothing else is editable:**
the customer's details and the price snapshot are a record of what was
submitted, and editing them would destroy the history the snapshot exists to
keep.

Enquiries hold customer contact details and are **never returned by a public
endpoint**. Buildanta contacts the customer; the contractor is not automatically
notified and is not given customer details, because no authorised notification
workflow exists yet.

## Data flow

- Inventory Management writes to the shared Supabase Postgres database.
- Photos upload through the authenticated inventory route to Supabase Storage.
- The Nest API serves published records via `GET /professionals` and
  `GET /professionals/:slug`, packages included inline.
- Enquiries post to
  `POST /professionals/:slug/packages/:packageSlug/enquiries`, rate limited per IP.
- The storefront reads without caching, so saved changes appear on the next
  page request.

## What must never appear

"Buildanta Verified", "guaranteed rate", "guaranteed completion", "best
contractor", "verified experience", "approved brands" — there is no data or
workflow behind any of them. There is no verification field, no ratings and no
reviews in this release.

`featured` is an editorial flag meaning Buildanta chose to surface a listing.
It is shown as "Featured listing", never as a credential.

## Related

- [Material-quotation handoff](./PACKAGE_TO_MATERIAL_QUOTATION.md)
- [Pending contract migration](./CONTRACTOR_PACKAGES_CONTRACT_MIGRATION.md)
