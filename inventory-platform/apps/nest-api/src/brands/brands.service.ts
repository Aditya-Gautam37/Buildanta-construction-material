import { Injectable } from '@nestjs/common';
import type { UserRole } from '@workspace/db';
import { CATALOGUE_WRITE_ROLES, requireRole } from '../auth/roles';
import { PrismaService } from '../database/prisma.service';
import { CreateBrandDTO } from './dto/create-brand-dto';
import { UpdateBrandDTO } from './dto/update-brand-dto';

@Injectable()
export class BrandsService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        return await this.prisma.client.brand.findMany();
    }

    async findOne(id: string) {
        return await this.prisma.client.brand.findUnique({
            where: { id }
        });
    }

    async create(input: CreateBrandDTO, role: UserRole) {
        requireRole(role, CATALOGUE_WRITE_ROLES, 'Brand creation');
        return await this.prisma.client.brand.create({
            data: {
                name: input.name,
                slug: input.slug,
                logo: input.logo,
                description: input.description,
                website: input.website
            }
        });
    }

    async update(id: string, input: UpdateBrandDTO, role: UserRole) {
        requireRole(role, CATALOGUE_WRITE_ROLES, 'Brand update');
        return await this.prisma.client.brand.update({
            where: { id },
            data: {
                name: input.name,
                slug: input.slug,
                logo: input.logo,
                description: input.description,
                website: input.website
            }
        });
    }

    async remove(id: string, role: UserRole) {
        requireRole(role, CATALOGUE_WRITE_ROLES, 'Brand deletion');
        await this.prisma.client.brand.delete({
            where: { id }
        });
    }
}
