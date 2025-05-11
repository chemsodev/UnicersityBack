import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Section } from '../section/section.entity';
import { Schedule } from './entities/schedule.entity';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class ScheduleService {
    constructor(
        @InjectRepository(Schedule)
        private readonly scheduleRepository: Repository<Schedule>,
        @InjectRepository(Section)
        private readonly sectionRepository: Repository<Section>,
        private readonly notificationsService: NotificationsService
    ) { }

    async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
        const { sectionId, ...scheduleData } = createScheduleDto;

        const section = await this.sectionRepository.findOne({ 
            where: { id: sectionId },
            relations: ['etudiants']
        });

        if (!section) {
            throw new NotFoundException('Section non trouvée');
        }

        const schedule = this.scheduleRepository.create({
            ...scheduleData,
            section
        });

        const savedSchedule = await this.scheduleRepository.save(schedule);

        // Notify affected students
        if (section.etudiants) {
            for (const etudiant of section.etudiants) {
                await this.notificationsService.create({
                    title: `Nouveau cours - ${savedSchedule.title}`,
                    content: `Un nouveau cours a été programmé pour le ${savedSchedule.day} de ${savedSchedule.startTime} à ${savedSchedule.endTime} en salle ${savedSchedule.room}.`,
                    type: NotificationType.COURS,
                    userId: etudiant.id
                });
            }
        }

        return savedSchedule;
    }

    async findAll(): Promise<Schedule[]> {
        return this.scheduleRepository.find({
            relations: ['section'],
            order: { uploadedAt: 'DESC' }
        });
    }

    async findOne(id: string): Promise<Schedule> {
        const schedule = await this.scheduleRepository.findOne({
            where: { id },
            relations: ['section']
        });

        if (!schedule) {
            throw new NotFoundException('Emploi du temps non trouvé');
        }

        return schedule;
    }

    async update(id: string, updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
        const existingSchedule = await this.scheduleRepository.findOne({
            where: { id },
            relations: ['section', 'section.etudiants']
        });

        if (!existingSchedule) {
            throw new NotFoundException('Schedule not found');
        }

        Object.assign(existingSchedule, updateScheduleDto);
        const updatedSchedule = await this.scheduleRepository.save(existingSchedule);

        // Notify affected students about the change
        if (existingSchedule.section && existingSchedule.section.etudiants) {
            for (const etudiant of existingSchedule.section.etudiants) {
                await this.notificationsService.create({
                    title: `Mise à jour du cours - ${updatedSchedule.title}`,
                    content: `Le cours ${updatedSchedule.title} a été modifié pour le ${new Date(updatedSchedule.startTime).toLocaleDateString()} de ${new Date(updatedSchedule.startTime).toLocaleTimeString()} à ${new Date(updatedSchedule.endTime).toLocaleTimeString()} en salle ${updatedSchedule.room}.`,
                    type: NotificationType.COURS,
                    userId: etudiant.id
                });
            }
        }

        return updatedSchedule;
    }

    async remove(id: string): Promise<void> {
        const result = await this.scheduleRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException('Emploi du temps non trouvé');
        }
    }

    async getSchedulesBySection(sectionId: string): Promise<Schedule[]> {
        return this.scheduleRepository.find({
            where: { section: { id: sectionId } },
            relations: ['section'],
            order: { uploadedAt: 'DESC' }
        });
    }
}