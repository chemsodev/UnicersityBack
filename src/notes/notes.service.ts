import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Etudiant } from "../etudiant/etudiant.entity";
import { StudyModule } from "../modules/modules.entity";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";
import { Note } from "./notes.entity";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/notification.entity";
import { toNumberId, toNumberOrStringId } from "../utils/id-conversion.util";

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(Etudiant)
    private readonly etudiantRepository: Repository<Etudiant>,
    @InjectRepository(StudyModule)
    private readonly moduleRepository: Repository<StudyModule>,
    private readonly notificationsService: NotificationsService
  ) {}

  async create(createNoteDto: CreateNoteDto): Promise<Note> {
    const { value, etudiantId, moduleId } = createNoteDto;
    const entityId = toNumberOrStringId(etudiantId);

    // Validate grade range
    if (value < 0 || value > 20) {
      throw new BadRequestException("La note doit être comprise entre 0 et 20");
    }

    const etudiant = await this.etudiantRepository.findOne({
      where: { id: entityId as any },
      relations: ["sections"],
    });

    if (!etudiant) {
      throw new NotFoundException("Étudiant non trouvé");
    }

    const module = await this.moduleRepository.findOne({
      where: { id: moduleId },
      relations: ["sections"],
    });

    if (!module) {
      throw new NotFoundException("Module non trouvé");
    }

    // Validate that student is enrolled in a section that has this module
    const studentSectionIds = etudiant.sections.map((s) => s.id);
    const moduleSectionIds = module.sections.map((s) => s.id);
    const hasCommonSection = studentSectionIds.some((id) =>
      moduleSectionIds.includes(id)
    );

    if (!hasCommonSection) {
      throw new BadRequestException(
        "L'étudiant n'est pas inscrit dans une section qui suit ce module"
      );
    }

    const note = this.noteRepository.create({
      value,
      etudiant,
      module,
    });

    const savedNote = await this.noteRepository.save(note);

    // Create notification for the student
    await this.notificationsService.create({
      title: `Nouvelle note - ${module.name}`,
      content: `Une nouvelle note a été publiée pour le module ${module.name}. Votre note est: ${createNoteDto.value}/20.`,
      type: NotificationType.EXAMEN,
      userId: createNoteDto.etudiantId,
    });

    return savedNote;
  }

  async findAll(): Promise<Note[]> {
    return this.noteRepository.find({
      relations: ["etudiant", "module"],
    });
  }

  async findOne(id: number): Promise<Note> {
    const note = await this.noteRepository.findOne({
      where: { id },
      relations: ["etudiant", "module"],
    });

    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }

    return note;
  }

  async update(id: number, updateNoteDto: UpdateNoteDto): Promise<Note> {
    const existingNote = await this.noteRepository.findOne({
      where: { id },
      relations: ["etudiant", "module"],
    });

    if (!existingNote) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }

    const { etudiantId, moduleId, ...noteData } = updateNoteDto;

    let etudiant = existingNote.etudiant;
    if (etudiantId) {
      const entityId = toNumberOrStringId(etudiantId);
      if (entityId !== etudiant.id) {
        etudiant = await this.etudiantRepository.findOneBy({
          id: entityId as any,
        });
        if (!etudiant)
          throw new NotFoundException(
            `Etudiant with ID ${etudiantId} not found`
          );
      }
    }

    let module = existingNote.module;
    if (moduleId && moduleId !== module.id) {
      module = await this.moduleRepository.findOneBy({ id: moduleId });
      if (!module)
        throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    const updatedNote = this.noteRepository.merge(existingNote, {
      ...noteData,
      etudiant,
      module,
    });

    const savedNote = await this.noteRepository.save(updatedNote);

    // Create notification for grade update
    await this.notificationsService.create({
      title: `Mise à jour de note - ${module.name}`,
      content: `Votre note pour le module ${module.name} a été mise à jour à: ${updateNoteDto.value}/20.`,
      type: NotificationType.EXAMEN,
      userId: etudiant.id,
    });

    return savedNote;
  }

  async remove(id: number): Promise<void> {
    const result = await this.noteRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
  }

  async getNotesByStudent(studentId: string): Promise<Note[]> {
    const entityId = toNumberOrStringId(studentId);

    return this.noteRepository.find({
      where: { etudiant: { id: entityId as any } },
      relations: ["module"],
    });
  }

  async getNotesByModule(moduleId: number): Promise<Note[]> {
    const module = await this.moduleRepository.findOneBy({ id: moduleId });
    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    return await this.noteRepository.find({
      where: { module: { id: moduleId } },
      relations: ["etudiant", "module"],
    });
  }

  async getStudentNotesForModule(
    studentId: string,
    moduleId: number
  ): Promise<Note[]> {
    const entityId = toNumberOrStringId(studentId);

    return this.noteRepository.find({
      where: {
        etudiant: { id: entityId as any },
        module: { id: moduleId },
      },
      relations: ["module"],
    });
  }

  async calculateModuleAverage(moduleId: number): Promise<{
    average: number;
    min: number;
    max: number;
    count: number;
  }> {
    const notes = await this.noteRepository.find({
      where: { module: { id: moduleId } },
    });

    if (notes.length === 0) {
      return { average: 0, min: 0, max: 0, count: 0 };
    }

    const values: number[] = notes.map((note) => note.value);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = sum / values.length;

    return {
      average,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  async calculateStudentAverage(studentId: string): Promise<{
    average: number;
    moduleAverages: { moduleId: number; average: number }[];
  }> {
    const entityId = toNumberOrStringId(studentId);

    const notes = await this.noteRepository.find({
      where: { etudiant: { id: entityId as any } },
      relations: ["module"],
    });

    if (notes.length === 0) {
      return { average: 0, moduleAverages: [] };
    }

    // Group notes by module
    const moduleNotes: Record<number, number[]> = notes.reduce((acc, note) => {
      const moduleId = note.module.id;
      if (!acc[moduleId]) {
        acc[moduleId] = [];
      }
      acc[moduleId].push(note.value);
      return acc;
    }, {} as Record<number, number[]>);

    // Calculate average for each module considering coefficients
    const moduleAverages = await Promise.all(
      Object.entries(moduleNotes).map(
        async ([moduleId, values]: [string, number[]]) => {
          const module = await this.moduleRepository.findOneBy({
            id: parseInt(moduleId, 10),
          });
          if (!module) {
            throw new NotFoundException(`Module with ID ${moduleId} not found`);
          }
          const average = values.reduce((a, b) => a + b, 0) / values.length;
          return {
            moduleId: parseInt(moduleId, 10),
            average,
            coefficient: module.coefficient,
          };
        }
      )
    );

    // Calculate overall weighted average
    const totalCoefficient = moduleAverages.reduce(
      (sum, m) => sum + m.coefficient,
      0
    );
    const weightedSum = moduleAverages.reduce(
      (sum, m) => sum + m.average * m.coefficient,
      0
    );

    return {
      average: weightedSum / totalCoefficient,
      moduleAverages: moduleAverages.map(({ moduleId, average }) => ({
        moduleId,
        average,
      })),
    };
  }

  async findByEtudiantAndModule(
    etudiantId: string,
    moduleId: number
  ): Promise<Note[]> {
    const module = await this.moduleRepository.findOneBy({ id: moduleId });
    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    const entityId = toNumberOrStringId(etudiantId);

    return await this.noteRepository.find({
      where: {
        etudiant: { id: entityId as any },
        module: { id: moduleId },
      },
      relations: ["etudiant", "module"],
    });
  }

  async createForEtudiant(
    etudiantId: string,
    moduleId: number,
    createNoteDto: CreateNoteDto
  ): Promise<Note> {
    const module = await this.moduleRepository.findOneBy({ id: moduleId });
    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }

    const entityId = toNumberOrStringId(etudiantId);

    const etudiant = await this.etudiantRepository.findOneBy({
      id: entityId as any,
    });
    if (!etudiant) {
      throw new NotFoundException(`Etudiant with ID ${etudiantId} not found`);
    }

    const note = this.noteRepository.create({
      ...createNoteDto,
      etudiant,
      module,
    });

    return await this.noteRepository.save(note);
  }

  async updateForEtudiant(
    etudiantId: string,
    moduleId: number,
    updateNoteDto: UpdateNoteDto
  ): Promise<Note> {
    const entityId = toNumberOrStringId(etudiantId);

    const note = await this.noteRepository.findOne({
      where: {
        etudiant: { id: entityId as any },
        module: { id: moduleId },
      },
      relations: ["etudiant", "module"],
    });

    if (!note) {
      throw new NotFoundException(`Note not found for module ${moduleId}`);
    }

    Object.assign(note, updateNoteDto);
    return await this.noteRepository.save(note);
  }

  async removeForEtudiant(etudiantId: string, moduleId: number): Promise<void> {
    const entityId = toNumberOrStringId(etudiantId);

    const note = await this.noteRepository.findOne({
      where: {
        etudiant: { id: entityId as any },
        module: { id: moduleId },
      },
      relations: ["etudiant", "module"],
    });

    if (!note) {
      throw new NotFoundException(`Note not found for module ${moduleId}`);
    }

    await this.noteRepository.remove(note);
  }

  async findAllByStudentId(etudiantId: string): Promise<Note[]> {
    const entityId = toNumberOrStringId(etudiantId);

    const etudiant = await this.etudiantRepository.findOne({
      where: { id: entityId as any },
    });

    if (!etudiant) {
      throw new NotFoundException(`Student with ID ${etudiantId} not found`);
    }

    return await this.noteRepository.find({
      where: { etudiant: { id: entityId as any } },
      relations: ["etudiant", "module"],
    });
  }

  async findByModuleAndStudent(
    moduleId: number,
    studentId: string
  ): Promise<Note> {
    const entityId = toNumberOrStringId(studentId);

    const note = await this.noteRepository.findOne({
      where: {
        module: { id: moduleId },
        etudiant: { id: entityId as any },
      },
      relations: ["etudiant", "module"],
    });

    if (!note) {
      throw new NotFoundException(
        `Note for module ${moduleId} and student ${studentId} not found`
      );
    }

    return note;
  }

  async getStudentNotesWithModules(studentId: string): Promise<any[]> {
    const entityId = toNumberOrStringId(studentId);

    const notes = await this.noteRepository.find({
      where: { etudiant: { id: entityId as any } },
      relations: ["module"],
    });

    return notes;
  }

  async updateNote(
    noteId: number,
    etudiantId: string,
    moduleId: number,
    updateNoteDto: UpdateNoteDto
  ): Promise<Note> {
    const entityId = toNumberOrStringId(etudiantId);

    // Check if the student exists
    const etudiant = await this.etudiantRepository.findOneBy({
      id: entityId as any,
    });

    if (!etudiant) {
      throw new NotFoundException(`Student with ID ${etudiantId} not found`);
    }

    // Find the note to update
    const note = await this.noteRepository.findOne({
      where: {
        id: noteId,
        etudiant: { id: entityId as any },
        module: { id: moduleId },
      },
      relations: ["etudiant", "module"],
    });

    if (!note) {
      throw new NotFoundException(`Note not found for student and module`);
    }

    // Update the note
    Object.assign(note, updateNoteDto);
    return await this.noteRepository.save(note);
  }

  async updateModuleNotes(
    moduleId: number,
    etudiantId: string,
    updateNoteDto: UpdateNoteDto
  ): Promise<Note> {
    const entityId = toNumberOrStringId(etudiantId);

    const note = await this.noteRepository.findOne({
      where: {
        etudiant: { id: entityId as any },
        module: { id: moduleId },
      },
      relations: ["etudiant", "module"],
    });

    if (!note) {
      throw new NotFoundException(`Note not found for module ${moduleId}`);
    }

    // Update the note
    Object.assign(note, updateNoteDto);
    return await this.noteRepository.save(note);
  }
}
