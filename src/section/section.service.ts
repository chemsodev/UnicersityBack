// src/section/section.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Section } from './section.entity';
import { Department } from '../departments/departments.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Groupe } from '../groupe/groupe.entity';
import { StudyModule } from '../modules/modules.entity';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

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
        private readonly notificationsService: NotificationsService
    ) { }

    async create(createSectionDto: CreateSectionDto, adminId: string): Promise<Section> {
        const department = await this.departmentRepo.findOneBy({ id: createSectionDto.departmentId });
        if (!department) {
            throw new NotFoundException('Department not found');
        }

        const section = this.sectionRepo.create({
            ...createSectionDto,
            department,
        });

        const savedSection = await this.sectionRepo.save(section);

        await this.notificationsService.create({
            title: 'Nouvelle section créée',
            content: `Une nouvelle section ${savedSection.name} a été créée.`,
            type: NotificationType.ADMIN,
            userId: adminId
        });

        return savedSection;
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

    async update(id: string, updateSectionDto: UpdateSectionDto, adminId: string): Promise<Section> {
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
        const updatedSection = await this.sectionRepo.save(section);

        await this.notificationsService.create({
            title: 'Section mise à jour',
            content: `La section ${updatedSection.name} a été mise à jour.`,
            type: NotificationType.ADMIN,
            userId: adminId
        });

        return updatedSection;
    }

    async remove(id: string): Promise<void> {
        const result = await this.sectionRepo.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException('Section not found');
        }
    }

    async assignStudentToSection(sectionId: string, studentId: string): Promise<Section> {
        const section = await this.sectionRepo.findOne({
            where: { id: sectionId },
            relations: ['etudiants']
        });
        if (!section) throw new NotFoundException('Section not found');

        const studentExists = section.etudiants.some(e => e.id === studentId);
        if (!studentExists) {
            section.etudiants.push({ id: studentId } as any);
            await this.sectionRepo.save(section);

            // Create notification for the student
            await this.notificationsService.create({
                title: 'Affectation à une nouvelle section',
                content: `Vous avez été affecté(e) à la section ${section.name}. Consultez votre nouvel emploi du temps.`,
                type: NotificationType.ADMIN,
                userId: studentId
            });
        }

        return section;
    }

    async removeStudentFromSection(sectionId: string, studentId: string): Promise<Section> {
        const section = await this.sectionRepo.findOne({
            where: { id: sectionId },
            relations: ['etudiants']
        });
        if (!section) throw new NotFoundException('Section not found');

        section.etudiants = section.etudiants.filter(e => e.id !== studentId);
        const updatedSection = await this.sectionRepo.save(section);

        // Create notification for the student
        await this.notificationsService.create({
            title: 'Retrait de section',
            content: `Vous avez été retiré(e) de la section ${section.name}.`,
            type: NotificationType.ADMIN,
            userId: studentId
        });

        return updatedSection;
    }
}