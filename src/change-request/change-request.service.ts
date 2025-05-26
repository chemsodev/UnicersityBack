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
    request.requestNumber = `REQ-${new Date().getFullYear()}-${uuidv4().slice(
      0,
      8
    )}`;

    // Store document data if provided
    if (documentData) {
      console.log(
        `Document provided: ${documentName}, ${documentMimeType}, Size: ${documentData.length} bytes`
      );

      // Explicitly set the document fields
      request.documentData = documentData;
      request.documentName = documentName;
      request.documentMimeType = documentMimeType;
    } else if (documentPath) {
      console.log(`Legacy document path provided: ${documentPath}`);
      request.documentPath = documentPath;
    } else {
      console.log("No document provided with this request");
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
      relations: [
        "etudiant",
        "currentSection",
        "requestedSection",
        "currentGroupe",
        "requestedGroupe",
      ],
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
    console.log(
      `Attempting to cancel request ${requestId} for student ${studentId}`
    );

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

    console.log(
      `Comparing request studentId: ${requestStudentId} with current user: ${currentStudentId}`
    );

    // Verify the request belongs to the student
    if (requestStudentId !== currentStudentId) {
      console.error(
        `Authorization failed: Request belongs to ${requestStudentId}, but current user is ${currentStudentId}`
      );
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

    // Use a transaction to ensure atomicity
    const queryRunner =
      this.etudiantRepo.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const student = await queryRunner.manager.findOne(Etudiant, {
        where: { id: entityId as any },
        relations: ["sections", "tdGroupe", "tpGroupe"],
      });

      if (!student) {
        throw new NotFoundException("Student not found");
      }

      console.log(
        `[Section Change] Processing section change for student ${student.id}`
      );
      console.log(
        `[Section Change] Current sections:`,
        student.sections?.map((s) => s.name) || "none"
      );
      console.log(
        `[Section Change] Changing from: ${request.currentSection?.name} to: ${request.requestedSection?.name}`
      );

      // Apply changes based on request type
      switch (request.requestType) {
        case RequestType.SECTION:
          if (request.requestedSection) {
            // Fetch the requested section with full relations
            const newSection = await queryRunner.manager.findOne(Section, {
              where: { id: request.requestedSection.id },
              relations: ["department"],
            });

            if (newSection) {
              // Use the working approach from SectionService
              console.log(
                `[Section Change] Using SectionService approach - working from section side`
              );

              // First, remove student from old section if exists
              if (request.currentSection) {
                const oldSection = await queryRunner.manager.findOne(Section, {
                  where: { id: request.currentSection.id },
                  relations: ["etudiants"],
                });

                if (oldSection && oldSection.etudiants) {
                  // Convert IDs to strings for comparison
                  oldSection.etudiants = oldSection.etudiants.filter(
                    (e) => String(e.id) !== String(student.id)
                  );
                  await queryRunner.manager.save(Section, oldSection);
                  console.log(
                    `[Section Change] Removed student from old section: ${oldSection.name}`
                  );
                }
              }

              // Then, add student to new section
              const targetSection = await queryRunner.manager.findOne(Section, {
                where: { id: newSection.id },
                relations: ["etudiants"],
              });

              if (targetSection) {
                // Check if student already exists in the section
                const studentExists = targetSection.etudiants?.some(
                  (e) => String(e.id) === String(student.id)
                );

                if (!studentExists) {
                  if (!targetSection.etudiants) {
                    targetSection.etudiants = [];
                  }
                  targetSection.etudiants.push(student);
                  await queryRunner.manager.save(Section, targetSection);
                  console.log(
                    `[Section Change] Added student to new section: ${targetSection.name}`
                  );
                }
              }

              // Automatically assign student to TD/TP groups from the new section
              console.log(
                `[Section Change] Assigning student to groups in new section: ${targetSection.name}`
              );

              // Find available TD group in the new section
              const availableTdGroups = await queryRunner.manager.find(Groupe, {
                where: {
                  section: { id: targetSection.id },
                  type: "td" as any,
                },
                relations: ["section"],
              });

              // Find available TP group in the new section
              const availableTpGroups = await queryRunner.manager.find(Groupe, {
                where: {
                  section: { id: targetSection.id },
                  type: "tp" as any,
                },
                relations: ["section"],
              });

              let newTdGroupId = null;
              let newTpGroupId = null;

              // Assign to first available TD group (could implement load balancing later)
              if (availableTdGroups.length > 0) {
                newTdGroupId = availableTdGroups[0].id;
                console.log(
                  `[Section Change] Assigning to TD group: ${availableTdGroups[0].name}`
                );
              } else {
                console.log(
                  `[Section Change] No TD groups available in new section`
                );
              }

              // Assign to first available TP group
              if (availableTpGroups.length > 0) {
                newTpGroupId = availableTpGroups[0].id;
                console.log(
                  `[Section Change] Assigning to TP group: ${availableTpGroups[0].name}`
                );
              } else {
                console.log(
                  `[Section Change] No TP groups available in new section`
                );
              }

              // Update student's group assignments via direct SQL
              await queryRunner.manager.query(
                `UPDATE "users" SET td_groupe_id = $2, tp_groupe_id = $3 WHERE id = $1`,
                [student.id, newTdGroupId, newTpGroupId]
              );
              console.log(
                `[Section Change] Updated student groups: TD=${
                  newTdGroupId ? "assigned" : "none"
                }, TP=${newTpGroupId ? "assigned" : "none"}`
              );
            }
          }
          break;

        case RequestType.GROUPE_TD:
          if (request.requestedGroupe) {
            student.tdGroupe = request.requestedGroupe;
            await queryRunner.manager.save(Etudiant, student);
          }
          break;

        case RequestType.GROUPE_TP:
          if (request.requestedGroupe) {
            student.tpGroupe = request.requestedGroupe;
            await queryRunner.manager.save(Etudiant, student);
          }
          break;
      }

      // Verify the change by reloading the student
      const verificationStudent = await queryRunner.manager.findOne(Etudiant, {
        where: { id: entityId as any },
        relations: ["sections"],
      });
      console.log(
        `[Section Change] Verification - student sections after save:`,
        verificationStudent?.sections?.map((s) => s.name) || "none"
      );

      // Commit the transaction
      await queryRunner.commitTransaction();
      console.log(`✅ [Section Change] Transaction committed successfully`);
    } catch (error) {
      // Rollback the transaction on error
      await queryRunner.rollbackTransaction();
      console.error(
        `❌ [Section Change] Transaction rolled back due to error:`,
        error
      );
      throw new BadRequestException(
        `Failed to apply section change: ${error.message}`
      );
    } finally {
      // Release the query runner
      await queryRunner.release();
    }

    // Send notification about the change (outside transaction)
    await this.notificationsService.create({
      title: `Changement effectué`,
      content: `Votre demande ${request.requestNumber} a été approuvée et les changements ont été appliqués à votre profil.`,
      type: NotificationType.ADMIN,
      userId: request.studentId,
      actionLink: `profile.html`,
      actionLabel: "Voir profil",
    });

    // Log the successful change for audit purposes
    console.log(
      `✅ [Section Change] Successfully applied section change for student ${request.studentId}: ${request.currentSection?.name} -> ${request.requestedSection?.name}`
    );
  }

  // Get group by ID for validation
  async getGroupById(groupId: string): Promise<Groupe> {
    return this.groupeRepo.findOne({
      where: { id: groupId },
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
        where: { id: requestId },
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
        throw new NotFoundException(
          `Request document data not found for ID ${requestId}`
        );
      }

      const documentData = rawResult[0];
      console.log("Raw document data retrieved:", {
        id: documentData.id,
        hasDocumentData: !!documentData.documentData,
        documentDataSize: documentData.documentData
          ? documentData.documentData.length
          : 0,
        documentName: documentData.documentName,
        documentMimeType: documentData.documentMimeType,
      });

      // Create a proper entity from raw results
      const request = new ChangeRequest();
      request.id = documentData.id;
      request.documentData = documentData.documentData;
      request.documentName = documentData.documentName;
      request.documentMimeType = documentData.documentMimeType;
      request.documentPath = documentData.documentPath;

      const dataSize = request.documentData ? request.documentData.length : 0;
      console.log(
        `Document found: ${
          request.documentName || "No name"
        }, Size: ${dataSize} bytes`
      );

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

  async findAll(): Promise<ChangeRequest[]> {
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

  /**
   * Find all section change requests, with optional filtering by status and department
   */
  async findSectionChangeRequests(
    status?: RequestStatus,
    departmentId?: string
  ): Promise<ChangeRequest[]> {
    const queryBuilder = this.requestRepo
      .createQueryBuilder("request")
      .leftJoinAndSelect("request.etudiant", "etudiant")
      .leftJoinAndSelect("request.currentSection", "currentSection")
      .leftJoinAndSelect("request.requestedSection", "requestedSection")
      .leftJoinAndSelect("currentSection.department", "currentDepartment")
      .leftJoinAndSelect("requestedSection.department", "requestedDepartment")
      .where("request.requestType = :requestType", {
        requestType: RequestType.SECTION,
      });

    // Filter by status if provided
    if (status) {
      queryBuilder.andWhere("request.status = :status", { status });
    }

    // Filter by department if provided
    if (departmentId) {
      queryBuilder.andWhere(
        "(currentDepartment.id = :departmentId OR requestedDepartment.id = :departmentId)",
        { departmentId }
      );
    }

    // Order by most recent first
    queryBuilder.orderBy("request.createdAt", "DESC");

    return queryBuilder.getMany();
  }

  /**
   * Get document data for a specific change request
   */
  async getRequestDocument(
    requestId: string
  ): Promise<{ data: Buffer; filename: string; mimetype: string }> {
    const request = await this.requestRepo.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException("Change request not found");
    }

    if (!request.documentData && !request.documentPath) {
      throw new NotFoundException("No document attached to this request");
    }

    // Return the document data
    return {
      data: request.documentData,
      filename: request.documentName || "document",
      mimetype: request.documentMimeType || "application/octet-stream",
    };
  }
}
