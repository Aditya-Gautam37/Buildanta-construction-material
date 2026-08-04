# Buildanta Inventory Improvement Implementation Plan

## 1. Purpose

This document defines how Buildanta should improve its current catalogue-and-stock system into a reliable construction-material inventory, quotation, purchasing, fulfilment, and reporting platform.

The plan uses useful operating ideas visible in Tata Steel Aashiyana's public customer journey, particularly its connection between customer location, serviceable products, dealers, delivery, orders, and after-sales support. Aashiyana's private inventory and ERP implementation is not publicly visible, so this plan does not attempt to copy unverified internal technology.

Buildanta should remain quotation-first during the initial release because construction-material prices, transport costs, supplier availability, and delivery conditions frequently require confirmation.

## 2. Current Buildanta position

Buildanta already provides a strong foundation:

- Product, category, subcategory, brand, room, and construction-stage management
- Product variants, SKUs, prices, GST, units, specifications, and images
- Supplier records and product-to-supplier relationships
- Draft and published catalogue control
- Public storefront catalogue synchronization
- Physical, reserved, and available-stock calculation
- Low-stock thresholds
- Audited stock adjustments with actor, reason, reference, and timestamp
- Customer quotation requests and staff status management
- Supplier product submissions
- Staff authentication and server-side authorization
- Homepage and professional-directory management

The main limitation is that stock is currently managed primarily at variant level. A mature construction-material platform must connect inventory to warehouses, suppliers, dealers, purchase documents, sales orders, delivery operations, returns, and financial valuation.

## 3. Target operating model

The target end-to-end workflow is:

```text
Supplier quotation
      |
Purchase order
      |
Goods receipt and quality check
      |
Location-wise inventory
      |
Public serviceability and availability
      |
Customer quotation request
      |
Commercial quotation and approval
      |
Sales order and stock reservation
      |
Picking, dispatch, and delivery challan
      |
Delivery confirmation and invoice
      |
Returns, replacements, and reporting
```

### Customer journey

```text
Customer enters delivery PIN code
              |
System identifies serviceable warehouses or partners
              |
Customer sees serviceable products and availability status
              |
Customer selects products, variants, quantities, and required date
              |
System creates a multi-item quotation request
              |
Sales staff confirms stock, supplier price, freight, GST, and margin
              |
Customer receives a time-limited quotation
              |
Accepted quotation becomes a sales order
              |
Stock is reserved and fulfilled
              |
Customer receives delivery and status updates
```

### Purchase and replenishment journey

```text
Low-stock or demand signal
          |
Purchase requisition
          |
Supplier RFQ and comparison
          |
Approved purchase order
          |
Goods receipt note
          |
Batch, quantity, and quality verification
          |
Warehouse inventory update
          |
Supplier invoice and payment tracking
```

## 4. Core implementation principles

1. Inventory must be location-specific, not only product-specific.
2. Every stock change must reference a business document or an approved adjustment.
3. Physical, reserved, blocked, damaged, incoming, and available stock must remain separate.
4. Products shown publicly must be filtered by publication status and delivery serviceability.
5. Prices must include validity, customer segment, location, quantity, and cost context.
6. Accepted quotations must create controlled orders and reservations.
7. High-risk actions must require server-side permission checks and, where appropriate, approval.
8. Stock and financial history must be immutable and auditable.
9. Customer-facing availability must never make an unverified stock promise.
10. Online payment should be added only after purchasing, orders, reservations, and fulfilment are reliable.

## 5. Required domain modules

### 5.1 Material master

Each product variant should support:

- SKU and optional barcode/QR code
- HSN code and GST percentage
- Brand, category, and subcategory
- Grade, size, colour, finish, and technical attributes
- Base unit and permitted transaction units
- Unit-conversion factors
- Approximate and actual weight rules
- Minimum order quantity and quantity increment
- Purchase, retail, contractor, dealer, and bulk prices
- Minimum permitted selling price or margin
- Reorder point and safety stock
- Preferred suppliers
- Storage requirements
- Return and replacement policy
- Draft, published, hidden, archived, and discontinued states

Controlled unit examples include:

- Cement: bag, kilogram, tonne
- Steel: piece, metre, kilogram, tonne
- Tiles: piece, box, square foot, square metre
- Sand and aggregate: cubic foot, cubic metre, tonne
- Paint: litre, bucket
- Electrical wire: metre, coil

### 5.2 Warehouses and service areas

Add support for:

- Multiple warehouses, yards, shops, and project sites
- Warehouse zones, racks, bins, and open-yard locations
- PIN-code coverage
- Delivery radius
- Minimum order value
- Delivery charge rules
- Estimated lead time
- Location-level stock balances
- Inter-location stock transfers
- Goods in transit
- Transfer receipt and discrepancy handling

### 5.3 Suppliers, dealers, and fulfilment partners

These roles must be modeled separately:

- **Supplier:** sells material to Buildanta
- **Warehouse:** stores Buildanta-owned material
- **Dealer or fulfilment partner:** fulfils a customer order
- **Carrier:** transports material

Supplier and partner profiles should include:

- GSTIN, PAN, addresses, and contacts
- Payment and credit terms
- Serviceable PIN codes
- Supplied products, variants, brands, and categories
- Supplier SKU
- Current and historical prices
- Minimum order quantity
- Delivery lead time
- Available or confirmed quantity
- Quality rating
- On-time delivery rating
- Active, blocked, or inactive status

### 5.4 Purchasing

Implement:

- Purchase requisition
- Supplier request for quotation
- Supplier price comparison
- Purchase order
- Purchase-order approval
- Goods receipt note
- Quantity and quality discrepancies
- Purchase return
- Supplier invoice
- Payment status

Stock should normally increase through an approved goods receipt rather than an unrestricted manual adjustment.

### 5.5 Stock operations

The inventory ledger should support:

- Purchase receipt
- Customer sale
- Stock reservation
- Reservation release
- Warehouse transfer out and transfer in
- Customer return
- Supplier return
- Damage and wastage
- Stock-count correction
- Administrative correction
- Opening balance

The primary availability calculation should be:

```text
Available stock =
physical stock
- reserved stock
- blocked stock
- damaged stock
```

Available-to-promise may additionally consider confirmed incoming inventory that will arrive before the customer's required date.

### 5.6 Batch and lot tracking

Use batch tracking for cement, paint, tiles, adhesives, waterproofing products, chemicals, and other date-, colour-, shade-, or quality-sensitive materials.

Store:

- Batch or lot number
- Manufacturing date
- Expiry or best-before date
- Supplier and goods receipt
- Received and remaining quantity
- Warehouse location
- Quality status
- Tile shade or production run where applicable

Use FIFO or FEFO allocation where required.

### 5.7 Quotations and sales orders

The quotation module should support:

- Multiple items per quotation
- Quantity, unit, requested brand, and acceptable alternatives
- Delivery location and required date
- Supplier or warehouse allocation suggestions
- Product, freight, loading, unloading, GST, and other charges
- Discount and margin validation
- Quote revisions and version history
- Valid-from and valid-until dates
- Internal notes and customer notes
- Approval workflow
- Customer acceptance or rejection
- Conversion to sales order

Recommended quotation statuses:

```text
NEW
UNDER_REVIEW
AWAITING_SUPPLIER_PRICE
PREPARED
PENDING_APPROVAL
SENT
ACCEPTED
REJECTED
EXPIRED
CONVERTED_TO_ORDER
CLOSED
```

### 5.8 Reservations and fulfilment

An accepted quotation should create a sales order and reservations in one database transaction.

Implement:

- Sales order and sales-order items
- Reservation by warehouse, batch, and variant
- Reservation expiry
- Partial fulfilment
- Picking list
- Loading record
- Delivery challan
- Dispatch
- Vehicle and carrier details
- Delivery schedule
- Proof of delivery
- Customer invoice reference

### 5.9 Returns, damage, and replacement

Implement separate operational records for:

- Customer cancellation
- Customer return
- Replacement request
- Delivery shortage
- Incorrect size or quantity
- Transit damage
- Warehouse damage
- Supplier return
- Credit note

Each claim should store evidence, inspection results, approval history, responsible party, stock disposition, and financial resolution.

### 5.10 Pricing and valuation

Support:

- Latest purchase price
- Landed cost
- Weighted-average cost or FIFO valuation
- Retail, contractor, dealer, and project pricing
- Location-specific pricing
- Quantity-break pricing
- Price validity dates
- Freight and handling charges
- Minimum selling price
- Manager approval below margin threshold

Suggested landed-cost formula:

```text
Landed cost =
purchase price
+ freight
+ loading and unloading
+ insurance and other charges
- supplier discount
```

### 5.11 Stock counting and reconciliation

Add:

- Stock-count sessions
- Warehouse and zone scope
- Cycle counting
- Count assignments
- Physical quantity entry
- System-versus-physical variance
- Evidence and notes
- Approval thresholds
- Reconciliation posting
- Count history

### 5.12 Reporting

Minimum operational reports:

- Current stock by warehouse
- Physical, reserved, blocked, and available stock
- Low-stock and out-of-stock materials
- Incoming inventory
- Stock movement
- Stock ageing
- Inventory valuation
- Fast-, slow-, and non-moving products
- Open purchase orders
- Pending goods receipts
- Supplier price comparison
- Supplier delivery and quality performance
- Quote pipeline and conversion
- Quote response time
- Open and delayed sales orders
- Dispatch and delivery performance
- Gross margin
- Stock-count variance
- User activity and approvals

Reports should support filters and CSV/Excel export.

## 6. Recommended data-model additions

Suggested new entities:

```text
UnitOfMeasure
UnitConversion

Warehouse
WarehouseLocation
ServiceArea
PincodeCoverage

InventoryBalance
InventoryBatch
InventoryReservation
StockTransfer
StockTransferItem
StockCount
StockCountItem

SupplierProduct
SupplierPrice
SupplierServiceArea

Dealer
DealerProduct
DealerInventory
DealerServiceArea

PurchaseRequisition
PurchaseRequisitionItem
SupplierQuotation
SupplierQuotationItem
PurchaseOrder
PurchaseOrderItem
GoodsReceipt
GoodsReceiptItem
PurchaseReturn

QuotationItem
QuotationRevision
QuotationStatusHistory

SalesOrder
SalesOrderItem
DeliverySchedule
PickingList
Dispatch
DeliveryChallan
ProofOfDelivery

ReturnRequest
ReturnItem
Replacement
CreditNote

PriceList
PriceListItem
ApprovalRequest
Notification
```

Existing `ProductVariant`, `StockTransaction`, `Supplier`, and `QuoteRequest` models should be extended carefully through migrations rather than replaced destructively.

## 7. Authorization model

Recommended roles:

- Administrator
- Catalogue manager
- Purchase manager
- Warehouse manager
- Stock operator
- Sales executive
- Sales manager
- Accountant
- Auditor
- Management read-only user

Permissions should be checked on the server. Example permissions:

```text
product.create
product.edit
product.publish
purchase.create
purchase.approve
goods.receive
stock.transfer
stock.adjust
stock.adjust.approve
price.view_cost
price.override
quotation.prepare
quotation.approve
order.dispatch
report.export
user.manage
```

High-value purchase orders, manual stock corrections, below-margin quotes, refunds, and credit notes should require approval.

## 8. Customer-facing availability states

Do not expose an unverified numeric stock count publicly. Use truthful states:

- In stock
- Limited stock
- Available from partner
- Available in a stated lead time
- Price and availability on request
- Not serviceable for this PIN code
- Temporarily unavailable

Public availability must be derived from location, publication status, active variant status, stock balance, reservations, partner confirmation, and delivery rules.

## 9. Implementation roadmap

### Phase 1: Trustworthy location-aware inventory

Scope:

- Controlled units and conversions
- Warehouses and storage locations
- PIN-code service areas
- Location-wise inventory balances
- Blocked and damaged stock
- Stock transfers
- Stock counts and reconciliation
- Supplier-product relationships, prices, and lead times

Exit criteria:

- Every tracked quantity belongs to a location.
- Staff can transfer stock without losing auditability.
- The system can identify which locations can serve a PIN code.
- Unit conversions are validated and consistently applied.
- Physical counts can be reconciled through approval.

### Phase 2: Complete commercial quotation workflow

Scope:

- Multi-item quotations
- Quote revisions and validity
- Freight, GST, and landed-cost inputs
- Supplier and warehouse allocation suggestions
- Margin checks
- Quote approval
- Customer acceptance
- Accepted quote to sales order
- Expiring inventory reservations

Exit criteria:

- Sales can prepare and send a complete commercial quotation.
- Below-margin quotes require approval.
- Accepting a quotation creates an order and valid reservations atomically.
- Expired or rejected quotations release reservations.

### Phase 3: Purchasing and fulfilment

Scope:

- Purchase requisitions
- Supplier comparison
- Purchase orders and approvals
- Goods receipts and discrepancies
- Batch tracking
- Picking and loading
- Delivery challans
- Dispatch and proof of delivery
- Returns and replacements

Exit criteria:

- Normal stock receipts originate from approved purchase orders and GRNs.
- Every customer issue references a sales order and dispatch.
- Every return has an operational and financial disposition.

### Phase 4: Customer project experience

Scope:

- PIN-code-first catalogue
- Enquiry basket/cart
- Saved projects
- Material calculators
- Project planner
- Expense tracker
- Order and quotation tracking
- WhatsApp, email, and in-app notifications

Exit criteria:

- Customers receive only serviceable product and delivery information.
- Calculator results can be added to a quotation.
- Customers can track quotations and orders without contacting staff.

### Phase 5: Payments and partner marketplace

Scope:

- Payment gateway
- Payment terms and credit limits
- Dealer selection
- Partner inventory confirmation
- Split fulfilment
- Refund automation
- Offers and promotions
- Dealer portal

Exit criteria:

- Payments, inventory reservations, orders, refunds, and accounting references remain consistent during success and failure scenarios.
- Partners can update controlled availability without receiving unrestricted access to Buildanta-owned inventory.

## 10. Suggested delivery priority

| Priority | Work item | Reason |
|---|---|---|
| P0 | Warehouses and location-wise stock | Current quantity has no physical fulfilment context |
| P0 | Controlled units and conversions | Prevents serious quantity errors across steel, cement, tiles, and aggregates |
| P0 | Quote-to-order and reservation expiry | Converts demand into controlled fulfilment and prevents permanently blocked stock |
| P0 | Purchase order and GRN | Connects stock receipts to authorized business documents |
| P1 | PIN-code serviceability | Enables truthful customer availability and delivery promises |
| P1 | Supplier prices and lead times | Enables sourcing and quotation decisions |
| P1 | Picking, dispatch, and challan | Completes order fulfilment |
| P1 | Stock count and reconciliation | Keeps system stock aligned with physical stock |
| P1 | Batch and expiry tracking | Required for chemicals, cement, paint, tiles, and related materials |
| P2 | Returns, replacements, and credit notes | Controls after-sales stock and financial effects |
| P2 | Valuation and margin reporting | Improves pricing and profitability control |
| P2 | Calculators and project planner | Improves customer acquisition and quotation quality |
| P3 | Online payment and dealer portal | Add only after inventory and orders are reliable |

## 11. Testing requirements

Automated tests should cover:

- Unit conversions and rounding
- No negative physical or available stock
- Concurrent reservations
- Reservation expiry and release
- Warehouse transfers
- Purchase receipt posting
- Batch allocation
- Quote revisions and approvals
- Below-margin authorization
- Quote-to-order conversion
- Partial dispatch
- Cancellation before and after dispatch
- Customer and supplier returns
- PIN-code serviceability
- Unauthorized API access
- Audit records for every mutation

Required end-to-end scenario:

```text
Create supplier
  -> create purchase order
  -> receive stock into a warehouse
  -> publish product
  -> discover product for a serviceable PIN code
  -> submit quotation
  -> approve quotation
  -> convert to sales order
  -> reserve stock
  -> dispatch material
  -> confirm delivery
  -> verify inventory and margin reports
```

## 12. Production readiness

Before launch:

- Run migrations on a clean staging database.
- Complete database-backed integration and end-to-end tests.
- Add rate limiting to authentication and expensive public endpoints.
- Verify all permission boundaries.
- Configure structured logs, error monitoring, and alerts.
- Automate database and object-storage backups.
- Perform and document a restore drill.
- Define incident and migration rollback/forward-fix procedures.
- Verify mobile, keyboard, accessibility, empty, error, and slow-network states.
- Document known limitations and operational responsibilities.

## 13. Success measures

Track:

- Inventory accuracy percentage
- Stock-count variance
- Quote response time
- Quote-to-order conversion rate
- Reservation expiry rate
- Order fulfilment time
- On-time delivery percentage
- Supplier on-time delivery and defect rate
- Stockout frequency
- Slow-moving inventory value
- Gross margin by product, category, and order
- Return and replacement rate
- Percentage of stock movements linked to approved documents

## 14. Recommended first release target

The next major release should deliver this complete vertical slice:

> An authorized employee can purchase a material, receive it into a specific warehouse, publish its serviceable availability, prepare a profitable customer quotation, convert the accepted quotation into a sales order, reserve and dispatch the correct stock, and produce an auditable inventory and margin report.

After this flow is stable, Buildanta can safely expand into customer payments, partner inventory, split fulfilment, calculators, project planning, and advanced marketplace features.

## 15. Reference pages

- Tata Steel Aashiyana: <https://aashiyana.tatasteel.com/in/en.html>
- Sales policy: <https://aashiyana.tatasteel.com/in/en/help-support/sales-policy.html>
- Help and support: <https://aashiyana.tatasteel.com/in/en/help-support.html>
- Return policy: <https://aashiyana.tatasteel.com/in/en/help-support/return-policy.html>
- Shipping policy: <https://aashiyana.tatasteel.com/in/en/help-support/shipping-policy..html>
- Project planner: <https://aashiyana.tatasteel.com/in/en/design-and-calculators/project-planner.html>

