import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { TaxonomyOwnerType, type UserRole } from '@workspace/db';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { CreateStageDTO } from './dto/create-stage-dto';
import { UpdateStageDTO } from './dto/update-stage-dto';
import { StagesService } from './stages.service';
import { TaxonomyLinksService, type TaxonomyLinksInput } from '../taxonomy-links/taxonomy-links.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { hierarchyCreateSchema, hierarchyImageSchema, hierarchyUpdateSchema, taxonomyLinksReplaceSchema } from '../common/request-schemas';

type StaffRequest = { user: { id: string; databaseRole: UserRole } };

@Controller('stages')
export class StagesController {

    constructor(
        private readonly stagesService: StagesService,
        private readonly taxonomyLinks: TaxonomyLinksService,
    ) {}

    //GET /stages
    //Get all stages, each with its category links
    @Get()
    findAll() {
        return this.stagesService.findAll();
    }

    //GET /stages/:id/category-links
    @Get(':id/category-links')
    listCategoryLinks(@Param('id') id: string) {
        return this.taxonomyLinks.list(TaxonomyOwnerType.STAGE, id);
    }

    //PUT /stages/:id/category-links
    //Replaces the whole mapping for this stage
    @Put(':id/category-links')
    @UseGuards(JwtAuthGuard)
    replaceCategoryLinks(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(taxonomyLinksReplaceSchema)) body: TaxonomyLinksInput,
        @Req() req: StaffRequest,
    ) {
        return this.taxonomyLinks.replace(TaxonomyOwnerType.STAGE, id, body, req.user.databaseRole);
    }

    //PUT /stages/:id/image
    @Put(':id/image')
    @UseGuards(JwtAuthGuard)
    setImage(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(hierarchyImageSchema)) body: { imageUrl: string | null },
        @Req() req: StaffRequest,
    ) {
        return this.stagesService.setImage(id, body.imageUrl, req.user.databaseRole);
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
    create(@Body(new ZodValidationPipe(hierarchyCreateSchema)) createStageDto: CreateStageDTO, @Req() req: StaffRequest) {
        return this.stagesService.create(createStageDto, req.user.databaseRole);
    }

    //PUT /stages/:id
    //Update a stage by id
    @Put(':id')
    @UseGuards(JwtAuthGuard)
    update(@Param('id') id: string, @Body(new ZodValidationPipe(hierarchyUpdateSchema)) updateStageDto: UpdateStageDTO, @Req() req: StaffRequest) {
        return this.stagesService.update(id, updateStageDto, req.user.databaseRole);
    }

    //DELETE /stages/:id
    //Delete a stage by id
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string, @Req() req: StaffRequest) {
        return this.stagesService.remove(id, req.user.databaseRole);
    }
}
