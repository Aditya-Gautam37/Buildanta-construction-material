import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { TaxonomyLinkMode, TaxonomyOwnerType, UserRole } from "@workspace/db";
import type { PrismaService } from "../database/prisma.service";
import { TaxonomyLinksService } from "./taxonomy-links.service";

function prismaDouble(overrides: Record<string, unknown> = {}) {
  const createMany = jest.fn().mockResolvedValue({ count: 0 });
  const deleteMany = jest.fn().mockResolvedValue({ count: 0 });
  const findMany = jest.fn().mockResolvedValue([]);
  const client = {
    room: { findUnique: jest.fn().mockResolvedValue({ id: "room-1" }) },
    stage: { findUnique: jest.fn().mockResolvedValue({ id: "stage-1" }) },
    // Mirrors the real query: only the ids actually asked for come back, so a
    // missing category is detectable.
    category: {
      findMany: jest.fn().mockImplementation(({ where }: { where: { id: { in: string[] } } }) =>
        where.id.in.filter((id) => ["cat-1", "cat-2"].includes(id)).map((id) => ({ id })),
      ),
    },
    taxonomyCategoryLink: { createMany, deleteMany, findMany },
    $transaction: async (fn: (tx: unknown) => unknown) => fn({ taxonomyCategoryLink: { createMany, deleteMany, findMany } }),
    ...overrides,
  };
  return { service: new TaxonomyLinksService({ client } as unknown as PrismaService), createMany, deleteMany, client };
}

describe("TaxonomyLinksService", () => {
  it("replaces the whole mapping rather than merging into it", async () => {
    const { service, createMany, deleteMany } = prismaDouble();

    await service.replace(TaxonomyOwnerType.ROOM, "room-1", {
      includes: [{ categoryId: "cat-1" }, { categoryId: "cat-2" }],
    }, UserRole.ADMIN);

    expect(deleteMany).toHaveBeenCalledWith({ where: { roomId: "room-1" } });
    expect(createMany).toHaveBeenCalledWith({
      data: [
        { ownerType: TaxonomyOwnerType.ROOM, roomId: "room-1", categoryId: "cat-1", mode: TaxonomyLinkMode.INCLUDE, sortOrder: 10 },
        { ownerType: TaxonomyOwnerType.ROOM, roomId: "room-1", categoryId: "cat-2", mode: TaxonomyLinkMode.INCLUDE, sortOrder: 20 },
      ],
    });
  });

  it("writes a stage mapping against stageId, never roomId", async () => {
    const { service, createMany } = prismaDouble();

    await service.replace(TaxonomyOwnerType.STAGE, "stage-1", { includes: [{ categoryId: "cat-1" }] }, UserRole.ADMIN);

    expect(createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ ownerType: TaxonomyOwnerType.STAGE, stageId: "stage-1" })],
    });
    expect(createMany.mock.calls[0]![0].data[0]).not.toHaveProperty("roomId");
  });

  // Silently choosing a winner would make the curation screen show a state the
  // database does not hold.
  it("refuses a category that is both included and excluded", async () => {
    const { service } = prismaDouble();

    await expect(
      service.replace(TaxonomyOwnerType.ROOM, "room-1", { includes: [{ categoryId: "cat-1" }], excludes: ["cat-1"] }, UserRole.ADMIN),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("refuses a category that does not exist", async () => {
    const { service } = prismaDouble({ category: { findMany: jest.fn().mockResolvedValue([]) } });

    await expect(
      service.replace(TaxonomyOwnerType.ROOM, "room-1", { includes: [{ categoryId: "ghost" }] }, UserRole.ADMIN),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("refuses an unknown owner", async () => {
    const { service } = prismaDouble({ room: { findUnique: jest.fn().mockResolvedValue(null) } });

    await expect(
      service.replace(TaxonomyOwnerType.ROOM, "missing", { includes: [] }, UserRole.ADMIN),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("requires a catalogue-write role", async () => {
    const { service } = prismaDouble();

    await expect(
      service.replace(TaxonomyOwnerType.ROOM, "room-1", { includes: [] }, UserRole.PROCUREMENT),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("clears every link when given an empty mapping", async () => {
    const { service, createMany, deleteMany } = prismaDouble();

    await service.replace(TaxonomyOwnerType.ROOM, "room-1", { includes: [] }, UserRole.ADMIN);

    expect(deleteMany).toHaveBeenCalled();
    expect(createMany).not.toHaveBeenCalled();
  });
});
