import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Etudiant } from '../etudiant/etudiant.entity';
import { StudyModule } from '../modules/modules.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { Note } from './notes.entity';

@Injectable()
export class NoteService {
    constructor(
        @InjectRepository(Note)
        private readonly noteRepository: Repository<Note>,
        @InjectRepository(Etudiant)
        private readonly etudiantRepository: Repository<Etudiant>,
        @InjectRepository(StudyModule)
        private readonly moduleRepository: Repository<StudyModule>,
    ) { }

    async create(createNoteDto: CreateNoteDto): Promise<Note> {
        const { etudiantId, moduleId, ...noteData } = createNoteDto;

        const etudiant = await this.etudiantRepository.findOneBy({ id: etudiantId });
        if (!etudiant) throw new NotFoundException(`Etudiant with ID ${etudiantId} not found`);

        const module = await this.moduleRepository.findOneBy({ id: moduleId });
        if (!module) throw new NotFoundException(`Module with ID ${moduleId} not found`);

        const note = this.noteRepository.create({
            ...noteData,
            etudiant,
            module,
        });

        return this.noteRepository.save(note);
    }

    async findAll(): Promise<Note[]> {
        return this.noteRepository.find({
            relations: ['etudiant', 'module'],
        });
    }

    async findOne(id: string): Promise<Note> {
        const note = await this.noteRepository.findOne({
            where: { id },
            relations: ['etudiant', 'module'],
        });

        if (!note) {
            throw new NotFoundException(`Note with ID ${id} not found`);
        }

        return note;
    }

    async update(id: string, updateNoteDto: UpdateNoteDto): Promise<Note> {
        const existingNote = await this.noteRepository.findOne({
            where: { id },
            relations: ['etudiant', 'module'],
        });

        if (!existingNote) {
            throw new NotFoundException(`Note with ID ${id} not found`);
        }

        const { etudiantId, moduleId, ...noteData } = updateNoteDto;

        let etudiant = existingNote.etudiant;
        if (etudiantId && etudiantId !== etudiant.id) {
            etudiant = await this.etudiantRepository.findOneBy({ id: etudiantId });
            if (!etudiant) throw new NotFoundException(`Etudiant with ID ${etudiantId} not found`);
        }

        let module = existingNote.module;
        if (moduleId && moduleId !== module.id) {
            module = await this.moduleRepository.findOneBy({ id: moduleId });
            if (!module) throw new NotFoundException(`Module with ID ${moduleId} not found`);
        }

        const updatedNote = this.noteRepository.merge(existingNote, {
            ...noteData,
            etudiant,
            module,
        });

        return this.noteRepository.save(updatedNote);
    }

    async remove(id: string): Promise<void> {
        const result = await this.noteRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Note with ID ${id} not found`);
        }
    }

    async getNotesByStudent(studentId: string): Promise<Note[]> {
        return this.noteRepository.find({
            where: { etudiant: { id: studentId } },
            relations: ['module'],
        });
    }

    async getNotesByModule(moduleId: string): Promise<Note[]> {
        return this.noteRepository.find({
            where: { module: { id: moduleId } },
            relations: ['etudiant'],
        });
    }

    async getStudentNotesForModule(studentId: string, moduleId: string): Promise<Note[]> {
        return this.noteRepository.find({
            where: {
                etudiant: { id: studentId },
                module: { id: moduleId }
            },
        });
    }
}