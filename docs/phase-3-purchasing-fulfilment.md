# Phase 3 - Purchasing and fulfilment

Implemented on 2026-08-03 across the existing Inventory API, Inventory Management workspace and Supabase PostgreSQL database.

## Connected workflows

```text
Requisition -> approval -> supplier RFQ -> supplier comparison -> approved PO
-> goods receipt and quality split -> location balance and stock ledger

Accepted sales order -> picking list -> dispatch and delivery challan
-> reservation and physical stock consumption -> proof of delivery
-> customer return -> quarantine -> inspection -> restock/damage/reject
-> replacement or credit-note resolution
```

The Inventory API remains the only business-control layer. The `/fulfilment` page calls protected API actions and does not write database tables directly.

## Database

Additive migrations:

- `20260803230000_purchasing_fulfilment_workflow`
- `20260803231500_phase3_stock_ledger_states`

They add requisitions, RFQs and responses, purchase orders and approval history, goods receipts and quality quantities, batch/lot fields, supplier returns, picking lists, delivery schedules, dispatches, challans, status history, proof of delivery, customer returns, inspections, replacements and credit notes. Existing rows and Phase 0-2 models remain intact.

All 27 Phase 3 tables have RLS enabled and no grants for Supabase `anon` or `authenticated` roles.

## Stock rules

- Posted goods receipts increase the selected location balance and create a `GOODS_RECEIPT` ledger entry in one serializable transaction.
- Accepted, rejected and damaged receipt quantities must exactly equal received quantity.
- Rejected receipt stock enters quarantine; damaged stock enters the damaged bucket.
- Dispatch requires an active matching reservation and sufficient physical and reserved stock.
- Posting dispatch decreases physical and reserved quantities, consumes completed reservations and creates `DISPATCH` ledger entries atomically.
- Customer returns increase physical and quarantine stock on receipt.
- Inspection must reconcile the entire received return. Restock exits quarantine, damaged material moves to damaged, and rejected material moves to blocked.
- Supplier returns can consume only the matching damaged or quarantine bucket.
- Every inventory movement stores its business-document reference and actor.

## Verified vertical data

The idempotent development seed now creates and connects:

- two labelled Kanpur demonstration yards and one fulfilment partner
- an approved purchase requisition
- a closed supplier RFQ with supplier response
- a received purchase order
- a posted goods receipt with accepted, rejected and damaged quantities
- a picking list from an accepted sales order
- a delivered dispatch with delivery challan and proof of delivery
- a resolved customer return that passed through quarantine and inspection
- an approved replacement linked to the returned order line

All seeded operational records use deterministic `DEMO-*` references and invalid example email domains. Rerunning the seed preserves operational stock buckets and does not duplicate orders, reservations, ledger entries, dispatches or returns.

The `/fulfilment` workspace fits a 360 px viewport without horizontal overflow and produced no browser console errors.

Run `pnpm db:verify-phase3` from `inventory-platform` to verify the exact demonstration document chain, ledger before/after reconciliation, non-negative balances, RLS and browser-role grants.

## Rollback

Application rollback can deploy the previous API and Inventory builds because the migrations are additive. Do not drop Phase 3 tables or enum values after operational documents exist; export and reconcile purchasing, delivery, return and stock-ledger history first.
