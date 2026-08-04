# Buildanta Website and Inventory Management  -  Updated Project Context

## 1. Project overview

**Buildanta Pvt. Ltd.** will be a construction-material discovery, quotation, sales and inventory-management platform serving homeowners, contractors, architects, builders and businesses.

The platform will help customers:

- Find construction materials
- Compare brands and specifications
- Check availability
- Request current prices and bulk quotations
- Estimate material requirements
- Contact Buildanta through phone or WhatsApp
- Arrange delivery to their construction site

Buildanta should support the customer from the foundation stage through finishing while giving the business a central dashboard for controlling products, prices, images, suppliers and inventory.

## 2. Business positioning

> **Buildanta is your trusted construction-material partner - from foundation to finish.**

Buildanta supplies genuine construction materials at competitive prices with expert assistance, transparent specifications, GST billing and dependable site delivery.

Initial focus:

- Kanpur Nagar, Uttar Pradesh
- PIN code-based product availability
- Local and nearby delivery
- Retail and bulk orders
- Contractors, homeowners and construction businesses

## 3. Platform components

The complete system will contain two connected applications.

### Customer website

The public website will allow customers to:

- Browse construction materials
- Search products
- Browse by category
- Browse by construction stage
- Browse by room or application
- View brands
- View product specifications and images
- Request the latest price
- Request bulk quotations
- Submit a bill of quantities
- Contact the supplier
- Use material calculators

### Inventory management dashboard

The private dashboard will allow authorized staff to:

- Add and edit products
- Organize the product catalogue
- Upload product images
- Update prices
- Manage stock
- Manage suppliers
- Control website visibility
- Review low-stock alerts
- Maintain an inventory audit history
- Publish changes to the customer website

## 4. Three-level catalogue structure

The inventory catalogue will use a three-level hierarchy.

```text
Level 1: Main Category
    \-- Level 2: Subcategory
            \-- Level 3: Product
```

Example:

```text
Steel & Structure
    \-- TMT Bars
            |-- Tata Tiscon Fe 550D  -  8 mm
            |-- Tata Tiscon Fe 550D  -  10 mm
            \-- Tata Tiscon Fe 550D  -  12 mm
```

Recommended Level 1 categories:

- Steel & Structure
- Cement & Masonry
- Sand & Aggregates
- Plumbing
- Electrical
- Tiles & Flooring
- Paints & Finishes
- Waterproofing
- Roofing
- Doors & Windows
- Sanitaryware & Bathware
- Hardware & Tools
- Construction Chemicals
- Safety Equipment

## 5. Catalogue-management behaviour

Every category, subcategory and product will be clickable inside the dashboard.

### Main-category editor

Staff can edit:

- Category name
- Category icon or image
- Description
- Display sequence
- Website visibility
- SEO title and description

### Subcategory editor

Staff can edit:

- Subcategory name
- Parent category
- Image
- Description
- Display sequence
- Website visibility
- SEO information

### Product editor

Staff can edit:

- Product name
- SKU or product code
- Brand
- Main category
- Subcategory
- Short description
- Detailed description
- Main image
- Additional gallery images
- Technical specifications
- Size, colour, grade and material
- Unit of measurement
- Minimum order quantity
- Purchase price
- Selling price
- Bulk price
- GST percentage
- Available stock
- Low-stock threshold
- Supplier
- Delivery availability
- Delivery time
- Return eligibility
- Featured-product status
- Draft, published, hidden or archived status

## 6. Product variants

One product may contain multiple variants.

Example:

```text
Product: Tata Tiscon Fe 550D TMT Bar

Variants:
- 8 mm
- 10 mm
- 12 mm
- 16 mm
- 20 mm
- 25 mm
```

Each variant can have its own:

- SKU
- Size
- Grade
- Unit
- Price
- Stock quantity
- Minimum order quantity
- Supplier
- Images
- Availability status

## 7. Inventory-management features

### Dashboard overview

The dashboard homepage should display:

- Total active products
- Total categories
- Total suppliers
- Total available stock
- Estimated inventory value
- Low-stock products
- Out-of-stock products
- Recent inventory changes
- Recently added products
- Pending quotation requests

### Stock management

Every stock transaction should record:

- Product and variant
- Quantity added or removed
- Previous stock
- Updated stock
- Transaction type
- Reason
- Supplier or customer reference
- Invoice or challan number
- Staff member
- Date and time

Transaction types:

- Stock purchased
- Stock received
- Customer sale
- Damaged stock
- Returned stock
- Manual correction
- Supplier return
- Reserved for order

The system should prevent stock from falling below zero unless an administrator explicitly authorizes it.

### Stock alerts

Products should show:

- **In stock**  -  sufficient quantity
- **Low stock**  -  below the configured threshold
- **Out of stock**  -  no available quantity
- **Reserved**  -  allocated to orders
- **Discontinued**  -  no longer supplied

## 8. Website and inventory connection

The customer website and inventory dashboard will use the same central product database.

```text
Administrator edits product
        v
Product information is validated
        v
Changes are saved to the database
        v
Published catalogue is updated
        v
Customer sees updated information
```

Changes to the following fields should automatically appear on the website:

- Product name
- Category
- Brand
- Images
- Description
- Specifications
- Price or "Request Price"
- Stock availability
- Available variants
- Delivery information
- Published status

Draft and hidden products must not appear publicly.

## 9. Website structure

### Header

- Buildanta logo
- Delivery location or PIN code
- Product search
- Shop products
- Browse by stage
- Material calculators
- Professionals
- Bulk quotation
- Help and support
- Login
- Cart or enquiry list
- Language selector
- Phone and WhatsApp actions

### Homepage sections

1. Main promotional banner
2. Shop by category
3. Browse by construction stage
4. Popular products
5. Request today's prices
6. Bulk-quotation form
7. Material calculators
8. Featured brands
9. Why choose Buildanta
10. Service areas
11. Customer reviews
12. Construction guides
13. Contact and support
14. Footer

## 10. Construction-stage navigation

Customers should also be able to browse materials by project stage.

### Planning

- Budget planning
- Quantity estimation
- Professional consultation
- Project checklist

### Foundation and structure

- Cement
- TMT steel
- Binding wire
- Sand
- Aggregate
- Blocks and bricks
- Waterproofing chemicals

### Walls and masonry

- Bricks
- AAC blocks
- Cement
- Plaster material
- Wall mesh

### Plumbing and electrical

- Pipes
- Fittings
- Water tanks
- Wires
- Switches
- Distribution boards

### Flooring and finishing

- Tiles
- Adhesives
- Grout
- Paint
- Putty
- Sanitaryware
- Doors and windows

## 11. Search and filtering

Customers should be able to filter products by:

- Category
- Subcategory
- Brand
- Construction stage
- Price range
- Size
- Grade
- Unit
- Stock availability
- Delivery location
- Application

Search should recognize product names, brands, SKUs and common terms such as "sariya," "TMT," "cement" and "waterproofing."

## 12. Quotation workflow

Because construction-material prices change frequently, Buildanta should initially use a catalogue-and-quotation model.

Customer process:

1. Select products
2. Enter required quantities
3. Provide delivery PIN code
4. Add the required delivery date
5. Upload a BOQ when available
6. Submit the quotation request
7. Receive a reference number
8. Get a response through phone, email or WhatsApp

Quotation statuses:

- New
- Under review
- Price requested from supplier
- Quotation prepared
- Sent to customer
- Accepted
- Rejected
- Converted to order
- Closed

## 13. Supplier management

Each supplier profile should include:

- Supplier or company name
- Contact person
- Phone
- Email
- GST number
- Address
- Supplied brands
- Supplied categories
- Purchase prices
- Payment terms
- Delivery lead time
- Minimum order quantity
- Active status
- Internal notes

Products and variants can be connected to one or more suppliers.

## 14. User roles and permissions

### Administrator

- Full system access
- Manage staff permissions
- Manage products and suppliers
- View prices and inventory value
- Publish or archive products
- View audit records

### Inventory manager

- Add and edit products
- Update stock
- Upload images
- Manage suppliers
- View inventory reports

### Catalogue editor

- Edit descriptions and images
- Manage categories
- Prepare products as drafts
- Cannot change stock or purchase prices

### Sales staff

- Review quotation requests
- Prepare customer quotations
- View selling prices and availability
- Reserve inventory

### Customer

- Browse products
- Request quotations
- Save products
- Track enquiries and orders

All protected permissions must be checked by the server, not only hidden in the interface.

## 15. Image management

Product image functionality should support:

- Main product image
- Multiple gallery images
- Image preview
- Replace image
- Remove image
- Change image sequence
- Alternative text
- File-size and format validation
- Optimized website images

Recommended formats:

- JPEG or WebP for product photographs
- PNG for transparent brand assets
- Maximum practical upload size of 5 MB
- Automatic resizing and compression

## 16. Calculators

The initial platform can include:

- Cement calculator
- TMT steel estimator
- Brick and block calculator
- Concrete-material calculator
- Tile calculator
- Paint calculator
- Flooring calculator

Calculator results should allow customers to add suggested quantities to a quotation request.

## 17. Reports

The inventory dashboard should eventually provide:

- Current stock report
- Low-stock report
- Out-of-stock report
- Stock-movement report
- Inventory valuation
- Supplier-wise inventory
- Category-wise inventory
- Fast-moving products
- Slow-moving products
- Quotation-conversion report
- Product-performance report

Reports should be filterable by date and exportable to CSV or Excel.

## 18. Essential policies

The website should contain:

- Privacy policy
- Cookie policy
- Terms and conditions
- Delivery policy
- Cancellation policy
- Return and refund policy
- Product disclaimer
- Pricing disclaimer
- GST and invoicing information

Prices should state whether GST and transportation are included.

## 19. Initial MVP priorities

The first release should focus on:

1. Three-level product catalogue
2. Category and subcategory management
3. Complete product editor
4. Product and variant image management
5. Price and inventory controls
6. Supplier management
7. Public catalogue synchronization
8. Search and filtering
9. Bulk-quotation requests
10. Phone and WhatsApp ordering
11. Low-stock alerts
12. Staff authentication and permissions
13. Inventory audit history

Cart, online payment, logistics automation and a professional marketplace can be added after the core catalogue and quotation workflow is operating reliably.

## 20. Success definition

The initial Buildanta platform will be successful when:

> An authorized staff member can create or edit a product - including its category, variants, images, price, supplier and stock - and publish it so that a customer can immediately discover the correct information and submit a quotation request.