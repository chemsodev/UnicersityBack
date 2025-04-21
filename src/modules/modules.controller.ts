import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
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
    async findOne(@Param('id') id: string): Promise<StudyModule> {
        return this.studyModuleService.findOne(id);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateStudyModuleDto: UpdateStudyModuleDto,
    ): Promise<StudyModule> {
        return this.studyModuleService.update(id, updateStudyModuleDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return this.studyModuleService.remove(id);
    }

    @Post(':id/assign-teachers')
    async assignTeachers(
        @Param('id') id: string,
        @Body() assignTeachersDto: AssignTeachersDto,
    ): Promise<StudyModule> {
        return this.studyModuleService.assignTeachers(id, assignTeachersDto);
    }

    @Post(':id/assign-sections')
    async assignSections(
        @Param('id') id: string,
        @Body() assignSectionsDto: AssignSectionsDto,
    ): Promise<StudyModule> {
        return this.studyModuleService.assignSections(id, assignSectionsDto);
    }

    @Get('by-teacher/:teacherId')
    async getModulesByTeacher(@Param('teacherId') teacherId: string): Promise<StudyModule[]> {
        return this.studyModuleService.getModulesByTeacher(teacherId);
    }

    @Get('by-section/:sectionId')
    async getModulesBySection(@Param('sectionId') sectionId: string): Promise<StudyModule[]> {
        return this.studyModuleService.getModulesBySection(sectionId);
    }
}