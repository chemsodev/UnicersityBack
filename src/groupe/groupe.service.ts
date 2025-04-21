import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Groupe, GroupeType } from "./groupe.entity";
import { Repository } from "typeorm";
import { Section } from "src/section/section.entity";
import { CreateGroupeDto } from "./dto/create-groupe.dto";
import { UpdateGroupeDto } from "./dto/update-groupe.dto";
@Injectable()
export class GroupeService {
    constructor(
        @InjectRepository(Groupe)
        private readonly groupeRepo: Repository<Groupe>,
        @InjectRepository(Section)
        private readonly sectionRepo: Repository<Section>,
    ) { }

    async findAvailableGroups(type: 'td' | 'tp', sectionId?: string): Promise<Groupe[]> {
        const query = this.groupeRepo.createQueryBuilder('groupe')
            .where('groupe.type = :type', { type })
            .andWhere('groupe.currentOccupancy < groupe.capacity');

        if (sectionId) {
            query.andWhere('groupe.sectionId = :sectionId', { sectionId });
        }

        return query.getMany();
    }
    async create(createGroupeDto: CreateGroupeDto): Promise<Groupe> {
        const section = await this.sectionRepo.findOneBy({ id: createGroupeDto.sectionId });
        if (!section) {
            throw new NotFoundException('Section not found');
        }

        const groupe = this.groupeRepo.create({
            ...createGroupeDto,
            section,
        });

        return this.groupeRepo.save(groupe);
    }

    findAll(): Promise<Groupe[]> {
        return this.groupeRepo.find({ relations: ['section'] });
    }

    findOne(id: string): Promise<Groupe> {
        return this.groupeRepo.findOne({
            where: { id },
            relations: ['section']
        });
    }

    findBySection(sectionId: string): Promise<Groupe[]> {
        return this.groupeRepo.find({
            where: { section: { id: sectionId } },
            relations: ['section']
        });
    }

    findByType(type: GroupeType): Promise<Groupe[]> {
        return this.groupeRepo.find({
            where: { type : type },
            relations: ['section']
        });
    }

    async update(id: string, updateGroupeDto: UpdateGroupeDto): Promise<Groupe> {
        const groupe = await this.groupeRepo.findOneBy({ id });
        if (!groupe) {
            throw new NotFoundException('Groupe not found');
        }

        if (updateGroupeDto.sectionId) {
            const section = await this.sectionRepo.findOneBy({ id: updateGroupeDto.sectionId });
            if (!section) {
                throw new NotFoundException('Section not found');
            }
            groupe.section = section;
        }

        Object.assign(groupe, updateGroupeDto);
        return this.groupeRepo.save(groupe);
    }

    async remove(id: string): Promise<void> {
        const result = await this.groupeRepo.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException('Groupe not found');
        }
    }
}