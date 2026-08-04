import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { UserRole } from '@workspace/db';
import { CreateProductDTO } from './dto/create-product-dto';
import { UpdateProductDto } from './dto/update-product-dto';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { productCreateSchema, productImagesUpdateSchema, productUpdateSchema } from '../common/request-schemas';

type StaffRequest = { user: { id: string; databaseRole: UserRole } };

@Controller('products')
export class ProductsController {

    constructor(private readonly productsService: ProductsService) {}
    
    //Get all products  
    //GET /products
    @Get()
    async findAll(): Promise<unknown[]> {
        return await this.productsService.findAll();
    }

    @Get('inventory/all')
    @UseGuards(JwtAuthGuard)
    async findAllInventory(): Promise<unknown[]> {
        return await this.productsService.findAllInventory();
    }

    @Get('inventory/:id')
    @UseGuards(JwtAuthGuard)
    async findOneInventory(@Param('id') id: string): Promise<unknown> {
        return await this.productsService.getInventoryDetails(id);
    }

    //Get a product by id
    //GET /products/:id
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<unknown> {
        return await this.productsService.getDetails(id);
    }

    //Create a new product
    //POST /products
    @Post()
    @UseGuards(JwtAuthGuard)
    async create(@Body(new ZodValidationPipe(productCreateSchema)) createProductDto: CreateProductDTO, @Req() req: StaffRequest) {
        return await this.productsService.create(createProductDto, req.user.databaseRole);
    }

    //Update a product by id
    //PUT /products/:id
    @Put(':id')
    @UseGuards(JwtAuthGuard)
    async update(@Param('id') id: string, @Body(new ZodValidationPipe(productUpdateSchema)) updateProductDto: UpdateProductDto, @Req() req: StaffRequest): Promise<unknown> {
        return await this.productsService.update(id, updateProductDto, req.user.databaseRole);
    }

    @Put(':id/images')
    @UseGuards(JwtAuthGuard)
    async updateImages(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(productImagesUpdateSchema)) input: { images: Array<{ id?: string; src: string; alt: string; sortOrder: number; primary: boolean; variantId?: string | null }> },
        @Req() req: StaffRequest,
    ): Promise<unknown> {
        return this.productsService.updateImages(id, input.images, req.user.databaseRole);
    }

    //Delete a product by id
    //DELETE /products/:id
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    async remove(@Param('id') id: string, @Req() req: StaffRequest) {
        await this.productsService.remove(id, req.user.databaseRole);
    }

}
