import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
} from '@nestjs/common';
import { Note } from './notes.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteService } from './notes.service';
import { UpdateNoteDto } from './dto/update-note.dto';

@Controller('notes')
export class NoteController {
    constructor(private readonly noteService: NoteService) { }

    @Post()
    async create(@Body() createNoteDto: CreateNoteDto): Promise<Note> {
        return this.noteService.create(createNoteDto);
    }

    @Get()
    async findAll(): Promise<Note[]> {
        return this.noteService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Note> {
        return this.noteService.findOne(id);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateNoteDto: UpdateNoteDto,
    ): Promise<Note> {
        return this.noteService.update(id, updateNoteDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return this.noteService.remove(id);
    }

    @Get('by-student/:studentId')
    async getByStudent(@Param('studentId') studentId: string): Promise<Note[]> {
        return this.noteService.getNotesByStudent(studentId);
    }

    @Get('by-module/:moduleId')
    async getByModule(@Param('moduleId') moduleId: string): Promise<Note[]> {
        return this.noteService.getNotesByModule(moduleId);
    }

    @Get('for-student/:studentId/module/:moduleId')
    async getStudentModuleNotes(
        @Param('studentId') studentId: string,
        @Param('moduleId') moduleId: string,
    ): Promise<Note[]> {
        return this.noteService.getStudentNotesForModule(studentId, moduleId);
    }
}