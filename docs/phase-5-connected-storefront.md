# Phase 5 - Connected customer storefront

Status: implemented and verified on 2026-08-03.

## Delivered

- Persistent PIN-code selection with anonymous serviceability checks.
- Location-filtered catalogue discovery with category/stage/room, search, brand, indicative price, availability and fulfilment-mode filters.
- Safe availability labels for Buildanta stock, partner stock and on-request supply without exact balances.
- Existing multi-item quotation basket and review-before-submit workflow preserved.
- Protected customer portal that lists only quotations and orders matching the authenticated customer email.
- Approved quotation acceptance through the same atomic sales-order and reservation service used by staff.
- Quote, dispatch and delivery status timelines.
- Customer cancellation only for confirmed orders, with atomic reservation release.
- Customer return requests only after delivery; received returns still enter the staff quarantine and inspection workflow.
- Pending submit states prevent duplicate acceptance, cancellation and return requests.
- Unsupported PIN-code and empty-filter alternatives retain a manual quotation path.

## Public/private boundary

Public responses contain product identifiers, safe availability status, fulfilment mode and delivery estimates. They do not contain exact balances, location details, purchase costs, supplier details, margins or audit history.

## Verification

- Storefront lint, production build and rendered-route tests passed.
- Inventory API typecheck and production build passed.
- API service tests and Phase 2/3 database verifiers passed.
