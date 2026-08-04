import { NotFoundException } from "@nestjs/common";
import { ProfessionalType } from "@workspace/db";
import type { PrismaService } from "../database/prisma.service";
import { ProfessionalsService } from "./professionals.service";

describe("ProfessionalsService", () => {
  it("returns only published professionals in the selected type", async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new ProfessionalsService({ client: { professional: { findMany } } } as unknown as PrismaService);

    await service.findAll(ProfessionalType.CONTRACTOR);

    expect(findMany).toHaveBeenCalledWith({
      where: { published: true, type: ProfessionalType.CONTRACTOR },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    });
  });

  it("does not expose an unpublished or missing profile", async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const service = new ProfessionalsService({ client: { professional: { findFirst } } } as unknown as PrismaService);

    await expect(service.findOne("missing-profile")).rejects.toBeInstanceOf(NotFoundException);
    expect(findFirst).toHaveBeenCalledWith({ where: { slug: "missing-profile", published: true } });
  });
});
