// src/change-request/change-request.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  ChangeRequest,
  RequestType,
  RequestStatus,
  UpdateRequestStatusDto,
  CreateChangeRequestDto,
} from "./change-request.entity";
import { Etudiant } from "../etudiant/etudiant.entity";
import { Section } from "../section/section.entity";
import { Groupe } from "../groupe/groupe.entity";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/notification.entity";
import { v4 as uuidv4 } from "uuid";
import { toNumberOrStringId } from "../utils/id-conversion.util";

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
  ) {}

  async createRequest(
    etudiantId: string,
    createDto: CreateChangeRequestDto,
    documentPath: string = null,
    documentData?: Buffer,
    documentName?: string,
    documentMimeType?: string
  ): Promise<ChangeRequest> {
    const entityId = toNumberOrStringId(etudiantId);
    const etudiant = await this.etudiantRepo.findOneBy({ id: entityId as any });
    if (!etudiant) throw new NotFoundException("Student not found");

    const request = new ChangeRequest();
    request.etudiant = etudiant;
    request.requestType = createDto.requestType;
    request.justification = createDto.justification;
    request.studentId = etudiantId;
    request.status = RequestStatus.PENDING;

    // Generate a unique request number
    request.requestNumber = `REQ-${new Date().getFullYear()}-${uuidv4().slice(0, 8)}`;

    // Store document data if provided
    if (documentData) {
      console.log(`Document provided: ${documentName}, ${documentMimeType}, Size: ${documentData.length} bytes`);
      
      // Explicitly set the document fields
      request.documentData = documentData;
      request.documentName = documentName;
      request.documentMimeType = documentMimeType;
    } else if (documentPath) {
      console.log(`Legacy document path provided: ${documentPath}`);
      request.documentPath = documentPath;
    } else {
      console.log('No document provided with this request');
    }

    if (createDto.requestType === RequestType.SECTION) {
      const currentSection = await this.sectionRepo.findOneBy({
        id: createDto.currentId,
      });
      const requestedSection = await this.sectionRepo.findOneBy({
        id: createDto.requestedId,
      });

      if (!currentSection || !requestedSection) {
        throw new BadRequestException("Invalid section ID provided");
      }

      request.currentSection = currentSection;
      request.requestedSection = requestedSection;
    } else {
      const currentGroupe = await this.groupeRepo.findOneBy({
        id: createDto.currentId,
      });
      const requestedGroupe = await this.groupeRepo.findOneBy({
        id: createDto.requestedId,
      });

      if (!currentGroupe || !requestedGroupe) {
        throw new BadRequestException("Invalid group ID provided");
      }

      request.currentGroupe = currentGroupe;
      request.requestedGroupe = requestedGroupe;
    }

    // Save the request
    const savedRequest = await this.requestRepo.save(request);

    // Create a notification for the student
    await this.notificationsService.create({
      title: `Demande ${request.requestNumber} enregistrée`,
      content: `Votre demande de changement a été enregistrée et est en cours d'examen.`,
      type: NotificationType.ADMIN,
      userId: etudiantId,
      actionLink: `demandes.html?id=${savedRequest.id}`,
      actionLabel: "Voir détails",
    });

    return savedRequest;
  }

  async getStudentRequests(etudiantId: string): Promise<ChangeRequest[]> {
    return this.requestRepo.find({
      where: { studentId: etudiantId },
      relations: [
        "currentSection",
        "requestedSection",
        "currentGroupe",
        "requestedGroupe",
      ],
      order: { createdAt: "DESC" },
    });
  }

  async getAllRequests(): Promise<ChangeRequest[]> {
    return this.requestRepo.find({
      relations: [
        "etudiant",
        "currentSection",
        "requestedSection",
        "currentGroupe",
        "requestedGroupe",
      ],
      order: { createdAt: "DESC" },
    });
  }

  async updateRequestStatus(
    id: string,
    updateDto: UpdateRequestStatusDto
  ): Promise<ChangeRequest> {
    const request = await this.requestRepo.findOne({
      where: { id },
      relations: ["etudiant"],
    });

    if (!request) throw new NotFoundException("Request not found");

    // Don't allow status update if it's already approved or rejected
    if (
      request.status === RequestStatus.APPROVED ||
      request.status === RequestStatus.REJECTED
    ) {
      throw new BadRequestException("Cannot update a finalized request");
    }

    request.status = updateDto.status;
    request.responseMessage = updateDto.responseMessage;

    // Create notification for the student
    await this.notificationsService.create({
      title: `Mise à jour de votre demande ${request.requestNumber}`,
      content: `Votre demande a été ${this.getStatusFrench(
        updateDto.status
      )}. ${updateDto.responseMessage || ""}`,
      type: NotificationType.ADMIN,
      userId: request.studentId,
      actionLink: `demandes.html?id=${request.id}`,
      actionLabel: "Voir détails",
    });

    // If the request is approved, update the student's data
    if (updateDto.status === RequestStatus.APPROVED) {
      await this.applyApprovedRequest(request);
    }

    return this.requestRepo.save(request);
  }

  async cancelStudentRequest(
    studentId: string,
    requestId: string,
    updateDto: UpdateRequestStatusDto
  ): Promise<ChangeRequest> {
    console.log(`Attempting to cancel request ${requestId} for student ${studentId}`);
    
    const request = await this.requestRepo.findOne({
      where: { id: requestId },
      relations: ["etudiant"],
    });

    if (!request) {
      throw new NotFoundException("Request not found");
    }

    // Convert IDs to strings for proper comparison
    const requestStudentId = String(request.studentId);
    const currentStudentId = String(studentId);
    
    console.log(`Comparing request studentId: ${requestStudentId} with current user: ${currentStudentId}`);
    
    // Verify the request belongs to the student
    if (requestStudentId !== currentStudentId) {
      console.error(`Authorization failed: Request belongs to ${requestStudentId}, but current user is ${currentStudentId}`);
      throw new ForbiddenException("You can only cancel your own requests");
    }

    // Only pending requests can be cancelled
    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException("Only pending requests can be cancelled");
    }

    // Update the request status
    request.status = RequestStatus.CANCELLED;
    request.responseMessage =
      updateDto.responseMessage || "Demande annulée par l'étudiant";

    // Create notification about the cancellation
    await this.notificationsService.create({
      title: `Demande ${request.requestNumber} annulée`,
      content: `Votre demande de changement a été annulée à votre demande.`,
      type: NotificationType.ADMIN,
      userId: studentId,
      actionLink: `demandes.html?id=${request.id}`,
      actionLabel: "Voir détails",
    });

    return this.requestRepo.save(request);
  }

  // Helper to apply approved changes
  private async applyApprovedRequest(request: ChangeRequest): Promise<void> {
    const entityId = toNumberOrStringId(request.studentId);

    const student = await this.etudiantRepo.findOne({
      where: { id: entityId as any },
      relations: ["sections", "tdGroupe", "tpGroupe"],
    });

    if (!student) {
      throw new NotFoundException("Student not found");
    }

    // Apply changes based on request type
    switch (request.requestType) {
      case RequestType.SECTION:
        if (request.requestedSection) {
          // Update student's sections relation
          // First, fetch the requested section
          const newSection = await this.sectionRepo.findOneBy({
            id: request.requestedSection.id,
          });
          if (newSection) {
            // Replace or add the section
            if (!student.sections) {
              student.sections = [newSection];
            } else {
              // Remove current section if exists
              student.sections = student.sections.filter(
                (section) => section.id !== request.currentSection?.id
              );
              // Add new section
              student.sections.push(newSection);
            }
          }
        }
        break;

      case RequestType.GROUPE_TD:
        if (request.requestedGroupe) {
          // Update student's TD groupe relation
          student.tdGroupe = request.requestedGroupe;
        }
        break;

      case RequestType.GROUPE_TP:
        if (request.requestedGroupe) {
          // Update student's TP groupe relation
          student.tpGroupe = request.requestedGroupe;
        }
        break;
    }

    await this.etudiantRepo.save(student);

    // Send notification about the change
    await this.notificationsService.create({
      title: `Changement effectué`,
      content: `Votre demande ${request.requestNumber} a été approuvée et les changements ont été appliqués.`,
      type: NotificationType.ADMIN,
      userId: student.id,
      actionLink: null,
      actionLabel: null,
    });
  }

  private getStatusFrench(status: RequestStatus): string {
    switch (status) {
      case RequestStatus.APPROVED:
        return "approuvée";
      case RequestStatus.REJECTED:
        return "rejetée";
      case RequestStatus.PENDING:
        return "en attente";
      case RequestStatus.CANCELLED:
        return "annulée";
      default:
        return status;
    }
  }

  async getRequestById(id: string): Promise<ChangeRequest> {
    const request = await this.requestRepo.findOne({
      where: { id },
      relations: [
        "etudiant",
        "currentSection",
        "requestedSection",
        "currentGroupe",
        "requestedGroupe",
      ],
    });

    if (!request) {
      throw new NotFoundException("Request not found");
    }

    return request;
  }

  async getStudentRequestById(
    studentId: string,
    requestId: string
  ): Promise<ChangeRequest> {
    const request = await this.requestRepo.findOne({
      where: {
        id: requestId,
        studentId: studentId,
      },
      relations: [
        "currentSection",
        "requestedSection",
        "currentGroupe",
        "requestedGroupe",
      ],
    });

    if (!request) {
      throw new NotFoundException("Request not found or not accessible");
    }

    return request;
  }

  async getRequestWithDocument(requestId: string): Promise<ChangeRequest> {
    console.log(`Retrieving document for request ID: ${requestId}`);
    
    try {
      // First check if request exists
      const requestExists = await this.requestRepo.findOne({
        where: { id: requestId }
      });
      
      if (!requestExists) {
        throw new NotFoundException(`Request with ID ${requestId} not found`);
      }
      
      // Use direct raw SQL query to ensure proper binary data retrieval
      // This bypasses any TypeORM column mapping issues
      const rawResult = await this.requestRepo.query(
        `SELECT 
          id, 
          document_data as "documentData", 
          document_name as "documentName", 
          document_mime_type as "documentMimeType", 
          "documentPath"
         FROM change_request
         WHERE id = $1`,
        [requestId]
      );
      
      if (!rawResult || rawResult.length === 0) {
        throw new NotFoundException(`Request document data not found for ID ${requestId}`);
      }
      
      const documentData = rawResult[0];
      console.log("Raw document data retrieved:", {
        id: documentData.id,
        hasDocumentData: !!documentData.documentData,
        documentDataSize: documentData.documentData ? documentData.documentData.length : 0,
        documentName: documentData.documentName,
        documentMimeType: documentData.documentMimeType
      });
      
      // Create a proper entity from raw results
      const request = new ChangeRequest();
      request.id = documentData.id;
      request.documentData = documentData.documentData;
      request.documentName = documentData.documentName;
      request.documentMimeType = documentData.documentMimeType;
      request.documentPath = documentData.documentPath;
      
      const dataSize = request.documentData ? request.documentData.length : 0;
      console.log(`Document found: ${request.documentName || 'No name'}, Size: ${dataSize} bytes`);
      
      if (!request.documentData || dataSize === 0) {
        console.log(`No document found for request ${requestId}`);
      }
      
      return request;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`Error retrieving document: ${error.message}`);
      throw new Error(`Failed to retrieve document: ${error.message}`);
    }
  }
}
