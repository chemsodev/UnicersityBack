// src/section/section.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Section } from './section.entity';
import { Department } from '../departments/departments.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Groupe } from '../groupe/groupe.entity';
import { StudyModule } from '../modules/modules.entity';
import { CreateSectionDto } from './create-section.dto';
import { UpdateSectionDto } from './update-section.dto';

@Injectable()
export class SectionService {
    constructor(
        @InjectRepository(Section)
        private readonly sectionRepo: Repository<Section>,
        @InjectRepository(Department)
        private readonly departmentRepo: Repository<Department>,
        @InjectRepository(Etudiant)
        private readonly etudiantRepo: Repository<Etudiant>,
        @InjectRepository(Groupe)
        private readonly groupeRepo: Repository<Groupe>,
        @InjectRepository(StudyModule)
        private readonly moduleRepo: Repository<StudyModule>,
    ) { }

    async create(createSectionDto: CreateSectionDto): Promise<Section> {
        const department = await this.departmentRepo.findOneBy({ id: createSectionDto.departmentId });
        if (!department) {
            throw new NotFoundException('Department not found');
        }

        const section = this.sectionRepo.create({
            ...createSectionDto,
            department,
        });

        return this.sectionRepo.save(section);
    }

    findAll(departmentId?: string, level?: string, specialty?: string): Promise<Section[]> {
        const query = this.sectionRepo.createQueryBuilder('section')
            .leftJoinAndSelect('section.department', 'department');

        if (departmentId) {
            query.where('section.departmentId = :departmentId', { departmentId });
        }
        if (level) {
            query.andWhere('section.level = :level', { level });
        }
        if (specialty) {
            query.andWhere('section.specialty = :specialty', { specialty });
        }

        return query.getMany();
    }

    findOne(id: string): Promise<Section> {
        return this.sectionRepo.findOne({
            where: { id },
            relations: ['department', 'groupes', 'etudiants', 'modules']
        });
    }

    async findStudents(id: string): Promise<Etudiant[]> {
        const section = await this.sectionRepo.findOne({
            where: { id },
            relations: ['etudiants']
        });
        if (!section) {
            throw new NotFoundException('Section not found');
        }
        return section.etudiants;
    }

    async findGroups(id: string): Promise<Groupe[]> {
        return this.groupeRepo.find({
            where: { section: { id } },
            relations: ['section']
        });
    }

    async findModules(id: string): Promise<StudyModule[]> {
        const section = await this.sectionRepo.findOne({
            where: { id },
            relations: ['modules']
        });
        if (!section) {
            throw new NotFoundException('Section not found');
        }
        return section.modules;
    }

    async update(id: string, updateSectionDto: UpdateSectionDto): Promise<Section> {
        const section = await this.sectionRepo.findOneBy({ id });
        if (!section) {
            throw new NotFoundException('Section not found');
        }

        if (updateSectionDto.departmentId) {
            const department = await this.departmentRepo.findOneBy({ id: updateSectionDto.departmentId });
            if (!department) {
                throw new NotFoundException('Department not found');
            }
            section.department = department;
        }

        Object.assign(section, updateSectionDto);
        return this.sectionRepo.save(section);
    }

    async remove(id: string): Promise<void> {
        const result = await this.sectionRepo.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException('Section not found');
        }
    }
}