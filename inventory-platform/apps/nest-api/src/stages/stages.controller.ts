import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { CreateStageDTO } from './dto/create-stage-dto';
import { UpdateStageDTO } from './dto/update-stage-dto';
import { StagesService } from './stages.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { hierarchyCreateSchema, hierarchyUpdateSchema } from '../common/request-schemas';

@Controller('stages')
export class StagesController {

    constructor(private readonly stagesService: StagesService) {}

    //GET /stages
    //Get all stages
    @Get()
    findAll() {
        return this.stagesService.findAll();
    }
    
    //GET /stages/:id
    //Get a stage by id
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.stagesService.findOne(id);
    }

    //POST /stages
    //Create a new stage
    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body(new ZodValidationPipe(hierarchyCreateSchema)) createStageDto: CreateStageDTO) {
        return this.stagesService.create(createStageDto);
    }

    //PUT /stages/:id
    //Update a stage by id
    @Put(':id')
    @UseGuards(JwtAuthGuard)
    update(@Param('id') id: string, @Body(new ZodValidationPipe(hierarchyUpdateSchema)) updateStageDto: UpdateStageDTO) {
        return this.stagesService.update(id, updateStageDto);
    }

    //DELETE /stages/:id
    //Delete a stage by id
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string) {
        return this.stagesService.remove(id);
    }
}
