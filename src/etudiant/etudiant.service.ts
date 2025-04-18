import {
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Etudiant } from './etudiant.entity';
import { Repository, Like } from 'typeorm';
import { CreateEtudiantDto, UpdateEtudiantDto } from './create-etudiant.dto';

@Injectable()
export class EtudiantService {
    constructor(
        @InjectRepository(Etudiant)
        private readonly etudiantRepo: Repository<Etudiant>,
    ) { }

    async findAll(
        page: number = 1,
        limit: number = 10,
        search?: string
    ): Promise<Etudiant[]> {
        const skip = (page - 1) * limit;
        const query = this.etudiantRepo.createQueryBuilder('etudiant')
            .leftJoinAndSelect('etudiant.sections', 'sections')
            .leftJoinAndSelect('etudiant.notesReleve', 'notesReleve')
            .leftJoinAndSelect('etudiant.emplois', 'emplois')
            .take(limit)
            .skip(skip);

        if (search) {
            query.where([
                { firstName: Like(`%${search}%`) },
                { lastName: Like(`%${search}%`) },
                { matricule: Like(`%${search}%`) },
                { email: Like(`%${search}%`) }
            ]);
        }

        return query.getMany();
    }

    async findOne(id: string): Promise<Etudiant> {
        const etudiant = await this.etudiantRepo.findOne({
            where: { id },
            relations: ['sections', 'notesReleve', 'emplois']
        });

        if (!etudiant) {
            throw new NotFoundException(`Étudiant avec l'ID ${id} non trouvé`);
        }
        return etudiant;
    }

    async create(createEtudiantDto: CreateEtudiantDto): Promise<Etudiant> {
        // Check if matricule already exists
        const existingMatricule = await this.etudiantRepo.findOne({
            where: { matricule: createEtudiantDto.matricule }
        });

        if (existingMatricule) {
            throw new ConflictException('Un étudiant avec ce matricule existe déjà');
        }

        // Check if email already exists
        const existingEmail = await this.etudiantRepo.findOne({
            where: { email: createEtudiantDto.email }
        });

        if (existingEmail) {
            throw new ConflictException('Un étudiant avec cet email existe déjà');
        }

        try {
            const newEtudiant = this.etudiantRepo.create(createEtudiantDto);
            return await this.etudiantRepo.save(newEtudiant);
        } catch (error) {
            if (error.code === '23505') {
                throw new ConflictException('Données dupliquées');
            }
            throw new InternalServerErrorException("Échec de la création de l'étudiant");
        }
    }

    async update(id: string, updateEtudiantDto: UpdateEtudiantDto): Promise<Etudiant> {
        const existingEtudiant = await this.etudiantRepo.findOne({ where: { id } });

        if (!existingEtudiant) {
            throw new NotFoundException(`Étudiant avec l'ID ${id} non trouvé`);
        }

        // Check for duplicate matricule if it's being updated
        if (updateEtudiantDto.matricule && updateEtudiantDto.matricule !== existingEtudiant.matricule) {
            const matriculeExists = await this.etudiantRepo.findOne({
                where: { matricule: updateEtudiantDto.matricule }
            });
            if (matriculeExists) {
                throw new ConflictException('Un étudiant avec ce matricule existe déjà');
            }
        }

        // Check for duplicate email if it's being updated
        if (updateEtudiantDto.email && updateEtudiantDto.email !== existingEtudiant.email) {
            const emailExists = await this.etudiantRepo.findOne({
                where: { email: updateEtudiantDto.email }
            });
            if (emailExists) {
                throw new ConflictException('Un étudiant avec cet email existe déjà');
            }
        }

        try {
            await this.etudiantRepo.update(id, updateEtudiantDto);
            const updatedEtudiant = await this.etudiantRepo.findOne({
                where: { id },
                relations: ['sections', 'notesReleve', 'emplois']
            });

            if (!updatedEtudiant) {
                throw new InternalServerErrorException("Échec de la récupération de l'étudiant mis à jour");
            }

            return updatedEtudiant;
        } catch (error) {
            if (error.code === '23505') {
                throw new ConflictException('Données dupliquées');
            }
            throw new InternalServerErrorException("Échec de la mise à jour de l'étudiant");
        }
    }

    async remove(id: string): Promise<void> {
        const result = await this.etudiantRepo.delete(id);

        if (result.affected === 0) {
            throw new NotFoundException(`Étudiant avec l'ID ${id} non trouvé`);
        }
    }

    async getStudentNotes(id: string) {
        const etudiant = await this.etudiantRepo.findOne({
            where: { id },
            relations: ['notesReleve']
        });

        if (!etudiant) {
            throw new NotFoundException(`Étudiant avec l'ID ${id} non trouvé`);
        }

        return etudiant.notesReleve;
    }

    async getStudentSchedule(id: string) {
        const etudiant = await this.etudiantRepo.findOne({
            where: { id },
            relations: ['emplois']
        });

        if (!etudiant) {
            throw new NotFoundException(`Étudiant avec l'ID ${id} non trouvé`);
        }

        return etudiant.emplois;
    }
}