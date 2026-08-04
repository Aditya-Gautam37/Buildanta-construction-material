import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { UserRole } from '@workspace/db';
import { CreateCategoryDTO } from './dto/create-category-dto';
import { UpdateCategoryDTO } from './dto/update-category-dto';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { categoryCreateSchema, categoryUpdateSchema } from '../common/request-schemas';

type StaffRequest = { user: { id: string; databaseRole: UserRole } };

@Controller('categories')
export class CategoriesController {

    constructor(private readonly categoriesService: CategoriesService) {}

    //GET /categories
    //Gets all categories
    @Get()
    findAll() {
        return this.categoriesService.findAll();
    }

    @Get('inventory/all')
    @UseGuards(JwtAuthGuard)
    findInventory() {
        return this.categoriesService.findInventory();
    }

    //GET /categories/:id
    //Gets a category by id
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.categoriesService.findOne(id);
    }

    //POST /categories
    //Creates a new category
    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body(new ZodValidationPipe(categoryCreateSchema)) createCategoryDto: CreateCategoryDTO, @Req() req: StaffRequest) {
        return this.categoriesService.create(createCategoryDto, req.user.databaseRole);
    }

    //PUT /categories/:id
    //Updates a category by id
    @Put(':id')
    @UseGuards(JwtAuthGuard)
    update(@Param('id') id: string, @Body(new ZodValidationPipe(categoryUpdateSchema)) updateCategoryDto: UpdateCategoryDTO, @Req() req: StaffRequest) {
        return this.categoriesService.update(id, updateCategoryDto, req.user.databaseRole);
    }

    //DELETE /categories/:id
    //Deletes a category by id
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string, @Req() req: StaffRequest) {
        return this.categoriesService.remove(id, req.user.databaseRole);
    }

}
