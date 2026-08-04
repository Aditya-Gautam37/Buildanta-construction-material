import type { PrismaService } from "../database/prisma.service";
import { HomepageContentService } from "./homepage-content.service";

describe("HomepageContentService", () => {
  it("returns active slides and featured products in their managed order", async () => {
    const slideFindMany = jest.fn().mockResolvedValue([]);
    const productFindMany = jest.fn().mockResolvedValue([]);
    const service = new HomepageContentService({
      client: {
        homepageSlide: { findMany: slideFindMany },
        homepageProduct: { findMany: productFindMany },
      },
    } as unknown as PrismaService);

    await expect(service.findPublic()).resolves.toEqual({ slides: [], products: [] });
    expect(slideFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }));
    expect(productFindMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }));
  });
});
