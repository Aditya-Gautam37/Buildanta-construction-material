import { ForbiddenException } from "@nestjs/common";
import { UserRole } from "@workspace/db";
import type { PrismaService } from "../database/prisma.service";
import { SuppliersService } from "./suppliers.service";

describe("SuppliersService CRUD", () => {
  it("creates, updates, and deletes through Prisma", async () => {
    const create = jest.fn().mockResolvedValue({ id: "supplier-1" });
    const update = jest.fn().mockResolvedValue({ id: "supplier-1" });
    const remove = jest.fn().mockResolvedValue({ id: "supplier-1" });
    const service = new SuppliersService({
      client: { supplier: { create, update, delete: remove } },
    } as unknown as PrismaService);

    await service.create({ name: "Acme", email: "catalog@example.com" }, UserRole.ADMIN);
    await service.update("supplier-1", { name: "Acme Updated" }, UserRole.ADMIN);
    await service.remove("supplier-1", UserRole.ADMIN);

    expect(create).toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: "supplier-1" },
      data: {
        name: "Acme Updated",
        contactInfo: undefined,
        email: undefined,
        address: undefined,
      },
    });
    expect(remove).toHaveBeenCalledWith({ where: { id: "supplier-1" } });
  });

  it("rejects supplier writes from a role outside procurement", async () => {
    const service = new SuppliersService({ client: {} } as unknown as PrismaService);

    await expect(
      service.create({ name: "Acme", email: "catalog@example.com" }, UserRole.CATALOG_MANAGER),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.update("supplier-1", { name: "Acme Updated" }, UserRole.SALES),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.remove("supplier-1", UserRole.SUPPORT)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
