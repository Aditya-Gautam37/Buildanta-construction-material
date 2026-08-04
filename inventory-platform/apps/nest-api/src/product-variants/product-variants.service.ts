import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateProductVariantDTO } from './dto/create-product-variant-dto';
import { UpdateProductVariantDTO } from './dto/update-product-variant-dto';
import { ProductStatus, UserRole, VariantStatus } from '@workspace/db';
import { CATALOGUE_WRITE_ROLES, requireFinancialAccess, requireRole } from '../auth/roles';
import { publicAvailabilityForBalances } from '../common/public-catalogue';

@Injectable()
export class ProductVariantsService {
	constructor(private prisma: PrismaService) {}

	private mapPublicVariant(variant: {
		id: string;
		productId: string;
		sku: string;
		price: unknown;
		attributes: unknown;
		unit: string;
		minimumOrderQuantity: number;
		stockQuantity: number;
		reservedQuantity: number;
		lowStockThreshold: number;
		stockTracked: boolean;
		inventoryBalances: Array<{
			physicalQuantity: number;
			reservedQuantity: number;
			blockedQuantity: number;
			damagedQuantity: number;
			quarantineQuantity: number;
			lowStockThreshold: number;
		}>;
		images: Array<{
			id: string;
			src: string;
			alt: string;
			sortOrder: number;
			primary: boolean;
		}>;
		product: { id: string; name: string };
	}) {
		return {
			id: variant.id,
			productId: variant.productId,
			sku: variant.sku,
			price: variant.price,
			attributes: variant.attributes,
			unit: variant.unit,
			minimumOrderQuantity: variant.minimumOrderQuantity,
			availabilityStatus: publicAvailabilityForBalances(variant.inventoryBalances),
			images: variant.images.map((image) => ({
				id: image.id,
				src: image.src,
				alt: image.alt,
				sortOrder: image.sortOrder,
				primary: image.primary,
			})),
			product: {
				id: variant.product.id,
				name: variant.product.name,
			},
		};
	}

	private async assertProductAndSupplier(productId: string, supplierId: string) {
		const [product, supplier] = await Promise.all([
			this.prisma.client.product.findUnique({ where: { id: productId } }),
			this.prisma.client.supplier.findUnique({ where: { id: supplierId } }),
		]);

		if (!product) {
			throw new BadRequestException('Invalid productId.');
		}

		if (!supplier) {
			throw new BadRequestException('Invalid supplierId.');
		}

		return product;
	}

	async create(input: CreateProductVariantDTO, role: UserRole): Promise<unknown> {
		requireRole(role, CATALOGUE_WRITE_ROLES, 'Product variant creation');
		requireFinancialAccess(role, [input.price, input.stockQuantity, input.reservedQuantity, input.lowStockThreshold], 'Financial');
		const product = await this.assertProductAndSupplier(input.productId, input.supplierId);
		if ((input.reservedQuantity ?? 0) > (input.stockQuantity ?? 0)) {
			throw new BadRequestException('Reserved stock cannot exceed available stock.');
		}

		return await this.prisma.client.$transaction(async (tx) => {
			const created = await tx.productVariant.create({
				data: {
					productId: input.productId,
					supplierId: input.supplierId,
					sku: input.sku,
					price: input.price,
					attributes: JSON.parse(JSON.stringify(input.attributes ?? {})),
					unit: input.unit ?? product.unit,
					minimumOrderQuantity: input.minimumOrderQuantity ?? product.minimumOrderQuantity,
					stockQuantity: input.stockQuantity ?? 0,
					reservedQuantity: input.reservedQuantity ?? 0,
					lowStockThreshold: input.lowStockThreshold ?? 5,
					stockTracked: input.stockQuantity !== undefined || input.reservedQuantity !== undefined,
					status: input.status ?? VariantStatus.ACTIVE,
				},
			});

			if ((input.imageUrls?.length ?? 0) > 0) {
				await tx.productImage.createMany({
					data: (input.imageUrls ?? []).map((src, index) => ({
						src,
						alt: `${product.name} variant image ${index + 1}`,
						productId: input.productId,
						variantId: created.id,
					})),
				});
			}

			return await tx.productVariant.findUniqueOrThrow({
				where: { id: created.id },
				include: {
					supplier: true,
					product: true,
					images: true,
				},
			});
		});
	}

	private async listVariants(publicOnly: boolean): Promise<unknown[]> {
		const variants = await this.prisma.client.productVariant.findMany({
			where: publicOnly ? { status: VariantStatus.ACTIVE, product: { status: ProductStatus.PUBLISHED } } : undefined,
			include: {
				supplier: true,
				product: true,
				images: true,
				inventoryBalances: true,
			},
		});

		return publicOnly
			? variants.map((variant) => this.mapPublicVariant(variant))
			: variants;
	}

	async findAll(): Promise<unknown[]> {
		return this.listVariants(true);
	}

	async findAllInventory(): Promise<unknown[]> {
		return this.listVariants(false);
	}

	async findOne(id: string): Promise<unknown> {
		const variant = await this.prisma.client.productVariant.findUnique({
			where: { id },
			include: {
				supplier: true,
				product: true,
				images: true,
				inventoryBalances: true,
			},
		});

		if (!variant) {
			throw new NotFoundException('Product variant not found.');
		}
		if (variant.status !== VariantStatus.ACTIVE || variant.product.status !== ProductStatus.PUBLISHED) {
			throw new NotFoundException('Product variant not found.');
		}

		return this.mapPublicVariant(variant);
	}

	async findOneInventory(id: string): Promise<unknown> {
		const variant = await this.prisma.client.productVariant.findUnique({
			where: { id },
			include: {
				supplier: true,
				product: true,
				images: true,
				inventoryBalances: true,
			},
		});

		if (!variant) {
			throw new NotFoundException('Product variant not found.');
		}

		return variant;
	}

	async update(id: string, input: UpdateProductVariantDTO, role: UserRole): Promise<unknown> {
		requireRole(role, CATALOGUE_WRITE_ROLES, 'Product variant update');
		requireFinancialAccess(role, [input.price, input.stockQuantity, input.reservedQuantity, input.lowStockThreshold], 'Financial');
		const existing = await this.prisma.client.productVariant.findUnique({
			where: { id },
			include: {
				product: {
					include: {
						categories: {
							select: { name: true, slug: true },
						},
					},
				},
			},
		});

		if (!existing) {
			throw new NotFoundException('Product variant not found.');
		}

		const nextProductId = input.productId ?? existing.productId;
		const nextSupplierId = input.supplierId ?? existing.supplierId;
		await this.assertProductAndSupplier(nextProductId, nextSupplierId);
		const nextStock = input.stockQuantity ?? existing.stockQuantity;
		const nextReserved = input.reservedQuantity ?? existing.reservedQuantity;
		if (nextReserved > nextStock) {
			throw new BadRequestException('Reserved stock cannot exceed available stock.');
		}

		return await this.prisma.client.$transaction(async (tx) => {
			const updated = await tx.productVariant.update({
				where: { id },
				data: {
					productId: input.productId,
					supplierId: input.supplierId,
					sku: input.sku,
					price: input.price,
					attributes: input.attributes === undefined ? undefined : JSON.parse(JSON.stringify(input.attributes)),
					unit: input.unit,
					minimumOrderQuantity: input.minimumOrderQuantity,
					stockQuantity: input.stockQuantity,
					reservedQuantity: input.reservedQuantity,
					lowStockThreshold: input.lowStockThreshold,
					stockTracked:
						input.stockQuantity !== undefined || input.reservedQuantity !== undefined
							? true
							: undefined,
					status: input.status,
				},
			});

			if (input.imageUrls !== undefined) {
				await tx.productImage.deleteMany({ where: { variantId: id } });
				if (input.imageUrls.length > 0) {
					await tx.productImage.createMany({
						data: input.imageUrls.map((src, index) => ({
							src,
							alt: `${existing.product.name} variant image ${index + 1}`,
							productId: updated.productId,
							variantId: updated.id,
						})),
					});
				}
			}

			return await tx.productVariant.findUniqueOrThrow({
				where: { id: updated.id },
				include: {
					supplier: true,
					product: true,
					images: true,
				},
			});
		});
	}

	async remove(id: string, role: UserRole) {
		requireRole(role, CATALOGUE_WRITE_ROLES, 'Product variant deletion');
		const existing = await this.prisma.client.productVariant.findUnique({
			where: { id },
			select: { id: true },
		});

		if (!existing) {
			throw new NotFoundException('Product variant not found.');
		}

		await this.prisma.client.productVariant.delete({
			where: { id },
		});
	}
}
