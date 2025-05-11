import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    ParseIntPipe,
} from '@nestjs/common';
import { StudyModuleService } from './modules.service';
import { CreateStudyModuleDto } from './dot/create-study-module.dto';
import { StudyModule } from './modules.entity';
import { UpdateStudyModuleDto } from './dot/update-study-module.dto';
import { AssignTeachersDto } from './dot/assign-teachers.dto';
import { AssignSectionsDto } from './dot/assign-sections.dto';

@Controller('study-modules')
export class StudyModuleController {
    constructor(private readonly studyModuleService: StudyModuleService) { }

    @Post()
    async create(@Body() createStudyModuleDto: CreateStudyModuleDto): Promise<StudyModule> {
        return this.studyModuleService.create(createStudyModuleDto);
    }

    @Get()
    async findAll(): Promise<StudyModule[]> {
        return this.studyModuleService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<StudyModule> {
        return this.studyModuleService.findOne(id);
    }

    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateStudyModuleDto: UpdateStudyModuleDto,
    ): Promise<StudyModule> {
        return this.studyModuleService.update(id, updateStudyModuleDto);
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.studyModuleService.remove(id);
    }

    @Post(':id/assign-teachers')
    async assignTeachers(
        @Param('id', ParseIntPipe) id: number,
        @Body() assignTeachersDto: AssignTeachersDto,
    ): Promise<StudyModule> {
        return this.studyModuleService.assignTeachers(id, assignTeachersDto);
    }

    @Post(':id/assign-sections')
    async assignSections(
        @Param('id', ParseIntPipe) id: number,
        @Body() assignSectionsDto: AssignSectionsDto,
    ): Promise<StudyModule> {
        return this.studyModuleService.assignSections(id, assignSectionsDto);
    }

    @Get('by-teacher/:teacherId')
    async getModulesByTeacher(@Param('teacherId', ParseIntPipe) teacherId: number): Promise<StudyModule[]> {
        return this.studyModuleService.getModulesByTeacher(teacherId);
    }

    @Get('by-section/:sectionId')
    async getModulesBySection(@Param('sectionId', ParseIntPipe) sectionId: number): Promise<StudyModule[]> {
        return this.studyModuleService.getModulesBySection(sectionId);
    }
}