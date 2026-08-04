import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { UserRole } from '@workspace/db';
import { ProductVariantsService } from './product-variants.service';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { CreateProductVariantDTO } from './dto/create-product-variant-dto';
import { UpdateProductVariantDTO } from './dto/update-product-variant-dto';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { variantCreateSchema, variantUpdateSchema } from '../common/request-schemas';

type StaffRequest = { user: { id: string; databaseRole: UserRole } };

@Controller('product-variants')
export class ProductVariantsController {
	constructor(private readonly productVariantsService: ProductVariantsService) {}

	@Get()
	async findAll() {
		return await this.productVariantsService.findAll();
	}

	@Get('inventory/all')
	@UseGuards(JwtAuthGuard)
	async findAllInventory() {
		return await this.productVariantsService.findAllInventory();
	}

	@Get('inventory/:id')
	@UseGuards(JwtAuthGuard)
	async findOneInventory(@Param('id') id: string) {
		return await this.productVariantsService.findOneInventory(id);
	}

	@Get(':id')
	async findOne(@Param('id') id: string) {
		return await this.productVariantsService.findOne(id);
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	async create(@Body(new ZodValidationPipe(variantCreateSchema)) createProductVariantDto: CreateProductVariantDTO, @Req() req: StaffRequest) {
		return await this.productVariantsService.create(createProductVariantDto, req.user.databaseRole);
	}

	@Put(':id')
	@UseGuards(JwtAuthGuard)
	async update(@Param('id') id: string, @Body(new ZodValidationPipe(variantUpdateSchema)) updateProductVariantDto: UpdateProductVariantDTO, @Req() req: StaffRequest) {
		return await this.productVariantsService.update(id, updateProductVariantDto, req.user.databaseRole);
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(JwtAuthGuard)
	async remove(@Param('id') id: string, @Req() req: StaffRequest) {
		await this.productVariantsService.remove(id, req.user.databaseRole);
	}
}
