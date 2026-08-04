import { Injectable } from '@nestjs/common';
import type { UserRole } from '@workspace/db';
import { requireRole, SUPPLIER_WRITE_ROLES } from '../auth/roles';
import { PrismaService } from '../database/prisma.service';
import { CreateSupplierDTO } from './dto/create-supplier-dto';
import { UpdateSupplierDTO } from './dto/update-supplier-dto';

@Injectable()
export class SuppliersService {
    constructor(private prisma: PrismaService) {}

    async findAll() {
        return await this.prisma.client.supplier.findMany();
    }

    async findOne(id: string) {
        return await this.prisma.client.supplier.findUnique({
            where: { id }
        });
    }

    async create(input: CreateSupplierDTO, role: UserRole) {
        requireRole(role, SUPPLIER_WRITE_ROLES, 'Supplier creation');
        return await this.prisma.client.supplier.create({
            data: {
                name: input.name,
                contactInfo: input.contactInfo,
                email: input.email,
                address: input.address
            }
        });
    }

    async update(id: string, input: UpdateSupplierDTO, role: UserRole) {
        requireRole(role, SUPPLIER_WRITE_ROLES, 'Supplier update');
        return await this.prisma.client.supplier.update({
            where: { id },
            data: {
                name: input.name,
                contactInfo: input.contactInfo,
                email: input.email,
                address: input.address
            }
        });
    }

    async remove(id: string, role: UserRole) {
        requireRole(role, SUPPLIER_WRITE_ROLES, 'Supplier deletion');
        await this.prisma.client.supplier.delete({
            where: { id }
        });
    }
}
