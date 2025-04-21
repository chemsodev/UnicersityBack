import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Administrateur } from './administrateur.entity';
import { User } from '../user.entity';
import { CreateAdministrateurDto } from './dto/create-administrateur.dto';
import { UpdateAdministrateurDto } from './dto/update-administrateur.dto';

@Injectable()
export class AdministrateurService {
    constructor(
        @InjectRepository(Administrateur)
        private readonly administrateurRepository: Repository<Administrateur>,
    ) { }

    async create(createAdministrateurDto: CreateAdministrateurDto): Promise<Administrateur> {
        const admin = this.administrateurRepository.create(createAdministrateurDto);
        return await this.administrateurRepository.save(admin);
    }

    async findAll(): Promise<Administrateur[]> {
        return await this.administrateurRepository.find();
    }

    async findOne(id: string): Promise<Administrateur> {
        const admin = await this.administrateurRepository.findOne({ where: { id } });

        if (!admin) {
            throw new NotFoundException(`Administrateur with ID ${id} not found`);
        }

        return admin;
    }

    async findByEmail(email: string): Promise<Administrateur> {
        const admin = await this.administrateurRepository.findOne({ where: { email } });

        if (!admin) {
            throw new NotFoundException(`Administrateur with email ${email} not found`);
        }

        return admin;
    }

    async update(id: string, updateAdministrateurDto: UpdateAdministrateurDto): Promise<Administrateur> {
        const admin = await this.administrateurRepository.preload({
            id,
            ...updateAdministrateurDto,
        });

        if (!admin) {
            throw new NotFoundException(`Administrateur with ID ${id} not found`);
        }

        return this.administrateurRepository.save(admin);
    }

    async remove(id: string): Promise<void> {
        const result = await this.administrateurRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Administrateur with ID ${id} not found`);
        }
    }

    async getAdminsByRole(role: string): Promise<Administrateur[]> {
        return this.administrateurRepository.find({
            where: { adminRole: role as any },
        });
    }
}