import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enseignant } from './enseignant.entity';
import { StudyModule } from '../modules/modules.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { CreateEnseignantDto } from './dto/create-enseignant.dto';
import { AssignModulesDto } from './dto/assign-modules.dto';
import { UpdateEnseignantDto } from './dto/update-enseignant.dto';

@Injectable()
export class EnseignantService {
    constructor(
        @InjectRepository(Enseignant)
        private readonly enseignantRepository: Repository<Enseignant>,
        @InjectRepository(StudyModule)
        private readonly moduleRepository: Repository<StudyModule>,
        @InjectRepository(Schedule)
        private readonly scheduleRepository: Repository<Schedule>,
    ) { }

    async create(createEnseignantDto: CreateEnseignantDto): Promise<Enseignant> {
        const enseignant = this.enseignantRepository.create(createEnseignantDto);
        return await this.enseignantRepository.save(enseignant);
    }

    async findAll(): Promise<Enseignant[]> {
        return await this.enseignantRepository.find({
            relations: ['modules', 'schedules'],
        });
    }

    async findOne(id: string): Promise<Enseignant> {
        const enseignant = await this.enseignantRepository.findOne({
            where: { id },
            relations: ['modules', 'schedules'],
        });

        if (!enseignant) {
            throw new NotFoundException(`Enseignant with ID ${id} not found`);
        }

        return enseignant;
    }

    async findByIdEnseignant(idEnseignant: string): Promise<Enseignant> {
        const enseignant = await this.enseignantRepository.findOne({
            where: { id_enseignant: idEnseignant },
            relations: ['modules', 'schedules'],
        });

        if (!enseignant) {
            throw new NotFoundException(`Enseignant with ID ${idEnseignant} not found`);
        }

        return enseignant;
    }

    async update(id: string, updateEnseignantDto: UpdateEnseignantDto): Promise<Enseignant> {
        const enseignant = await this.enseignantRepository.preload({
            id,
            ...updateEnseignantDto,
        });

        if (!enseignant) {
            throw new NotFoundException(`Enseignant with ID ${id} not found`);
        }

        return this.enseignantRepository.save(enseignant);
    }

    async remove(id: string): Promise<void> {
        const result = await this.enseignantRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Enseignant with ID ${id} not found`);
        }
    }

    async assignModules(id: string, assignModulesDto: AssignModulesDto): Promise<Enseignant> {
        const enseignant = await this.enseignantRepository.findOne({
            where: { id },
            relations: ['modules'],
        });
        if (!enseignant) {
            throw new NotFoundException(`Enseignant with ID ${id} not found`);
        }

        const modules = await this.moduleRepository.findByIds(assignModulesDto.moduleIds);
        if (modules.length !== assignModulesDto.moduleIds.length) {
            throw new NotFoundException('One or more modules not found');
        }

        enseignant.modules = modules;
        return this.enseignantRepository.save(enseignant);
    }

    async getSchedules(id: string): Promise<Schedule[]> {
        const enseignant = await this.enseignantRepository.findOne({
            where: { id },
            relations: ['schedules']
        });
        if (!enseignant) {
            throw new NotFoundException(`Enseignant with ID ${id} not found`);
        }
        return enseignant.schedules;
    }

    async getModules(id: string): Promise<StudyModule[]> {
        const enseignant = await this.enseignantRepository.findOne({
            where: { id },
            relations: ['modules'],
        });

        if (!enseignant) {
            throw new NotFoundException(`Enseignant with ID ${id} not found`);
        }

        return enseignant.modules;
    }
}