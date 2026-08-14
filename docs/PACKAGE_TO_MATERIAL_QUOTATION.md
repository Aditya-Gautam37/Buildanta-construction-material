# Package enquiry → material quotation

How a contractor package enquiry can become a Buildanta material requirement,
and why that handoff is documented here rather than shipped as a button.

## The intended journey

```
contractor package
  → customer enters project details
  → detailed quotation request        (built — PackageEnquiry)
  → Buildanta reviews the enquiry     (built — admin enquiry list)
  → optional material requirement     (NOT built — see below)
  → existing bulk quote process       (already exists — QuoteRequest → Quotation)
```

The first four steps work today. The fifth is deliberately unbuilt.

## Why there is no "create material quotation" button yet

The existing quotation domain models **material** commerce:

- `QuoteRequest` requires `email`, `company`, a single `quantity`, and
  `deliveryPincode`. A package enquiry has none of those as required fields:
  email is optional, there is no company, and "quantity" is meaningless for a
  whole-house construction package.
- `Quotation` links back through `sourceQuoteRequestId` or `sourceCartId`. There
  is **no field that can reference a professional or a package**, so a quotation
  created from an enquiry would lose its origin the moment it was saved.

A button that silently dropped that link, or invented a `company` and a
`quantity` to satisfy the schema, would look like an integration while quietly
producing bad records. The prompt for this work asked for exactly the opposite:
document the boundary rather than fake it.

## What is already preserved to make it possible

The enquiry and package data deliberately keep everything a future handoff
would need:

| Available | Where |
| --- | --- |
| Customer name, phone, optional email | `PackageEnquiry` |
| Project location, plot dimensions, area, floors | `PackageEnquiry` |
| Rate, package name and amount **as shown at submission** | `PackageEnquiry` snapshot fields |
| Which trades the package covers | `ContractorPackageInclusion.category` (fixed vocabulary) |
| Allowances, e.g. "tiles up to ₹40/sq ft" | `ContractorPackageInclusion.allowanceAmount/Unit` |
| Material specifications and preferred brands | `ContractorPackageMaterial` |

The inclusion **categories** are the important part. Because they come from a
fixed vocabulary rather than free text, a future step can map a trade to a
Buildanta product category — `FLOORING` to tiles, `ELECTRICAL` to wiring — which
would be impossible if the works were only prose.

## What building it would require

1. **A link field.** Add `sourcePackageEnquiryId` to `Quotation`, or an explicit
   join table. Without it the origin is lost.
2. **Relaxed requirements on the material side**, or a separate creation path
   that does not demand `company` and a single `quantity`.
3. **A decision about quantities.** Package text says "floor tiles up to
   ₹40/sq ft", not "480 sq ft of tiles". Quantities must come from the customer's
   drawings or a staff estimate — **never derived from marketing copy**. That is
   a judgement call, not a calculation.
4. **An admin action** on the enquiry: "Raise material requirement", prefilling
   customer details and the trades from the package's inclusion categories, for
   staff to complete.

## Interim procedure

Until the above exists, staff handle it manually:

1. Open the enquiry in **Professionals → Package enquiries**.
2. Note the reference (`PKG-…`), customer details, area and package.
3. Create a bulk quote request through the existing flow, quoting the enquiry
   reference in the notes so the two can be reconciled by hand.
4. Move the enquiry to `QUOTATION_PREPARED`.

The reference is the thread between the two systems, and it is why every
enquiry has one.

## What this must never become

Do not auto-generate material quantities from package inclusions. A package
advertises scope and allowances; it does not describe a bill of materials. A
generated quantity would look authoritative and be wrong, which is worse than
having no number at all.
