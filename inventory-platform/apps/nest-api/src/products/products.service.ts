import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateProductDTO } from './dto/create-product-dto';
import { UpdateProductDto } from './dto/update-product-dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductStatus, UserRole, VariantStatus } from '@workspace/db';
import { CATALOGUE_WRITE_ROLES, requireFinancialAccess, requireRole } from '../auth/roles';
import {
    aggregatePublicAvailabilityStatuses,
    publicAvailabilityForBalances,
} from '../common/public-catalogue';

type ListProductRecord = {
    id: string;
    name: string;
    description: string | null;
    status: ProductStatus;
    unit: string;
    minimumOrderQuantity: number;
    sellingPrice: unknown;
    bulkPrice: unknown;
    gstPercent: unknown;
    deliveryInfo: string | null;
    brand: { name: string };
    keySpecifications: string[];
    stages: { name: string }[];
    rooms: { name: string }[];
    updatedAt: Date;
    categories: { id: string; name: string; slug: string }[];
    reviews: { rating: number }[];
    variants: { sku: string; price: unknown; unit: string; stockQuantity: number; reservedQuantity: number; lowStockThreshold: number; stockTracked: boolean; status: VariantStatus; supplier: { name: string } | null; inventoryBalances: { physicalQuantity: number; reservedQuantity: number; blockedQuantity: number; damagedQuantity: number; quarantineQuantity: number; lowStockThreshold: number }[] }[];
    images: { id: string; src: string; alt: string; sortOrder: number; primary: boolean; variantId: string | null }[];
};

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) {}

    private readonly detailsInclude = {
        brand: true,
        categories: true,
        stages: true,
        rooms: true,
        images: true,
        reviews: true,
        variants: {
            include: {
                supplier: true,
                images: true,
                inventoryBalances: true,
            },
        },
    };

    private slugify(value: string) {
        return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    private async resolveBrandId(input: { brandId?: string; brand?: string }, required = true) {
        if (input.brandId) {
            const byId = await this.prisma.client.brand.findUnique({ where: { id: input.brandId } });
            if (!byId) {
                throw new BadRequestException('Invalid brandId.');
            }
            return byId.id;
        }

        if (input.brand) {
            const byUnique = await this.prisma.client.brand.findFirst({
                where: {
                    OR: [{ id: input.brand }, { name: input.brand }, { slug: this.slugify(input.brand) }],
                },
            });

            if (!byUnique) {
                throw new BadRequestException('Brand not found. Pass a valid brandId or existing brand name.');
            }

            return byUnique.id;
        }

        if (required) {
            throw new BadRequestException('brandId (or brand) is required.');
        }

        return undefined;
    }

    private async ensureIdsExist(
        model: 'category' | 'stage' | 'room',
        ids: string[] | undefined,
    ) {
        if (!ids || ids.length === 0) {
            return;
        }

        const uniqueIds = [...new Set(ids)];
        let count = 0;

        if (model === 'category') {
            count = await this.prisma.client.category.count({
                where: { id: { in: uniqueIds } },
            });
        }

        if (model === 'stage') {
            count = await this.prisma.client.stage.count({
                where: { id: { in: uniqueIds } },
            });
        }

        if (model === 'room') {
            count = await this.prisma.client.room.count({
                where: { id: { in: uniqueIds } },
            });
        }

        if (count !== uniqueIds.length) {
            throw new BadRequestException(`One or more ${model}Ids are invalid.`);
        }
    }

    private mapInventoryProduct(product: ListProductRecord) {
        return {
            id: product.id,
            name: product.name,
            description: product.description,
            brand: product.brand.name,
            status: product.status,
            unit: product.unit,
            minimumOrderQuantity: product.minimumOrderQuantity,
            sellingPrice: product.sellingPrice,
            bulkPrice: product.bulkPrice,
            gstPercent: product.gstPercent,
            deliveryInfo: product.deliveryInfo,
            keySpecifications: product.keySpecifications,
            stage: product.stages.map((item) => item.name),
            room: product.rooms.map((item) => item.name),
            updatedAt: product.updatedAt.toISOString(),
            categories: product.categories.map((item) => ({ id: item.id, name: item.name, slug: item.slug })),
            reviews: product.reviews.map((item) => ({ rating: item.rating })),
            variants: product.variants.map((item) => ({
                sku: item.sku,
                price: item.price ?? 0,
                unit: item.unit,
                stockQuantity: item.stockQuantity,
                reservedQuantity: item.reservedQuantity,
                lowStockThreshold: item.lowStockThreshold,
                stockTracked: item.stockTracked,
                status: item.status,
                supplier: item.supplier,
            })),
            images: product.images,
        };
    }

    private mapPublicProduct(product: ListProductRecord) {
        const activeVariants = product.variants.filter(
            (variant) => variant.status === VariantStatus.ACTIVE,
        );

        return {
            id: product.id,
            name: product.name,
            description: product.description,
            brand: product.brand.name,
            unit: product.unit,
            minimumOrderQuantity: product.minimumOrderQuantity,
            sellingPrice: product.sellingPrice,
            bulkPrice: product.bulkPrice,
            gstPercent: product.gstPercent,
            deliveryInfo: product.deliveryInfo,
            keySpecifications: product.keySpecifications,
            stage: product.stages.map((item) => item.name),
            room: product.rooms.map((item) => item.name),
            updatedAt: product.updatedAt.toISOString(),
            categories: product.categories.map((item) => ({
                id: item.id,
                name: item.name,
                slug: item.slug,
            })),
            reviews: product.reviews.map((item) => ({ rating: item.rating })),
            availabilityStatus: aggregatePublicAvailabilityStatuses(
                activeVariants.map((item) => publicAvailabilityForBalances(item.inventoryBalances)),
            ),
            variants: activeVariants.map((item) => ({
                sku: item.sku,
                price: item.price ?? 0,
                unit: item.unit,
                availabilityStatus: publicAvailabilityForBalances(item.inventoryBalances),
            })),
            images: product.images,
        };
    }

    async create(input: CreateProductDTO, role: UserRole) {
        requireRole(role, CATALOGUE_WRITE_ROLES, 'Product creation');
        requireFinancialAccess(role, [
            input.sellingPrice, input.price, input.costPrice, input.dummyPrice, input.bulkPrice, input.gstPercent,
            input.defaultVariant?.price, input.defaultVariant?.stockQuantity, input.defaultVariant?.lowStockThreshold,
        ], 'Financial');
        const categoryIds = input.categoryIds ?? [];
        const stageIds = input.stageIds ?? [];
        const roomIds = input.roomIds ?? [];

        if (categoryIds.length === 0) {
            throw new BadRequestException('At least one category is required.');
        }

        if (stageIds.length === 0) {
            throw new BadRequestException('At least one stage is required.');
        }

        await this.ensureIdsExist('category', categoryIds);
        await this.ensureIdsExist('stage', stageIds);
        await this.ensureIdsExist('room', roomIds);

        const brandId = await this.resolveBrandId({ brandId: input.brandId, brand: input.brand }, true);
        if (!brandId) {
            throw new BadRequestException('brandId (or brand) is required.');
        }

        const sellingPrice = input.sellingPrice ?? input.price ?? 0;
        const createDefaultVariant = Boolean(input.createDefaultVariant || input.defaultVariant || input.sku);

        const created = await this.prisma.client.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    name: input.name,
                    description: input.description,
                    keySpecifications: input.keySpecifications ?? [],
                    brand: { connect: { id: brandId } },
                    sellingPrice,
                    costPrice: input.costPrice,
                    dummyPrice: input.dummyPrice,
                    bulkPrice: input.bulkPrice,
                    gstPercent: input.gstPercent,
                    unit: input.unit ?? 'unit',
                    minimumOrderQuantity: input.minimumOrderQuantity ?? 1,
                    deliveryInfo: input.deliveryInfo,
                    returnEligible: input.returnEligible,
                    status: input.status ?? ProductStatus.DRAFT,
                    publishedAt: input.status === ProductStatus.PUBLISHED ? new Date() : undefined,
                    categories: categoryIds.length > 0 ? { connect: categoryIds.map((id) => ({ id })) } : undefined,
                    stages: stageIds.length > 0 ? { connect: stageIds.map((id) => ({ id })) } : undefined,
                    rooms: roomIds.length > 0 ? { connect: roomIds.map((id) => ({ id })) } : undefined,
                },
                include: { brand: true },
            });

            if (createDefaultVariant) {
                const supplierId = input.defaultVariant?.supplierId;
                const sku = input.defaultVariant?.sku ?? input.sku;

                if (!supplierId || !sku) {
                    throw new BadRequestException(
                        'defaultVariant.supplierId and sku are required when creating a default variant.',
                    );
                }

                const supplier = await tx.supplier.findUnique({ where: { id: supplierId } });
                if (!supplier) {
                    throw new BadRequestException('Invalid supplierId for default variant.');
                }

                                const variant = await tx.productVariant.create({
                                        data: {
                                                productId: product.id,
                                                supplierId,
                                                sku,
                                                price: input.defaultVariant?.price ?? input.price,
                                                attributes: JSON.parse(JSON.stringify(input.defaultVariant?.attributes ?? {})),
                                                unit: input.defaultVariant?.unit ?? input.unit ?? 'unit',
                                                minimumOrderQuantity: input.defaultVariant?.minimumOrderQuantity ?? input.minimumOrderQuantity ?? 1,
                                                stockQuantity: input.defaultVariant?.stockQuantity ?? 0,
                                                lowStockThreshold: input.defaultVariant?.lowStockThreshold ?? 5,
                                                stockTracked: input.defaultVariant?.stockQuantity !== undefined,
                                        },
                                });

                                if ((input.defaultVariant?.imageUrls?.length ?? 0) > 0) {
                                        await tx.productImage.createMany({
                                                data: (input.defaultVariant?.imageUrls ?? []).map((src, index) => ({
                                                        src,
                                                        alt: `${product.name} variant image ${index + 1}`,
                                                        productId: product.id,
                                                        variantId: variant.id,
                                                })),
                                        });
                                }
            }

            return product;
        });

        return {
            id: created.id,
            name: created.name,
            brand: created.brand.name,
        };
    }

    private async listProducts(publicOnly: boolean): Promise<unknown[]> {
        const products = await this.prisma.client.product.findMany({
            where: publicOnly ? { status: ProductStatus.PUBLISHED } : undefined,
            include: {
                brand: true,
                categories: {
                    where: { published: true },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                stages: {
                    select: {
                        name: true,
                    },
                },
                rooms: {
                    select: {
                        name: true,
                    },
                },
                reviews: {
                    select: {
                        rating: true,
                    },
                },
                images: {
                    orderBy: [{ primary: 'desc' }, { sortOrder: 'asc' }],
                },
                variants: {
                    where: publicOnly ? { status: VariantStatus.ACTIVE } : undefined,
                    select: {
                        sku: true,
                        price: true,
                        unit: true,
                        stockQuantity: true,
                        reservedQuantity: true,
                        lowStockThreshold: true,
                        stockTracked: true,
                        status: true,
                        supplier: {
                            select: {
                                name: true,
                            },
                        },
                        inventoryBalances: {
                            select: {
                                physicalQuantity: true,
                                reservedQuantity: true,
                                blockedQuantity: true,
                                damagedQuantity: true,
                                quarantineQuantity: true,
                                lowStockThreshold: true,
                            },
                        },
                    },
                },
            },
        });

        return products.map((item) =>
            publicOnly
                ? this.mapPublicProduct(item)
                : this.mapInventoryProduct(item),
        );
    }

    async findAll(): Promise<unknown[]> {
        return this.listProducts(true);
    }

    async findAllInventory(): Promise<unknown[]> {
        return this.listProducts(false);
    }

    async getDetails(id: string): Promise<unknown> {
        const product = await this.prisma.client.product.findUnique({
            where: { id },
            include: this.detailsInclude,
        });

        if (!product) {
            throw new NotFoundException('Product not found.');
        }

        if (product.status !== ProductStatus.PUBLISHED) {
            throw new NotFoundException('Product not found.');
        }

        return this.mapPublicProduct({
            ...product,
            categories: product.categories.filter((category) => category.published),
            variants: product.variants.filter(
                (variant) => variant.status === VariantStatus.ACTIVE,
            ),
        });
    }

    async getInventoryDetails(id: string): Promise<unknown> {
        const product = await this.prisma.client.product.findUnique({
            where: { id },
            include: this.detailsInclude,
        });

        if (!product) {
            throw new NotFoundException('Product not found.');
        }

        return product;
    }

    async update(id: string, input: UpdateProductDto, role: UserRole): Promise<unknown> {
        requireRole(role, CATALOGUE_WRITE_ROLES, 'Product update');
        requireFinancialAccess(role, [
            input.sellingPrice, input.price, input.costPrice, input.dummyPrice, input.bulkPrice, input.gstPercent,
        ], 'Financial');
        const existing = await this.prisma.client.product.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!existing) {
            throw new NotFoundException('Product not found.');
        }

        const brandId = await this.resolveBrandId({ brandId: input.brandId, brand: input.brand }, false);

        await this.ensureIdsExist('category', input.categoryIds);
        await this.ensureIdsExist('stage', input.stageIds);
        await this.ensureIdsExist('room', input.roomIds);

        return await this.prisma.client.product.update({
            where: { id },
            data: {
                name: input.name,
                description: input.description,
                keySpecifications: input.keySpecifications,
                brandId,
                sellingPrice: input.sellingPrice ?? input.price,
                costPrice: input.costPrice,
                dummyPrice: input.dummyPrice,
                bulkPrice: input.bulkPrice,
                gstPercent: input.gstPercent,
                unit: input.unit,
                minimumOrderQuantity: input.minimumOrderQuantity,
                deliveryInfo: input.deliveryInfo,
                returnEligible: input.returnEligible,
                status: input.status,
                publishedAt: input.status === ProductStatus.PUBLISHED ? new Date() : input.status ? null : undefined,
                categories: input.categoryIds
                    ? {
                          set: input.categoryIds.map((categoryId) => ({ id: categoryId })),
                      }
                    : undefined,
                stages: input.stageIds
                    ? {
                          set: input.stageIds.map((stageId) => ({ id: stageId })),
                      }
                    : undefined,
                rooms: input.roomIds
                    ? {
                          set: input.roomIds.map((roomId) => ({ id: roomId })),
                      }
                    : undefined,
            },
            include: this.detailsInclude,
        });
    }

    async updateImages(id: string, images: Array<{ id?: string; src: string; alt: string; sortOrder: number; primary: boolean; variantId?: string | null }>, role: UserRole) {
        requireRole(role, CATALOGUE_WRITE_ROLES, 'Product image update');
        const product = await this.prisma.client.product.findUnique({ where: { id }, select: { id: true, variants: { select: { id: true } } } });
        if (!product) throw new NotFoundException('Product not found.');
        const variantIds = new Set(product.variants.map((item) => item.id));
        for (const image of images) if (image.variantId && !variantIds.has(image.variantId)) throw new BadRequestException('An image variant does not belong to this product.');
        if (images.filter((item) => item.primary).length > 1) throw new BadRequestException('Choose only one primary product image.');
        if (images.length && !images.some((item) => item.primary)) images[0]!.primary = true;
        return this.prisma.client.$transaction(async (tx) => {
            const retainedIds = images.flatMap((item) => item.id ? [item.id] : []);
            await tx.productImage.deleteMany({ where: { productId: id, ...(retainedIds.length ? { id: { notIn: retainedIds } } : {}) } });
            for (const image of images) {
                const data = { src: image.src, alt: image.alt, sortOrder: image.sortOrder, primary: image.primary, variantId: image.variantId || null };
                if (image.id) await tx.productImage.update({ where: { id: image.id }, data });
                else await tx.productImage.create({ data: { ...data, productId: id } });
            }
            return tx.productImage.findMany({ where: { productId: id }, orderBy: [{ primary: 'desc' }, { sortOrder: 'asc' }] });
        });
    }

    async remove(id: string, role: UserRole) {
        requireRole(role, CATALOGUE_WRITE_ROLES, 'Product deletion');
        await this.prisma.client.$transaction(async (tx) => {
            const existing = await tx.product.findUnique({ where: { id }, select: { id: true } });
            if (!existing) {
                throw new NotFoundException('Product not found.');
            }

            await tx.productVariant.deleteMany({ where: { productId: id } });
            await tx.product.delete({ where: { id } });
        });
    }

}
