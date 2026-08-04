import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import type { PrismaService } from "../database/prisma.service";
import { ProductsService } from "./products.service";
import { ProductStatus, UserRole, VariantStatus } from "@workspace/db";

describe("ProductsService", () => {
  it("requires category, stage, and room relationships", async () => {
    const service = new ProductsService({ client: {} } as PrismaService);
    await expect(
      service.create({ name: "Incomplete", brandId: "brand" }, UserRole.ADMIN),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects product creation from a role outside the catalogue group", async () => {
    const service = new ProductsService({ client: {} } as PrismaService);
    await expect(
      service.create({ name: "Incomplete", brandId: "brand" }, UserRole.SALES),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("removes variants before deleting the product", async () => {
    const findUnique = jest.fn().mockResolvedValue({ id: "product-1" });
    const deleteMany = jest.fn().mockResolvedValue({ count: 1 });
    const deleteProduct = jest.fn().mockResolvedValue({ id: "product-1" });
    const transaction = jest.fn(async (operation: (client: unknown) => Promise<void>) =>
      operation({
        product: { findUnique, delete: deleteProduct },
        productVariant: { deleteMany },
      }),
    );
    const service = new ProductsService({
      client: { $transaction: transaction },
    } as unknown as PrismaService);

    await service.remove("product-1", UserRole.ADMIN);

    expect(deleteMany).toHaveBeenCalledWith({ where: { productId: "product-1" } });
    expect(deleteProduct).toHaveBeenCalledWith({ where: { id: "product-1" } });
  });

  it("rejects product deletion from a role outside the catalogue group", async () => {
    const service = new ProductsService({ client: {} } as PrismaService);
    await expect(service.remove("product-1", UserRole.WAREHOUSE_MANAGER)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("rejects a catalogue-manager setting a price field on creation", async () => {
    const service = new ProductsService({ client: {} } as PrismaService);
    await expect(
      service.create({ name: "Cement", brandId: "brand", sellingPrice: 400 }, UserRole.CATALOG_MANAGER),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects a catalogue-manager setting a price field on update, even alongside a non-financial edit", async () => {
    const service = new ProductsService({ client: {} } as PrismaService);
    await expect(
      service.update("product-1", { name: "Renamed", costPrice: 300 }, UserRole.CATALOG_MANAGER),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows a catalogue-manager to update non-financial fields without touching price", async () => {
    const findUnique = jest.fn().mockResolvedValue({ id: "product-1" });
    const update = jest.fn().mockResolvedValue({ id: "product-1", name: "Renamed" });
    const service = new ProductsService({
      client: { product: { findUnique, update } },
    } as unknown as PrismaService);

    await service.update("product-1", { name: "Renamed" }, UserRole.CATALOG_MANAGER);

    expect(update).toHaveBeenCalled();
  });

  it("allows admin to set price fields during update", async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const service = new ProductsService({
      client: { product: { findUnique } },
    } as unknown as PrismaService);

    await expect(
      service.update("product-1", { sellingPrice: 400 }, UserRole.ADMIN),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects finance from updating a product it has no catalogue-write access to", async () => {
    const service = new ProductsService({ client: {} } as PrismaService);
    await expect(
      service.update("product-1", { sellingPrice: 400 }, UserRole.FINANCE),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("keeps exact stock, suppliers, and costs out of the public catalogue", async () => {
    const record = {
      id: "product-1",
      name: "Buildanta Cement",
      description: "General construction cement",
      status: ProductStatus.PUBLISHED,
      unit: "bag",
      minimumOrderQuantity: 10,
      sellingPrice: 380,
      costPrice: 310,
      bulkPrice: 360,
      gstPercent: 28,
      deliveryInfo: "Confirmed after pincode review",
      brand: { name: "Buildanta" },
      keySpecifications: ["50 kg"],
      stages: [{ name: "Foundation & Structure" }],
      rooms: [],
      updatedAt: new Date("2026-08-03T00:00:00.000Z"),
      categories: [{ id: "category-1", name: "Cement", slug: "cement" }],
      reviews: [],
      variants: [
        {
          sku: "CEMENT-50",
          price: 380,
          unit: "bag",
          stockQuantity: 120,
          reservedQuantity: 20,
          lowStockThreshold: 10,
          stockTracked: true,
          status: VariantStatus.ACTIVE,
          supplier: { name: "Private Supplier" },
          inventoryBalances: [{
            physicalQuantity: 120,
            reservedQuantity: 20,
            blockedQuantity: 0,
            damagedQuantity: 0,
            quarantineQuantity: 0,
            lowStockThreshold: 10,
          }],
        },
      ],
      images: [],
    };
    const findMany = jest.fn().mockResolvedValue([record]);
    const service = new ProductsService({
      client: { product: { findMany } },
    } as unknown as PrismaService);

    const publicResult = await service.findAll();
    const publicJson = JSON.stringify(publicResult);

    expect(publicJson).not.toContain("costPrice");
    expect(publicJson).not.toContain("stockQuantity");
    expect(publicJson).not.toContain("reservedQuantity");
    expect(publicJson).not.toContain("lowStockThreshold");
    expect(publicJson).not.toContain("Private Supplier");
    expect(publicResult).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "product-1",
          availabilityStatus: "IN_STOCK",
        }),
      ]),
    );

    const internalResult = await service.findAllInventory();
    expect(JSON.stringify(internalResult)).toContain("stockQuantity");
    expect(JSON.stringify(internalResult)).toContain("Private Supplier");
  });
});
