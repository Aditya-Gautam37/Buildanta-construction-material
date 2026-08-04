import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateStageDTO } from './dto/create-stage-dto';
import { UpdateStageDTO } from './dto/update-stage-dto';

@Injectable()
export class StagesService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        return await this.prisma.client.stage.findMany();
    }

    async findOne(id: string) {
        return await this.prisma.client.stage.findUnique({
            where: { id }
        });
    }

    async create(input: CreateStageDTO) {

        const generatedSlug = input.slug ? input.slug : input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        return await this.prisma.client.stage.create({
            data: {
                name: input.name,
                parentId: input.parentId || null,
                slug: generatedSlug
            }
        });
    }

    async update(id: string, input: UpdateStageDTO) {
        const generatedSlug = input.slug ? input.slug : input.name ? input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : undefined;

        return await this.prisma.client.stage.update({
            where: { id },
            data: {
                name: input.name,
                parentId: input.parentId === undefined ? undefined : (input.parentId || null),
                slug: generatedSlug
            }
        });
    }

    async remove(id: string) {
        await this.prisma.client.stage.delete({
            where: { id }
        });
    }
}
