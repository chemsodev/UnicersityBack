import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudyModule } from '../modules/modules.entity';
import { Section } from '../section/section.entity';
import { Enseignant } from '../enseignant/enseignant.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Schedule } from './schedules.entity';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class ScheduleService {
    constructor(
        @InjectRepository(Schedule)
        private readonly scheduleRepository: Repository<Schedule>,
        @InjectRepository(StudyModule)
        private readonly moduleRepository: Repository<StudyModule>,
        @InjectRepository(Section)
        private readonly sectionRepository: Repository<Section>,
        @InjectRepository(Enseignant)
        private readonly enseignantRepository: Repository<Enseignant>,
        @InjectRepository(Etudiant)
        private readonly etudiantRepository: Repository<Etudiant>,
    ) { }

    async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
        const { moduleId, sectionId, enseignantId, etudiantId, ...scheduleData } = createScheduleDto;

        const module = await this.moduleRepository.findOneBy({ id: moduleId });
        if (!module) throw new NotFoundException(`Module with ID ${moduleId} not found`);

        const section = await this.sectionRepository.findOneBy({ id: sectionId });
        if (!section) throw new NotFoundException(`Section with ID ${sectionId} not found`);

        const enseignant = await this.enseignantRepository.findOneBy({ id: enseignantId });
        if (!enseignant) throw new NotFoundException(`Enseignant with ID ${enseignantId} not found`);

        let etudiant: Etudiant | null = null;
        if (etudiantId) {
            etudiant = await this.etudiantRepository.findOneBy({ id: etudiantId });
            if (!etudiant) throw new NotFoundException(`Etudiant with ID ${etudiantId} not found`);
        }

        const schedule = this.scheduleRepository.create({
            ...scheduleData,
            module,
            section,
            enseignant,
            etudiant,
        });

        return this.scheduleRepository.save(schedule);
    }

    async findAll(): Promise<Schedule[]> {
        return this.scheduleRepository.find({
            relations: ['module', 'section', 'enseignant', 'etudiant'],
        });
    }

    async findOne(id: string): Promise<Schedule> {
        const schedule = await this.scheduleRepository.findOne({
            where: { id },
            relations: ['module', 'section', 'enseignant', 'etudiant'],
        });

        if (!schedule) {
            throw new NotFoundException(`Schedule with ID ${id} not found`);
        }

        return schedule;
    }

    async update(id: string, updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
        const existingSchedule = await this.scheduleRepository.findOneBy({ id });
        if (!existingSchedule) {
            throw new NotFoundException(`Schedule with ID ${id} not found`);
        }

        const { moduleId, sectionId, enseignantId, etudiantId, ...scheduleData } = updateScheduleDto;

        let module = existingSchedule.module;
        if (moduleId && moduleId !== module.id) {
            module = await this.moduleRepository.findOneBy({ id: moduleId });
            if (!module) throw new NotFoundException(`Module with ID ${moduleId} not found`);
        }

        let section = existingSchedule.section;
        if (sectionId && sectionId !== section.id) {
            section = await this.sectionRepository.findOneBy({ id: sectionId });
            if (!section) throw new NotFoundException(`Section with ID ${sectionId} not found`);
        }

        let enseignant = existingSchedule.enseignant;
        if (enseignantId && enseignantId !== enseignant.id) {
            enseignant = await this.enseignantRepository.findOneBy({ id: enseignantId });
            if (!enseignant) throw new NotFoundException(`Enseignant with ID ${enseignantId} not found`);
        }

        let etudiant = existingSchedule.etudiant;
        if (etudiantId !== undefined) {
            if (etudiantId === null) {
                etudiant = null;
            } else if (!etudiant || etudiantId !== etudiant.id) {
                etudiant = await this.etudiantRepository.findOneBy({ id: etudiantId });
                if (!etudiant) throw new NotFoundException(`Etudiant with ID ${etudiantId} not found`);
            }
        }

        const updatedSchedule = this.scheduleRepository.merge(existingSchedule, {
            ...scheduleData,
            module,
            section,
            enseignant,
            etudiant,
        });

        return this.scheduleRepository.save(updatedSchedule);
    }

    async remove(id: string): Promise<void> {
        const result = await this.scheduleRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Schedule with ID ${id} not found`);
        }
    }

    async getSchedulesByModule(moduleId: string): Promise<Schedule[]> {
        return this.scheduleRepository.find({
            where: { module: { id: moduleId } },
            relations: ['section', 'enseignant', 'etudiant'],
        });
    }

    async getSchedulesBySection(sectionId: string): Promise<Schedule[]> {
        return this.scheduleRepository.find({
            where: { section: { id: sectionId } },
            relations: ['module', 'enseignant', 'etudiant'],
        });
    }

    async getSchedulesByTeacher(teacherId: string): Promise<Schedule[]> {
        return this.scheduleRepository.find({
            where: { enseignant: { id: teacherId } },
            relations: ['module', 'section', 'etudiant'],
        });
    }

    async getSchedulesByStudent(studentId: string): Promise<Schedule[]> {
        return this.scheduleRepository.find({
            where: { etudiant: { id: studentId } },
            relations: ['module', 'section', 'enseignant'],
        });
    }
}