import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { UserRole } from '@workspace/db';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { UpdateBrandDTO } from './dto/update-brand-dto';
import { CreateBrandDTO } from './dto/create-brand-dto';
import { BrandsService } from './brands.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { brandCreateSchema, brandUpdateSchema } from '../common/request-schemas';

type StaffRequest = { user: { id: string; databaseRole: UserRole } };

@Controller('brands')
export class BrandsController {

    constructor(private readonly brandsService: BrandsService) {}

    //GET /brands
    //Get all brands
    @Get()
    findAll() {
        return this.brandsService.findAll();
    }

    //GET /brands/:id
    //Get a brand by id
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.brandsService.findOne(id);
    }

    //POST /brands
    //Create a new brand
    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body(new ZodValidationPipe(brandCreateSchema)) createBrandDto: CreateBrandDTO, @Req() req: StaffRequest) {
        return this.brandsService.create(createBrandDto, req.user.databaseRole);
    }

    //PUT /brands/:id
    //Update a brand by id
    @Post(':id')
    @UseGuards(JwtAuthGuard)
    update(@Param('id') id: string, @Body(new ZodValidationPipe(brandUpdateSchema)) updateBrandDto: UpdateBrandDTO, @Req() req: StaffRequest) {
        return this.brandsService.update(id, updateBrandDto, req.user.databaseRole);
    }

    //DELETE /brands/:id
    //Delete a brand by id
    @Post(':id/delete')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string, @Req() req: StaffRequest) {
        return this.brandsService.remove(id, req.user.databaseRole);
    }
}
