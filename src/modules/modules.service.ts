import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Enseignant } from '../enseignant/enseignant.entity';
import { Section } from '../section/section.entity';
import { StudyModule } from './modules.entity';
import { CreateStudyModuleDto } from './dot/create-study-module.dto';
import { UpdateStudyModuleDto } from './dot/update-study-module.dto';
import { AssignTeachersDto } from './dot/assign-teachers.dto';
import { AssignSectionsDto } from './dot/assign-sections.dto';

@Injectable()
export class StudyModuleService {
    constructor(
        @InjectRepository(StudyModule)
        private readonly studyModuleRepository: Repository<StudyModule>,
        @InjectRepository(Enseignant)
        private readonly enseignantRepository: Repository<Enseignant>,
        @InjectRepository(Section)
        private readonly sectionRepository: Repository<Section>,
    ) { }

    async create(createStudyModuleDto: CreateStudyModuleDto): Promise<StudyModule> {
        const module = this.studyModuleRepository.create(createStudyModuleDto);
        return await this.studyModuleRepository.save(module);
    }

    async findAll(): Promise<StudyModule[]> {
        return await this.studyModuleRepository.find({
            relations: ['enseignants', 'sections'],
        });
    }

    async findOne(id: string): Promise<StudyModule> {
        const module = await this.studyModuleRepository.findOne({
            where: { id },
            relations: ['enseignants', 'sections'],
        });

        if (!module) {
            throw new NotFoundException(`StudyModule with ID ${id} not found`);
        }

        return module;
    }

    async update(id: string, updateStudyModuleDto: UpdateStudyModuleDto): Promise<StudyModule> {
        const module = await this.studyModuleRepository.preload({
            id,
            ...updateStudyModuleDto,
        });

        if (!module) {
            throw new NotFoundException(`StudyModule with ID ${id} not found`);
        }

        return this.studyModuleRepository.save(module);
    }

    async remove(id: string): Promise<void> {
        const result = await this.studyModuleRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`StudyModule with ID ${id} not found`);
        }
    }

    async assignTeachers(id: string, assignTeachersDto: AssignTeachersDto): Promise<StudyModule> {
        const module = await this.findOne(id);
        const enseignants = await this.enseignantRepository.findBy({
            id: In(assignTeachersDto.teacherIds),
        });

        module.enseignants = enseignants;
        return this.studyModuleRepository.save(module);
    }

    async assignSections(id: string, assignSectionsDto: AssignSectionsDto): Promise<StudyModule> {
        const module = await this.findOne(id);
        const sections = await this.sectionRepository.findBy({
            id: In(assignSectionsDto.sectionIds),
        });

        module.sections = sections;
        return this.studyModuleRepository.save(module);
    }

    async getModulesByTeacher(teacherId: string): Promise<StudyModule[]> {
        return this.studyModuleRepository
            .createQueryBuilder('module')
            .innerJoin('module.enseignants', 'teacher')
            .where('teacher.id = :teacherId', { teacherId })
            .getMany();
    }

    async getModulesBySection(sectionId: string): Promise<StudyModule[]> {
        return this.studyModuleRepository
            .createQueryBuilder('module')
            .innerJoin('module.sections', 'section')
            .where('section.id = :sectionId', { sectionId })
            .getMany();
    }
}