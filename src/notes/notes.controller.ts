import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Patch,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { Note } from './notes.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteService } from './notes.service';
import { UpdateNoteDto } from './dto/update-note.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { AdminRole } from '../user.entity';

@Controller('notes')
@UseGuards(AuthGuard)
export class NoteController {
    constructor(private readonly noteService: NoteService) {}

    @Post()
    @UseGuards(RolesGuard)
    @Roles(AdminRole.ENSEIGNANT)
    create(@Body() createNoteDto: CreateNoteDto) {
        return this.noteService.create(createNoteDto);
    }

    @Get()
    @UseGuards(RolesGuard)
    @Roles(AdminRole.ENSEIGNANT, AdminRole.CHEF_DE_DEPARTEMENT)
    findAll() {
        return this.noteService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.noteService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles(AdminRole.ENSEIGNANT)
    update(@Param('id', ParseIntPipe) id: number, @Body() updateNoteDto: UpdateNoteDto) {
        return this.noteService.update(id, updateNoteDto);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(AdminRole.ENSEIGNANT)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.noteService.remove(id);
    }

    @Get('by-student/:studentId')
    async getByStudent(@Param('studentId') studentId: string): Promise<Note[]> {
        return this.noteService.getNotesByStudent(studentId);
    }

    @Get('by-module/:moduleId')
    async getByModule(@Param('moduleId', ParseIntPipe) moduleId: number): Promise<Note[]> {
        return this.noteService.getNotesByModule(moduleId);
    }

    @Get('for-student/:studentId/module/:moduleId')
    async getStudentModuleNotes(
        @Param('studentId') studentId: string,
        @Param('moduleId', ParseIntPipe) moduleId: number,
    ): Promise<Note[]> {
        return this.noteService.getStudentNotesForModule(studentId, moduleId);
    }

    @Get('module/:moduleId/statistics')
    @UseGuards(RolesGuard)
    @Roles(AdminRole.ENSEIGNANT, AdminRole.CHEF_DE_DEPARTEMENT)
    async getModuleStatistics(@Param('moduleId', ParseIntPipe) moduleId: number) {
        return this.noteService.calculateModuleAverage(moduleId);
    }

    @Get('student/:studentId/average')
    async getStudentAverage(@Param('studentId') studentId: string) {
        return this.noteService.calculateStudentAverage(studentId);
    }
}