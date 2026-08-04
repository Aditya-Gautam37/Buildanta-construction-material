import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CreateRoomDTO } from './dto/create-room-dto';
import { UpdateRoomDTO } from './dto/update-room-dto';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { RoomsService } from './rooms.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { hierarchyCreateSchema, hierarchyUpdateSchema } from '../common/request-schemas';

@Controller('rooms')
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) {}

    //GET /rooms
    //Get all rooms
    @Get()
    findAll() {
        return this.roomsService.findAll();
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
    create(@Body(new ZodValidationPipe(hierarchyCreateSchema)) createRoomDto: CreateRoomDTO) {
        return this.roomsService.create(createRoomDto);
    }

    //PUT /rooms/:id
    //Update a room by id
    @Put(':id')
    @UseGuards(JwtAuthGuard)
    update(@Param('id') id: string, @Body(new ZodValidationPipe(hierarchyUpdateSchema)) updateRoomDto: UpdateRoomDTO) {
        return this.roomsService.update(id, updateRoomDto);
    }

    //DELETE /rooms/:id
    //Delete a room by id
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(JwtAuthGuard)
    remove(@Param('id') id: string) {
        return this.roomsService.remove(id);
    }
}
