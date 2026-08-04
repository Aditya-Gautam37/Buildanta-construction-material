import { ForbiddenException } from "@nestjs/common";
import { UserRole } from "@workspace/db";
import type { PrismaService } from "../database/prisma.service";
import { CategoriesService } from "./categories.service";

describe("CategoriesService hierarchy", () => {
  it("generates a slug and preserves a parent relationship", async () => {
    const create = jest.fn().mockResolvedValue({ id: "child" });
    const findUnique = jest.fn().mockImplementation(({ where }: { where: { id?: string; slug?: string } }) => {
      if (where.id === "parent") return { id: "parent", parentId: null, slug: "tiles-flooring" };
      return null;
    });
    const service = new CategoriesService({
      client: { category: { create, findUnique } },
    } as unknown as PrismaService);

    await service.create({ name: "Wall Tiles", parentId: "parent" }, UserRole.ADMIN);

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: { name: "Wall Tiles", parentId: "parent", slug: "tiles-flooring/wall-tiles" },
    }));
  });

  it("rejects category creation from a role outside the catalogue group", async () => {
    const service = new CategoriesService({ client: {} } as unknown as PrismaService);

    await expect(
      service.create({ name: "Wall Tiles" }, UserRole.PROCUREMENT),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
