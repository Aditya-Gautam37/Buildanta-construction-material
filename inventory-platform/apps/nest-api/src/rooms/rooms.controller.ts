import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { TaxonomyOwnerType, type UserRole } from '@workspace/db';
import { CreateRoomDTO } from './dto/create-room-dto';
import { UpdateRoomDTO } from './dto/update-room-dto';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { RoomsService } from './rooms.service';
import { TaxonomyLinksService, type TaxonomyLinksInput } from '../taxonomy-links/taxonomy-links.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { hierarchyCreateSchema, hierarchyImageSchema, hierarchyUpdateSchema, taxonomyLinksReplaceSchema } from '../common/request-schemas';

type StaffRequest = { user: { id: string; databaseRole: UserRole } };

@Controller('rooms')
export class RoomsController {
    constructor(
        private readonly roomsService: RoomsService,
        private readonly taxonomyLinks: TaxonomyLinksService,
    ) {}

    //GET /rooms
    //Get all rooms, each with its category links
    @Get()
    findAll() {
        return this.roomsService.findAll();
    }

    //GET /rooms/:id/category-links
    //The curated category mapping that drives the guided wizard
    @Get(':id/category-links')
    listCategoryLinks(@Param('id') id: string) {
        return this.taxonomyLinks.list(TaxonomyOwnerType.ROOM, id);
    }

    //PUT /rooms/:id/category-links
    //Replaces the whole mapping for this room
    @Put(':id/category-links')
    @UseGuards(JwtAuthGuard)
    replaceCategoryLinks(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(taxonomyLinksReplaceSchema)) body: TaxonomyLinksInput,
        @Req() req: StaffRequest,
    ) {
        return this.taxonomyLinks.replace(TaxonomyOwnerType.ROOM, id, body, req.user.databaseRole);
    }

    //PUT /rooms/:id/image
    @Put(':id/image')
    @UseGuards(JwtAuthGuard)
    setImage(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(hierarchyImageSchema)) body: { imageUrl: string | null },
        @Req() req: StaffRequest,
    ) {
        return this.roomsService.setImage(id, body.imageUrl, req.user.databaseRole);
    }

    //GET /rooms/:id
    //Get a room by id
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.roomsService.findOne(id);
    }

    //POST /rooms
    //Create a new room
    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body(new ZodValidationPipe(hierarchyCreateSchema)) createRoomDto: CreateRoomDTO, @Req() req: StaffRequest) {
        return this.roomsService.create(createRoomDto, req.user.databaseRole);
    }

    //PUT /rooms/:id
    //Update a room by id
    @Put(':id')
    @UseGuards(JwtAuthGuard)
    update(@Param('id') id: string, @Body(new ZodValidationPipe(hierarchyUpdateSchema)) updateRoomDto: UpdateRoomDTO, @Req() req: StaffRequest) {
        return this.roomsService.update(id, updateRoomDto, req.user.databaseRole);
    }

    //DELETE /rooms/:id
    //Delete a room by id
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string, @Req() req: StaffRequest) {
        return this.roomsService.remove(id, req.user.databaseRole);
    }
}
