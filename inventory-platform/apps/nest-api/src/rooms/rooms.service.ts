import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateRoomDTO } from './dto/update-room-dto';
import { CreateRoomDTO } from './dto/create-room-dto';

@Injectable()
export class RoomsService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        return await this.prisma.client.room.findMany();
    }

    async findOne(id: string) {
        return await this.prisma.client.room.findUnique({
            where: { id }
        });
    }

    async create(input: CreateRoomDTO) {

        const generatedSlug = input.slug ? input.slug : input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        return await this.prisma.client.room.create({
            data: {
                name: input.name,
                parentId: input.parentId || null,
                slug: generatedSlug
            }
        });
    }

    async update(id: string, input: UpdateRoomDTO) {
        const generatedSlug = input.slug ? input.slug : input.name ? input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : undefined;

        return await this.prisma.client.room.update({
            where: { id },
            data: {
                name: input.name,
                parentId: input.parentId === undefined ? undefined : (input.parentId || null),
                slug: generatedSlug
            }
        });
    }

    async remove(id: string) {
        await this.prisma.client.room.delete({
            where: { id }
        });
    }
}
