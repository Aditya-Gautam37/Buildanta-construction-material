import { Injectable } from '@nestjs/common';
import { TaxonomyLinkMode, type UserRole } from '@workspace/db';
import { CATALOGUE_WRITE_ROLES, requireRole } from '../auth/roles';
import { PrismaService } from '../database/prisma.service';
import { UpdateRoomDTO } from './dto/update-room-dto';
import { CreateRoomDTO } from './dto/create-room-dto';

@Injectable()
export class RoomsService {
    constructor(private prisma: PrismaService) {}

    // The storefront builds the whole wizard from one snapshot, so the room
    // list carries its category links rather than making the client fetch
    // per-room. Only INCLUDE rows are ordered; EXCLUDE rows are a flat set.
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
        return await this.prisma.client.room.findMany({ select: this.selection });
    }

    async findOne(id: string): Promise<unknown> {
        return await this.prisma.client.room.findUnique({
            where: { id },
            select: this.selection,
        });
    }

    async create(input: CreateRoomDTO, role: UserRole): Promise<unknown> {
        requireRole(role, CATALOGUE_WRITE_ROLES, 'Room creation');

        const generatedSlug = input.slug ? input.slug : input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        return await this.prisma.client.room.create({
            data: {
                name: input.name,
                parentId: input.parentId || null,
                slug: generatedSlug
            },
            select: this.selection,
        });
    }

    async update(id: string, input: UpdateRoomDTO, role: UserRole): Promise<unknown> {
        requireRole(role, CATALOGUE_WRITE_ROLES, 'Room update');

        const generatedSlug = input.slug ? input.slug : input.name ? input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : undefined;

        return await this.prisma.client.room.update({
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
        requireRole(role, CATALOGUE_WRITE_ROLES, 'Room update');
        return await this.prisma.client.room.update({ where: { id }, data: { imageUrl }, select: this.selection });
    }

    async remove(id: string, role: UserRole) {
        requireRole(role, CATALOGUE_WRITE_ROLES, 'Room deletion');
        await this.prisma.client.room.delete({
            where: { id }
        });
    }

    async includedCategoryIds(id: string) {
        const links = await this.prisma.client.taxonomyCategoryLink.findMany({
            where: { roomId: id, mode: TaxonomyLinkMode.INCLUDE },
            select: { categoryId: true },
            orderBy: { sortOrder: 'asc' },
        });
        return links.map((link) => link.categoryId);
    }
}
