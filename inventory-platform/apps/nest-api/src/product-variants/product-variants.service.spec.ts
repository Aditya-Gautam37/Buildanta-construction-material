import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import type { PrismaService } from "../database/prisma.service";
import { ProductVariantsService } from "./product-variants.service";
import { ProductStatus, PurchaseMode, UserRole, VariantStatus } from "@workspace/db";

describe("ProductVariantsService CRUD", () => {
  it("rejects invalid product and supplier relationships", async () => {
    const service = new ProductVariantsService({
      client: {
        product: { findUnique: jest.fn().mockResolvedValue(null) },
        supplier: { findUnique: jest.fn().mockResolvedValue({ id: "supplier-1" }) },
      },
    } as unknown as PrismaService);

    await expect(
      service.create({ productId: "missing", supplierId: "supplier-1", sku: "SKU" }, UserRole.ADMIN),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects variant creation from a role outside the catalogue group", async () => {
    const service = new ProductVariantsService({ client: {} } as unknown as PrismaService);

    await expect(
      service.create(
        { productId: "product-1", supplierId: "supplier-1", sku: "SKU" },
        UserRole.PROCUREMENT,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("returns a clear error when deleting a missing variant", async () => {
    const service = new ProductVariantsService({
      client: { productVariant: { findUnique: jest.fn().mockResolvedValue(null) } },
    } as unknown as PrismaService);

    await expect(service.remove("missing", UserRole.ADMIN)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects a catalogue-manager setting price or stock fields on variant creation", async () => {
    const service = new ProductVariantsService({ client: {} } as unknown as PrismaService);

    await expect(
      service.create(
        { productId: "product-1", supplierId: "supplier-1", sku: "SKU", price: 62 },
        UserRole.CATALOG_MANAGER,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.create(
        { productId: "product-1", supplierId: "supplier-1", sku: "SKU", stockQuantity: 10 },
        UserRole.DATA_ENTRY,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects a catalogue-manager setting price or stock fields on variant update", async () => {
    const service = new ProductVariantsService({ client: {} } as unknown as PrismaService);

    await expect(
      service.update("variant-1", { lowStockThreshold: 5 }, UserRole.CATALOG_MANAGER),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows a catalogue-manager to update non-financial variant fields", async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const service = new ProductVariantsService({
      client: { productVariant: { findUnique } },
    } as unknown as PrismaService);

    await expect(
      service.update("variant-1", { sku: "NEW-SKU" }, UserRole.CATALOG_MANAGER),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns a customer-safe public variant contract", async () => {
    const record = {
      id: "variant-1",
      productId: "product-1",
      supplierId: "supplier-1",
      sku: "STEEL-12MM",
      price: 62,
      attributes: { grade: "Fe500D", size: "12 mm" },
      unit: "kg",
      minimumOrderQuantity: 100,
      stockQuantity: 12,
      reservedQuantity: 10,
      lowStockThreshold: 5,
      stockTracked: true,
      inventoryBalances: [{
        physicalQuantity: 12,
        reservedQuantity: 10,
        blockedQuantity: 0,
        damagedQuantity: 0,
        quarantineQuantity: 0,
        lowStockThreshold: 5,
      }],
      status: VariantStatus.ACTIVE,
      supplier: { id: "supplier-1", name: "Private Supplier", email: "private@example.com" },
      product: { id: "product-1", name: "TMT Steel", status: ProductStatus.PUBLISHED, costPrice: 50 },
      images: [
        {
          id: "image-1",
          src: "https://example.com/steel.jpg",
          alt: "TMT steel",
          sortOrder: 0,
          primary: true,
        },
      ],
    };
    const findMany = jest.fn().mockResolvedValue([record]);
    const service = new ProductVariantsService({
      client: { productVariant: { findMany } },
    } as unknown as PrismaService);

    const publicResult = await service.findAll();
    const publicJson = JSON.stringify(publicResult);

    expect(publicJson).not.toContain("supplierId");
    expect(publicJson).not.toContain("Private Supplier");
    expect(publicJson).not.toContain("stockQuantity");
    expect(publicJson).not.toContain("reservedQuantity");
    expect(publicJson).not.toContain("lowStockThreshold");
    expect(publicJson).not.toContain("costPrice");
    expect(publicResult).toEqual([
      expect.objectContaining({
        id: "variant-1",
        availabilityStatus: "LOW_STOCK",
      }),
    ]);

    const internalResult = await service.findAllInventory();
    expect(JSON.stringify(internalResult)).toContain("Private Supplier");
    expect(JSON.stringify(internalResult)).toContain("stockQuantity");
  });
});

describe("ProductVariantsService purchase rules", () => {
  const existing = {
    id: "variant-1",
    productId: "product-1",
    supplierId: "supplier-1",
    minimumOrderQuantity: 10,
    quantityIncrement: 1,
    maxDirectQuantity: null,
    bulkQuoteThreshold: null,
    purchaseMode: PurchaseMode.QUOTE_ONLY,
    stockQuantity: 100,
    reservedQuantity: 0,
    product: { name: "TMT Steel", categories: [] },
  };

  function serviceFor(record: Record<string, unknown> = {}) {
    return new ProductVariantsService({
      client: {
        productVariant: { findUnique: jest.fn().mockResolvedValue({ ...existing, ...record }) },
        product: { findUnique: jest.fn().mockResolvedValue({ id: "product-1", minimumOrderQuantity: 10 }) },
        supplier: { findUnique: jest.fn().mockResolvedValue({ id: "supplier-1" }) },
      },
    } as unknown as PrismaService);
  }

  it("rejects a maximum direct quantity below the minimum order quantity", async () => {
    await expect(
      serviceFor().update(
        "variant-1",
        { purchaseMode: PurchaseMode.DIRECT_ONLY, maxDirectQuantity: 5 },
        UserRole.ADMIN,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects a bulk quote threshold on a direct-only variant", async () => {
    await expect(
      serviceFor().update(
        "variant-1",
        { purchaseMode: PurchaseMode.DIRECT_ONLY, bulkQuoteThreshold: 50 },
        UserRole.ADMIN,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects an unreachable bulk quote threshold above the maximum direct quantity", async () => {
    await expect(
      serviceFor().update(
        "variant-1",
        { purchaseMode: PurchaseMode.DIRECT_AND_QUOTE, maxDirectQuantity: 40, bulkQuoteThreshold: 90 },
        UserRole.ADMIN,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("leaves quote-only variants unconstrained by direct-purchase rules", async () => {
    await expect(
      serviceFor().update(
        "variant-1",
        { purchaseMode: PurchaseMode.QUOTE_ONLY, maxDirectQuantity: 1 },
        UserRole.ADMIN,
      ),
    ).rejects.not.toBeInstanceOf(BadRequestException);
  });
});
