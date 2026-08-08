import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TaxonomyLinkMode, TaxonomyOwnerType, type UserRole } from '@workspace/db';
import { CATALOGUE_WRITE_ROLES, requireRole } from '../auth/roles';
import { PrismaService } from '../database/prisma.service';

export type TaxonomyLinksInput = {
  includes: Array<{ categoryId: string; sortOrder?: number }>;
  excludes?: string[];
};

// Rooms and stages share this entirely: both answer "which categories does this
// contain", and both are curated the same way. One service keeps the two from
// drifting apart as the wizard grows.
@Injectable()
export class TaxonomyLinksService {
  constructor(private prisma: PrismaService) {}

  private readonly selection = {
    id: true,
    mode: true,
    sortOrder: true,
    categoryId: true,
    category: { select: { id: true, name: true, slug: true, published: true, parentId: true } },
  } as const;

  private async assertOwner(ownerType: TaxonomyOwnerType, ownerId: string) {
    const owner = ownerType === TaxonomyOwnerType.ROOM
      ? await this.prisma.client.room.findUnique({ where: { id: ownerId }, select: { id: true } })
      : await this.prisma.client.stage.findUnique({ where: { id: ownerId }, select: { id: true } });
    if (!owner) throw new NotFoundException(`${ownerType === TaxonomyOwnerType.ROOM ? 'Room' : 'Stage'} not found.`);
  }

  private ownerWhere(ownerType: TaxonomyOwnerType, ownerId: string) {
    return ownerType === TaxonomyOwnerType.ROOM ? { roomId: ownerId } : { stageId: ownerId };
  }

  async list(ownerType: TaxonomyOwnerType, ownerId: string): Promise<unknown[]> {
    await this.assertOwner(ownerType, ownerId);
    return this.prisma.client.taxonomyCategoryLink.findMany({
      where: this.ownerWhere(ownerType, ownerId),
      select: this.selection,
      orderBy: [{ mode: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async replace(ownerType: TaxonomyOwnerType, ownerId: string, input: TaxonomyLinksInput, role: UserRole): Promise<unknown> {
    requireRole(role, CATALOGUE_WRITE_ROLES, 'Category mapping');
    await this.assertOwner(ownerType, ownerId);

    const includes = input.includes ?? [];
    const excludes = input.excludes ?? [];
    const referenced = [...new Set([...includes.map((item) => item.categoryId), ...excludes])];

    if (referenced.length > 0) {
      const found = await this.prisma.client.category.findMany({ where: { id: { in: referenced } }, select: { id: true } });
      if (found.length !== referenced.length) {
        const missing = referenced.filter((id) => !found.some((row) => row.id === id));
        throw new BadRequestException(`Unknown category: ${missing.join(', ')}`);
      }
    }

    // Excluding a category you also include is contradictory, and silently
    // picking a winner would make the curation screen lie about its own state.
    const overlap = includes.filter((item) => excludes.includes(item.categoryId)).map((item) => item.categoryId);
    if (overlap.length > 0) {
      throw new BadRequestException(`A category cannot be both included and excluded: ${overlap.join(', ')}`);
    }

    const owner = this.ownerWhere(ownerType, ownerId);
    return this.prisma.client.$transaction(async (tx) => {
      await tx.taxonomyCategoryLink.deleteMany({ where: owner });
      if (includes.length > 0) {
        await tx.taxonomyCategoryLink.createMany({
          data: includes.map((item, index) => ({
            ownerType,
            ...owner,
            categoryId: item.categoryId,
            mode: TaxonomyLinkMode.INCLUDE,
            sortOrder: item.sortOrder ?? (index + 1) * 10,
          })),
        });
      }
      if (excludes.length > 0) {
        await tx.taxonomyCategoryLink.createMany({
          data: excludes.map((categoryId) => ({
            ownerType,
            ...owner,
            categoryId,
            mode: TaxonomyLinkMode.EXCLUDE,
            sortOrder: 0,
          })),
        });
      }
      return tx.taxonomyCategoryLink.findMany({
        where: owner,
        select: this.selection,
        orderBy: [{ mode: 'asc' }, { sortOrder: 'asc' }],
      });
    });
  }
}
