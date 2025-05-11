import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Groupe, GroupeType } from "./groupe.entity";
import { Repository } from "typeorm";
import { Section } from "src/section/section.entity";
import { CreateGroupeDto } from "./dto/create-groupe.dto";
import { UpdateGroupeDto } from "./dto/update-groupe.dto";
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class GroupeService {
    constructor(
        @InjectRepository(Groupe)
        private readonly groupeRepo: Repository<Groupe>,
        @InjectRepository(Section)
        private readonly sectionRepo: Repository<Section>,
        private readonly notificationsService: NotificationsService
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

    async assignStudentToGroup(studentId: string, groupId: string): Promise<Groupe> {
        const group = await this.groupeRepo.findOne({
            where: { id: groupId },
            relations: ['etudiants', 'section']
        });

        if (!group) {
            throw new NotFoundException('Group not found');
        }

        if (group.etudiants?.length >= group.capacity) {
            throw new BadRequestException('Group is at full capacity');
        }

        if (!group.etudiants) {
            group.etudiants = [];
        }

        const studentExists = group.etudiants.some(e => e.id === studentId);
        if (!studentExists) {
            group.etudiants.push({ id: studentId } as any);
            await this.groupeRepo.save(group);

            await this.notificationsService.create({
                title: `Affectation au groupe ${group.type.toUpperCase()}`,
                content: `Vous avez été affecté(e) au groupe ${group.name} de la section ${group.section.name}. Type: ${group.type.toUpperCase()}.`,
                type: NotificationType.ADMIN,
                userId: studentId,
                actionLink: 'group-section.html',
                actionLabel: 'Voir détails'
            });
        }

        return group;
    }

    async removeStudentFromGroup(studentId: string, groupId: string): Promise<Groupe> {
        const group = await this.groupeRepo.findOne({
            where: { id: groupId },
            relations: ['etudiants', 'section']
        });

        if (!group) {
            throw new NotFoundException('Group not found');
        }

        group.etudiants = group.etudiants.filter(e => e.id !== studentId);
        const updatedGroup = await this.groupeRepo.save(group);

        // Create notification for the student
        await this.notificationsService.create({
            title: `Retrait du groupe ${group.type.toUpperCase()}`,
            content: `Vous avez été retiré(e) du groupe ${group.name} de la section ${group.section.name}.`,
            type: NotificationType.ADMIN,
            userId: studentId,
            actionLink: 'group-section.html',
            actionLabel: 'Voir détails'
        });

        return updatedGroup;
    }

    async checkGroupAvailability(groupId: string): Promise<{
        available: boolean;
        currentOccupancy: number;
        capacity: number;
    }> {
        const group = await this.groupeRepo.findOne({
            where: { id: groupId }
        });

        if (!group) {
            throw new NotFoundException('Groupe non trouvé');
        }

        return {
            available: group.currentOccupancy < group.capacity,
            currentOccupancy: group.currentOccupancy,
            capacity: group.capacity
        };
    }
}