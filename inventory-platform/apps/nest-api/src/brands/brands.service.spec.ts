import { ForbiddenException } from "@nestjs/common";
import { UserRole } from "@workspace/db";
import type { PrismaService } from "../database/prisma.service";
import { BrandsService } from "./brands.service";

describe("BrandsService CRUD", () => {
  it("creates, updates, and deletes through Prisma", async () => {
    const create = jest.fn().mockResolvedValue({ id: "brand-1" });
    const update = jest.fn().mockResolvedValue({ id: "brand-1" });
    const remove = jest.fn().mockResolvedValue({ id: "brand-1" });
    const service = new BrandsService({
      client: { brand: { create, update, delete: remove } },
    } as unknown as PrismaService);

    await service.create({ name: "Tata", slug: "tata" }, UserRole.ADMIN);
    await service.update("brand-1", { name: "Tata Steel", slug: "tata-steel" }, UserRole.ADMIN);
    await service.remove("brand-1", UserRole.ADMIN);

    expect(create).toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { id: "brand-1" },
      data: {
        name: "Tata Steel",
        slug: "tata-steel",
        logo: undefined,
        description: undefined,
        website: undefined,
      },
    });
    expect(remove).toHaveBeenCalledWith({ where: { id: "brand-1" } });
  });

  it("rejects brand writes from a role outside the catalogue group", async () => {
    const service = new BrandsService({ client: {} } as unknown as PrismaService);

    await expect(
      service.create({ name: "Tata", slug: "tata" }, UserRole.PROCUREMENT),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.update("brand-1", { name: "Tata Steel", slug: "tata-steel" }, UserRole.SALES),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.remove("brand-1", UserRole.SUPPORT)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
