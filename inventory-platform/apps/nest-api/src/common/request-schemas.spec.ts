import { inventoryBalanceAdjustmentSchema, productCreateSchema, quotationCreateSchema, serviceAreaCreateSchema, stockTransferCreateSchema, supplierCreateSchema, supplierSubmissionSchema, variantCreateSchema } from "./request-schemas";

describe("API request schemas", () => {
  it("rejects a product without a name", () => {
    expect(productCreateSchema.safeParse({ brandId: "brand-1" }).success).toBe(false);
  });

  it("rejects negative variant prices and non-URL images", () => {
    const result = variantCreateSchema.safeParse({
      productId: "product-1",
      supplierId: "supplier-1",
      sku: "SKU-1",
      price: -1,
      imageUrls: ["not-a-url"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed supplier email addresses", () => {
    expect(supplierCreateSchema.safeParse({ name: "Supplier", email: "invalid" }).success).toBe(false);
  });

  it("requires valid PIN codes for service areas", () => {
    expect(serviceAreaCreateSchema.safeParse({
      code: "KANPUR",
      name: "Kanpur",
      city: "Kanpur",
      state: "Uttar Pradesh",
      pincodes: ["2080"],
    }).success).toBe(false);
  });

  it("requires a real inventory change and different transfer locations", () => {
    expect(inventoryBalanceAdjustmentSchema.safeParse({
      variantId: "variant-1",
      fulfilmentLocationId: "location-1",
      reason: "No-op",
    }).success).toBe(false);
    expect(stockTransferCreateSchema.safeParse({
      reference: "TR-1",
      originLocationId: "location-1",
      destinationLocationId: "location-1",
      items: [{ variantId: "variant-1", quantity: 2 }],
    }).success).toBe(false);
  });

  it("validates a complete multi-item quotation instead of free text", () => {
    expect(quotationCreateSchema.safeParse({
      name: "Aditi Builder",
      email: "builder@example.com",
      phone: "9999999999",
      deliveryPincode: "208001",
      items: [
        { productId: "product-1", variantId: "variant-1", description: "Cement", quantity: 20, unitCode: "bag" },
        { productId: "product-2", variantId: "variant-2", description: "TMT bar", quantity: 40, unitCode: "piece" },
      ],
    }).success).toBe(true);
    expect(quotationCreateSchema.safeParse({ name: "A", email: "bad", phone: "1", deliveryPincode: "2080", items: [] }).success).toBe(false);
  });

  const validSupplierSubmission = {
    reference: "LP-260801-DEMO01", contactName: "Demo Supplier", email: "supplier@example.com", phone: "9999999999",
    company: "Buildanta Supply", productName: "Cement", brand: "Buildanta Pro", category: "Cement", unit: "bag",
    price: 385, stock: 100, description: "Demo listing", imageUrl: "https://example.com/cement.png",
  };

  it("accepts a complete supplier submission", () => {
    expect(supplierSubmissionSchema.safeParse(validSupplierSubmission).success).toBe(true);
  });

  it("rejects a supplier submission with a malformed listing reference", () => {
    expect(supplierSubmissionSchema.safeParse({ ...validSupplierSubmission, reference: "bad" }).success).toBe(false);
  });

  it("rejects a supplier submission missing required fields", () => {
    const incomplete: Partial<typeof validSupplierSubmission> = { ...validSupplierSubmission };
    delete incomplete.description;
    expect(supplierSubmissionSchema.safeParse(incomplete).success).toBe(false);
  });

  it("rejects a supplier submission with a negative price or a non-URL image", () => {
    expect(supplierSubmissionSchema.safeParse({ ...validSupplierSubmission, price: -1 }).success).toBe(false);
    expect(supplierSubmissionSchema.safeParse({ ...validSupplierSubmission, imageUrl: "not-a-url" }).success).toBe(false);
  });
});
