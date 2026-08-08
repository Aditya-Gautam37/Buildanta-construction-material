import { Injectable } from '@nestjs/common';
import { TaxonomyLinkMode, type UserRole } from '@workspace/db';
import { CATALOGUE_WRITE_ROLES, requireRole } from '../auth/roles';
import { PrismaService } from '../database/prisma.service';
import { CreateStageDTO } from './dto/create-stage-dto';
import { UpdateStageDTO } from './dto/update-stage-dto';

@Injectable()
export class StagesService {
    constructor(private prisma: PrismaService) {}

    // Mirrors RoomsService: the storefront reads the whole wizard from one
    // snapshot, so links travel with the stage rather than in a second call.
    private readonly selection = {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
        categoryLinks: {
            select: { id: true, categoryId: true, mode: true, sortOrder: true },
            orderBy: { sortOrder: 'asc' },
        },
    } as const;

    async findAll(): Promise<unknown[]> {
        return await this.prisma.client.stage.findMany({ select: this.selection });
    }

    async findOne(id: string): Promise<unknown> {
        return await this.prisma.client.stage.findUnique({
            where: { id },
            select: this.selection,
        });
    }

    async create(input: CreateStageDTO, role: UserRole): Promise<unknown> {
        requireRole(role, CATALOGUE_WRITE_ROLES, 'Stage creation');

        const generatedSlug = input.slug ? input.slug : input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        return await this.prisma.client.stage.create({
            data: {
                name: input.name,
                parentId: input.parentId || null,
                slug: generatedSlug
            },
            select: this.selection,
        });
    }

    async update(id: string, input: UpdateStageDTO, role: UserRole): Promise<unknown> {
        requireRole(role, CATALOGUE_WRITE_ROLES, 'Stage update');

        const generatedSlug = input.slug ? input.slug : input.name ? input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : undefined;

        return await this.prisma.client.stage.update({
            where: { id },
            data: {
                name: input.name,
                parentId: input.parentId === undefined ? undefined : (input.parentId || null),
                slug: generatedSlug
            },
            select: this.selection,
        });
    }

    async setImage(id: string, imageUrl: string | null, role: UserRole): Promise<unknown> {
        requireRole(role, CATALOGUE_WRITE_ROLES, 'Stage update');
        return await this.prisma.client.stage.update({ where: { id }, data: { imageUrl }, select: this.selection });
    }

    async remove(id: string, role: UserRole) {
        requireRole(role, CATALOGUE_WRITE_ROLES, 'Stage deletion');
        await this.prisma.client.stage.delete({
            where: { id }
        });
    }

    async includedCategoryIds(id: string) {
        const links = await this.prisma.client.taxonomyCategoryLink.findMany({
            where: { stageId: id, mode: TaxonomyLinkMode.INCLUDE },
            select: { categoryId: true },
            orderBy: { sortOrder: 'asc' },
        });
        return links.map((link) => link.categoryId);
    }
}
