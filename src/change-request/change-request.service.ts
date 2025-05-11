// src/change-request/change-request.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChangeRequest, RequestType, RequestStatus, UpdateRequestStatusDto, CreateChangeRequestDto } from './change-request.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Section } from '../section/section.entity';
import { Groupe } from '../groupe/groupe.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class ChangeRequestService {
    constructor(
        @InjectRepository(ChangeRequest)
        private readonly requestRepo: Repository<ChangeRequest>,
        @InjectRepository(Etudiant)
        private readonly etudiantRepo: Repository<Etudiant>,
        @InjectRepository(Section)
        private readonly sectionRepo: Repository<Section>,
        @InjectRepository(Groupe)
        private readonly groupeRepo: Repository<Groupe>,
        private readonly notificationsService: NotificationsService
    ) { }

    async createRequest(
        etudiantId: string,
        createDto: CreateChangeRequestDto,
        documentPath: string,
    ): Promise<ChangeRequest> {
        const etudiant = await this.etudiantRepo.findOneBy({ id: etudiantId });
        if (!etudiant) throw new NotFoundException('Student not found');

        const request = new ChangeRequest();
        request.etudiant = etudiant;
        request.requestType = createDto.requestType;
        request.justification = createDto.justification;
        request.documentPath = documentPath;

        if (createDto.requestType === RequestType.SECTION) {
            request.currentSection = await this.sectionRepo.findOneBy({ id: createDto.currentId });
            request.requestedSection = await this.sectionRepo.findOneBy({ id: createDto.requestedId });
        } else {
            request.currentGroupe = await this.groupeRepo.findOneBy({ id: createDto.currentId });
            request.requestedGroupe = await this.groupeRepo.findOneBy({ id: createDto.requestedId });
        }

        return this.requestRepo.save(request);
    }

    async getStudentRequests(etudiantId: string): Promise<ChangeRequest[]> {
        return this.requestRepo.find({
            where: { etudiant: { id: etudiantId } },
            relations: ['currentSection', 'requestedSection', 'currentGroupe', 'requestedGroupe'],
        });
    }

    async getAllRequests(): Promise<ChangeRequest[]> {
        return this.requestRepo.find({
            relations: ['etudiant', 'currentSection', 'requestedSection', 'currentGroupe', 'requestedGroupe'],
        });
    }

    async updateRequestStatus(
        id: string,
        updateDto: UpdateRequestStatusDto,
    ): Promise<ChangeRequest> {
        const request = await this.requestRepo.findOneBy({ id });
        if (!request) throw new NotFoundException('Request not found');

        request.status = updateDto.status;
        request.responseMessage = updateDto.responseMessage;

        // Create notification for the student
        await this.notificationsService.create({
            title: `Mise à jour de votre demande ${request.requestNumber}`,
            content: `Votre demande a été ${updateDto.status}. ${updateDto.responseMessage || ''}`,
            type: NotificationType.ADMIN,
            userId: request.studentId,
            actionLink: `demandes.html?id=${request.id}`,
            actionLabel: 'Voir détails'
        });

        return this.requestRepo.save(request);
    }
}