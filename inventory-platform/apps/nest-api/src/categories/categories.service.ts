import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { UserRole } from '@workspace/db';
import { CATALOGUE_WRITE_ROLES, requireRole } from '../auth/roles';
import { PrismaService } from '../database/prisma.service';
import { CreateCategoryDTO } from './dto/create-category-dto';
import { UpdateCategoryDTO } from './dto/update-category-dto';

function slugPart(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  private readonly selection = {
    id: true,
    name: true,
    slug: true,
    description: true,
    imageUrl: true,
    icon: true,
    sortOrder: true,
    featured: true,
    published: true,
    seoTitle: true,
    seoDescription: true,
    parentId: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { children: true, products: true } },
  } as const;

  async findAll() {
    return this.prisma.client.category.findMany({
      where: { published: true },
      select: this.selection,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findInventory() {
    return this.prisma.client.category.findMany({
      select: this.selection,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.client.category.findFirst({
      where: { id, published: true },
      select: this.selection,
    });
    if (!category) throw new NotFoundException('Category not found.');
    return category;
  }

  private async assertParent(parentId: string | null | undefined, categoryId?: string) {
    if (!parentId) return;
    if (parentId === categoryId) throw new BadRequestException('A category cannot be its own parent.');
    const parent = await this.prisma.client.category.findUnique({ where: { id: parentId }, select: { id: true, parentId: true } });
    if (!parent) throw new BadRequestException('Selected parent category does not exist.');
    if (!categoryId) return;
    let cursor: string | null = parent.parentId;
    const visited = new Set([parent.id]);
    while (cursor) {
      if (cursor === categoryId) throw new BadRequestException('This parent would create a circular category hierarchy.');
      if (visited.has(cursor)) throw new BadRequestException('The existing category hierarchy contains a circular relationship.');
      visited.add(cursor);
      const ancestor = await this.prisma.client.category.findUnique({ where: { id: cursor }, select: { parentId: true } });
      cursor = ancestor?.parentId ?? null;
    }
  }

  private async resolvedSlug(name: string, requested: string | undefined, parentId: string | null | undefined, currentId?: string) {
    const explicit = requested?.trim().replace(/^\/+|\/+$/g, '');
    let candidate = explicit;
    if (!candidate) {
      const parent = parentId ? await this.prisma.client.category.findUnique({ where: { id: parentId }, select: { slug: true } }) : null;
      candidate = [parent?.slug, slugPart(name)].filter(Boolean).join('/');
    }
    if (!candidate) throw new BadRequestException('A useful category name or slug is required.');
    const conflict = await this.prisma.client.category.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (conflict && conflict.id !== currentId) throw new ConflictException(`Category slug '${candidate}' is already in use.`);
    return candidate;
  }

  async create(input: CreateCategoryDTO, role: UserRole) {
    requireRole(role, CATALOGUE_WRITE_ROLES, 'Category creation');
    await this.assertParent(input.parentId);
    const slug = await this.resolvedSlug(input.name, input.slug, input.parentId);
    return this.prisma.client.category.create({
      data: { ...input, parentId: input.parentId || null, slug },
      select: this.selection,
    });
  }

  async update(id: string, input: UpdateCategoryDTO, role: UserRole) {
    requireRole(role, CATALOGUE_WRITE_ROLES, 'Category update');
    const current = await this.prisma.client.category.findUnique({ where: { id }, select: { id: true, name: true, slug: true, parentId: true } });
    if (!current) throw new NotFoundException('Category not found.');
    const parentId = input.parentId === undefined ? current.parentId : input.parentId;
    await this.assertParent(parentId, id);
    const name = input.name ?? current.name;
    const slug = input.slug !== undefined || input.name !== undefined || input.parentId !== undefined
      ? await this.resolvedSlug(name, input.slug, parentId, id)
      : undefined;
    return this.prisma.client.category.update({
      where: { id },
      data: { ...input, parentId: input.parentId === undefined ? undefined : (input.parentId || null), slug },
      select: this.selection,
    });
  }

  async remove(id: string, role: UserRole) {
    requireRole(role, CATALOGUE_WRITE_ROLES, 'Category deletion');
    const category = await this.prisma.client.category.findUnique({
      where: { id },
      select: { id: true, _count: { select: { children: true, products: true } } },
    });
    if (!category) throw new NotFoundException('Category not found.');
    if (category._count.children > 0) throw new ConflictException('Move or archive child categories before archiving this category.');
    if (category._count.products > 0) throw new ConflictException('Move assigned products before archiving this category.');
    await this.prisma.client.category.update({ where: { id }, data: { published: false, featured: false } });
  }
}
