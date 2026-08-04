import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { UserRole } from '@workspace/db';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { UpdateSupplierDTO } from './dto/update-supplier-dto';
import { CreateSupplierDTO } from './dto/create-supplier-dto';
import { SuppliersService } from './suppliers.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { supplierCreateSchema, supplierUpdateSchema } from '../common/request-schemas';

type StaffRequest = { user: { id: string; databaseRole: UserRole } };

@Controller('suppliers')
export class SuppliersController {
    constructor(private readonly suppliersService: SuppliersService) {}
    
    //GET /suppliers
    //Get all suppliers
    @Get()
    findAll() {
        return this.suppliersService.findAll();
    }

    //GET /suppliers/:id
    //Get a supplier by id
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.suppliersService.findOne(id);
    }

    //POST /suppliers
    //Create a new supplier
    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body(new ZodValidationPipe(supplierCreateSchema)) createSupplierDto: CreateSupplierDTO, @Req() req: StaffRequest) {
        return this.suppliersService.create(createSupplierDto, req.user.databaseRole);
    }

    //Put /suppliers/:id
    //Update a supplier by id
    @Put(':id')
    @UseGuards(JwtAuthGuard)
    update(@Param('id') id: string, @Body(new ZodValidationPipe(supplierUpdateSchema)) updateSupplierDto: UpdateSupplierDTO, @Req() req: StaffRequest) {
        return this.suppliersService.update(id, updateSupplierDto, req.user.databaseRole);
    }

     //DELETE /suppliers/:id
    //Delete a supplier by id
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string, @Req() req: StaffRequest) {
        return this.suppliersService.remove(id, req.user.databaseRole);
    }
}
