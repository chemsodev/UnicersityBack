import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
} from '@nestjs/common';
import { ScheduleService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { Schedule } from './schedules.entity';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Controller('schedules')
export class ScheduleController {
    constructor(private readonly scheduleService: ScheduleService) { }

    @Post()
    async create(@Body() createScheduleDto: CreateScheduleDto): Promise<Schedule> {
        return this.scheduleService.create(createScheduleDto);
    }

    @Get()
    async findAll(): Promise<Schedule[]> {
        return this.scheduleService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Schedule> {
        return this.scheduleService.findOne(id);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateScheduleDto: UpdateScheduleDto,
    ): Promise<Schedule> {
        return this.scheduleService.update(id, updateScheduleDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return this.scheduleService.remove(id);
    }

    @Get('by-module/:moduleId')
    async getByModule(@Param('moduleId') moduleId: string): Promise<Schedule[]> {
        return this.scheduleService.getSchedulesByModule(moduleId);
    }

    @Get('by-section/:sectionId')
    async getBySection(@Param('sectionId') sectionId: string): Promise<Schedule[]> {
        return this.scheduleService.getSchedulesBySection(sectionId);
    }

    @Get('by-teacher/:teacherId')
    async getByTeacher(@Param('teacherId') teacherId: string): Promise<Schedule[]> {
        return this.scheduleService.getSchedulesByTeacher(teacherId);
    }

    @Get('by-student/:studentId')
    async getByStudent(@Param('studentId') studentId: string): Promise<Schedule[]> {
        return this.scheduleService.getSchedulesByStudent(studentId);
    }
}