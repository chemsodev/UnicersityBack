import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Enseignant } from "./enseignant.entity";
import { Schedule } from "../schedules/entities/schedule.entity";
import { CreateEnseignantDto } from "./dto/create-enseignant.dto";
import { UpdateEnseignantDto } from "./dto/update-enseignant.dto";
import { Section } from "../section/section.entity";
import { Etudiant } from "../etudiant/etudiant.entity";
import { SectionResponsable } from "../section/section-responsable.entity";
import {
  ChangeRequest,
  RequestStatus,
  RequestType,
} from "../change-request/change-request.entity";
import { Groupe } from "../groupe/groupe.entity";
import * as bcrypt from "bcrypt";
import { AdminRole, User } from "../user.entity";

@Injectable()
export class EnseignantService {
  constructor(
    @InjectRepository(Enseignant)
    private readonly enseignantRepository: Repository<Enseignant>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(SectionResponsable)
    private readonly sectionResponsableRepository: Repository<SectionResponsable>,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
    @InjectRepository(Etudiant)
    private readonly etudiantRepository: Repository<Etudiant>,
    @InjectRepository(ChangeRequest)
    private readonly changeRequestRepository: Repository<ChangeRequest>,
    @InjectRepository(Groupe)
    private readonly groupeRepository: Repository<Groupe>
  ) {}
  async create(createEnseignantDto: CreateEnseignantDto): Promise<Enseignant> {
    // Check for email uniqueness across all users first
    const existingEmail = await this.userRepository.findOne({
      where: { email: createEnseignantDto.email },
    });

    if (existingEmail) {
      throw new ForbiddenException(
        "Cet email est déjà utilisé par un autre utilisateur."
      );
    }

    // Hash password
    if (!createEnseignantDto.password) {
      throw new Error("Password is required");
    }
    const hashedPassword = await bcrypt.hash(createEnseignantDto.password, 10);

    // Set role to 'enseignant' by default
    const role =
      createEnseignantDto.role &&
      createEnseignantDto.role === AdminRole.ENSEIGNANT
        ? createEnseignantDto.role
        : AdminRole.ENSEIGNANT;

    const enseignant = this.enseignantRepository.create({
      ...createEnseignantDto,
      password: hashedPassword,
      adminRole: role,
    });

    try {
      return await this.enseignantRepository.save(enseignant);
    } catch (error) {
      if (error.code === "23505") {
        // PostgreSQL unique violation error code
        throw new ForbiddenException(
          "Cet email est déjà utilisé par un autre utilisateur."
        );
      }
      throw error;
    }
  }
  async findAll(): Promise<Enseignant[]> {
    return this.enseignantRepository.find({
      relations: ["schedules"],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        matricule: true,
        createdAt: true,
        updatedAt: true,
        adminRole: true,
      },
    });
  }
  async findOne(id: number): Promise<Enseignant> {
    const enseignant = await this.enseignantRepository.findOne({
      where: { id },
      relations: ["schedules"],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        matricule: true,
        createdAt: true,
        updatedAt: true,
        adminRole: true,
      },
    });

    if (!enseignant) {
      throw new NotFoundException(`Enseignant with ID ${id} not found`);
    }

    return enseignant;
  }
  async update(
    id: number,
    updateEnseignantDto: UpdateEnseignantDto
  ): Promise<Enseignant> {
    const enseignant = await this.findOne(id);

    console.log("=== UPDATE TEACHER DEBUG ===");
    console.log("Teacher ID:", id);
    console.log("Incoming DTO:", JSON.stringify(updateEnseignantDto, null, 2));
    console.log(
      "Current teacher:",
      JSON.stringify(
        {
          id: enseignant.id,
          email: enseignant.email,
          firstName: enseignant.firstName,
          lastName: enseignant.lastName,
          matricule: enseignant.matricule,
        },
        null,
        2
      )
    );
    console.log("Email comparison:");
    console.log("- Incoming email:", updateEnseignantDto.email);
    console.log("- Current email:", enseignant.email);
    console.log("- Same?:", updateEnseignantDto.email === enseignant.email);
    console.log("- Email in DTO?:", "email" in updateEnseignantDto);
    console.log("- Email truthy?:", !!updateEnseignantDto.email);

    // Check for email uniqueness if email is being updated
    if (updateEnseignantDto.email) {
      // Only check if email is actually different
      if (updateEnseignantDto.email !== enseignant.email) {
        console.log("✓ Email changed, checking uniqueness...");
        const existing = await this.userRepository.findOne({
          where: { email: updateEnseignantDto.email },
        });
        console.log("Existing user found:", existing);
        if (existing && existing.id !== id) {
          console.log(
            "✗ Email conflict - existing user ID:",
            existing.id,
            "current teacher ID:",
            id
          );
          throw new ForbiddenException(
            "Cet email est déjà utilisé par un autre utilisateur."
          );
        }
        console.log("✓ Email is unique, proceeding...");
      } else {
        console.log("✓ Email not changed, skipping uniqueness check");
      }
    } else {
      console.log("✓ No email in update, skipping email checks");
    }

    // If password is being updated, hash it
    if (updateEnseignantDto.password) {
      updateEnseignantDto.password = await bcrypt.hash(
        updateEnseignantDto.password,
        10
      );
    }

    // Enforce role to 'enseignant' only
    updateEnseignantDto.role = AdminRole.ENSEIGNANT;

    Object.assign(enseignant, updateEnseignantDto);
    enseignant.adminRole = AdminRole.ENSEIGNANT;

    try {
      return await this.enseignantRepository.save(enseignant);
    } catch (error) {
      console.error("Database error in update:", error);
      if (error.code === "23505") {
        // PostgreSQL unique violation error code
        if (error.detail && error.detail.includes("email")) {
          throw new ForbiddenException(
            "Cet email est déjà utilisé par un autre utilisateur."
          );
        }
        throw new ForbiddenException("Une contrainte d'unicité a été violée.");
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const result = await this.enseignantRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Enseignant with ID ${id} not found`);
    }
  }

  async getSchedules(id: number): Promise<Schedule[]> {
    // Validate that the enseignant exists
    await this.findOne(id);

    // Get teacher's sections with their assignments
    const teacherSections = await this.getSectionsResponsable(id);

    if (!teacherSections || teacherSections.length === 0) {
      return [];
    }

    const sectionIds = teacherSections.map((section) => section.id);

    // Get schedules by sectionIds with enhanced relations
    const schedules = await this.scheduleRepository.find({
      where: {
        sectionId: In(sectionIds),
      },
      relations: ["section", "section.department"],
      order: { createdAt: "DESC" },
    });

    // Enhance schedules with section information
    return schedules.map((schedule) => ({
      ...schedule,
      sectionInfo: {
        name: schedule.section?.name,
        code: schedule.section?.code,
        level: schedule.section?.level,
        department: schedule.section?.department?.name,
        specialty: schedule.section?.specialty,
      },
    }));
  }

  async getSchedulesBySection(
    teacherId: number,
    sectionId: string
  ): Promise<Schedule[]> {
    // Validate that the teacher has access to this section
    const teacherSections = await this.getSectionsResponsable(teacherId);
    const hasAccess = teacherSections.some(
      (section) => section.id === sectionId
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        "You don't have access to this section's schedules"
      );
    }

    // Get schedules for the specific section
    return this.scheduleRepository.find({
      where: { sectionId },
      relations: ["section"],
      order: { createdAt: "DESC" },
    });
  }

  async getTeacherAssignmentDetails(id: number): Promise<any> {
    // Get teacher with basic info
    const teacher = await this.findOne(id);

    // Get sections where teacher is responsible
    const sections = await this.getSectionsResponsable(id);

    // Get detailed assignment information
    const assignments = await this.sectionResponsableRepository.find({
      where: { enseignant: { id } },
      relations: ["section", "section.department"],
    });

    // Group assignments by role and section
    const assignmentsBySection = {};
    assignments.forEach((assignment) => {
      const sectionId = assignment.section.id;
      if (!assignmentsBySection[sectionId]) {
        assignmentsBySection[sectionId] = {
          section: assignment.section,
          roles: [],
        };
      }

      assignmentsBySection[sectionId].roles.push({
        role: assignment.role,
      });
    });

    return {
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        matricule: teacher.matricule,
      },
      sections: sections.map((section) => ({
        id: section.id,
        name: section.name,
        code: section.code,
        level: section.level,
        department: section.department?.name,
        specialty: section.specialty,
        studentCount: section.etudiants?.length || 0,
        assignments: assignmentsBySection[section.id]?.roles || [],
      })),
      totalSections: sections.length,
      totalStudents: sections.reduce(
        (sum, section) => sum + (section.etudiants?.length || 0),
        0
      ),
    };
  }

  async getSectionsResponsable(id: number): Promise<Section[]> {
    const enseignant = await this.enseignantRepository.findOne({
      where: { id },
    });

    if (!enseignant) {
      throw new NotFoundException(`Enseignant with ID ${id} not found`);
    }

    // Get section responsibilities
    const sectionResponsabilities =
      await this.sectionResponsableRepository.find({
        where: { enseignant: { id } },
        relations: ["section"],
      });

    if (!sectionResponsabilities || sectionResponsabilities.length === 0) {
      return [];
    }

    // Extract sections from responsibilities
    const sections = sectionResponsabilities.map((resp) => resp.section);

    // Get full section details for each section
    const detailedSections = [];
    for (const section of sections) {
      const detailedSection = await this.sectionRepository.findOne({
        where: { id: section.id },
        relations: ["groupes", "department"],
      });
      if (detailedSection) {
        detailedSections.push(detailedSection);
      }
    }

    return detailedSections;
  }

  async getStudentsForTeacher(
    teacherId: number,
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<Etudiant[]> {
    const enseignant = await this.enseignantRepository.findOne({
      where: { id: teacherId },
    });

    if (!enseignant) {
      throw new NotFoundException(`Enseignant with ID ${teacherId} not found`);
    }

    // Get the teacher's sections
    const sections = await this.getSectionsResponsable(teacherId);
    if (!sections || sections.length === 0) {
      return []; // No sections, so no students
    }

    const sectionIds = sections.map((section) => section.id);

    // Get students from these sections with pagination and search
    const skip = (page - 1) * limit;

    const query = this.etudiantRepository
      .createQueryBuilder("etudiant")
      .innerJoin("etudiant.sections", "section")
      .where("section.id IN (:...sectionIds)", { sectionIds })
      .take(limit)
      .skip(skip);

    if (search) {
      query.andWhere((qb) => {
        // Use andWhere with a sub-query builder for OR conditions
        qb.where("etudiant.firstName LIKE :search", { search: `%${search}%` })
          .orWhere("etudiant.lastName LIKE :search", { search: `%${search}%` })
          .orWhere("etudiant.matricule LIKE :search", { search: `%${search}%` })
          .orWhere("etudiant.email LIKE :search", { search: `%${search}%` });
      });
    }

    const students = await query.getMany();

    // Remove duplicates (though innerJoin on sections might already handle this if a student is in multiple relevant sections)
    // For safety, keeping the distinct logic if necessary, but TypeORM's IN clause should be efficient.
    // Consider if a student can be in multiple sections managed by the same teacher. If so, this distinct logic is good.
    const uniqueStudents = Array.from(
      new Map(students.map((student) => [student.id, student])).values()
    );

    return uniqueStudents;
  }

  async getStudentsForTeacherSection(
    teacherId: number,
    sectionId: string
  ): Promise<Etudiant[]> {
    // Verify that the teacher is responsible for this section
    const enseignant = await this.enseignantRepository.findOne({
      where: { id: teacherId },
    });

    if (!enseignant) {
      throw new NotFoundException(`Enseignant with ID ${teacherId} not found`);
    }

    const sectionResponsabilities =
      await this.sectionResponsableRepository.find({
        where: {
          enseignant: { id: teacherId },
          section: { id: sectionId },
        },
      });

    // Check if the teacher is responsible for the section
    if (!sectionResponsabilities || sectionResponsabilities.length === 0) {
      throw new ForbiddenException(
        `Teacher ${teacherId} is not responsible for section ${sectionId}`
      );
    }

    // Get students for the section with their TD and TP groups
    const students = await this.etudiantRepository
      .createQueryBuilder("etudiant")
      .innerJoin("etudiant.sections", "section")
      .leftJoinAndSelect("etudiant.tdGroupe", "tdGroupe")
      .leftJoinAndSelect("etudiant.tpGroupe", "tpGroupe")
      .where("section.id = :sectionId", { sectionId })
      .getMany();

    return students;
  }

  // Implementation for getting group change requests for a teacher
  async getGroupChangeRequests(teacherId: number): Promise<any[]> {
    try {
      // Find sections this teacher is responsible for
      const sectionsResponsible = await this.sectionResponsableRepository.find({
        where: { enseignant: { id: teacherId } },
        relations: ["section"],
      });

      if (!sectionsResponsible || sectionsResponsible.length === 0) {
        return []; // Teacher isn't responsible for any section
      }

      // Get section IDs
      const sectionIds = sectionsResponsible.map((sr) => sr.section.id);

      // Use a more efficient query with leftJoinAndSelect to avoid N+1 query problems
      // and optimize with a direct query using the sectionIds
      const requests = await this.changeRequestRepository
        .createQueryBuilder("request")
        .leftJoinAndSelect("request.etudiant", "etudiant")
        .leftJoinAndSelect("request.currentGroupe", "currentGroupe")
        .leftJoinAndSelect("request.requestedGroupe", "requestedGroupe")
        .leftJoinAndSelect("currentGroupe.section", "currentSection")
        .leftJoinAndSelect("requestedGroupe.section", "requestedSection")
        .andWhere("request.requestType IN (:...types)", {
          types: [RequestType.GROUPE_TD, RequestType.GROUPE_TP],
        })
        .andWhere("currentSection.id IN (:...sectionIds)", { sectionIds })
        .getMany();

      // We no longer need to filter since the query already does it
      const filteredRequests = requests;

      // Map to a cleaner response format with safe property access
      return filteredRequests.map((request) => ({
        id: request.id,
        studentId: request.etudiant?.id,
        studentName: `${request.etudiant?.firstName || ""} ${
          request.etudiant?.lastName || ""
        }`.trim(),
        matricule: request.etudiant?.matricule || "",
        sectionId: request.currentGroupe?.section?.id,
        sectionName: `${
          request.currentGroupe?.section?.specialty || "Section"
        } - Section ${request.currentGroupe?.section?.name || "N/A"}`,
        currentGroupType:
          request.currentGroupe?.type?.toLowerCase() || "unknown",
        currentGroupName: request.currentGroupe?.name || "",
        requestedGroupType:
          request.requestedGroupe?.type?.toLowerCase() || "unknown",
        requestedGroupName: request.requestedGroupe?.name || "",
        reason: request.justification || "",
        status: request.status?.toLowerCase() || "pending",
        createdAt: request.createdAt,
        hasDocument: !!request.documentName || !!request.documentPath,
      }));
    } catch (error) {
      // Log error but don't overwhelm the console
      console.error(`Error getting group change requests: ${error.message}`);
      // Return an empty array rather than letting the exception propagate
      return [];
    }
  }

  // Implementation for updating a group change request status
  async updateGroupChangeRequestStatus(
    teacherId: number,
    requestId: string,
    status: string
  ): Promise<any> {
    // Find the request
    const request = await this.changeRequestRepository.findOne({
      where: { id: requestId },
      relations: [
        "etudiant",
        "currentGroupe",
        "requestedGroupe",
        "currentGroupe.section",
        "requestedGroupe.section",
      ],
    });

    if (!request) {
      throw new NotFoundException(
        `Group change request #${requestId} not found`
      );
    }

    // Verify the teacher is responsible for the section
    const isResponsible = await this.sectionResponsableRepository.findOne({
      where: {
        enseignant: { id: teacherId },
        section: { id: request.currentGroupe.section.id },
      },
    });

    if (!isResponsible) {
      throw new ForbiddenException(
        `You are not authorized to manage this request`
      );
    }

    // Update the request status
    const newStatus =
      status === "approved" ? RequestStatus.APPROVED : RequestStatus.REJECTED;
    request.status = newStatus;

    // If approved, actually change the student's group
    if (newStatus === RequestStatus.APPROVED) {
      await this.applyGroupChange(request);
    }

    // Save the updated request
    const updatedRequest = await this.changeRequestRepository.save(request);

    // Return a simplified response
    return {
      id: updatedRequest.id,
      status: updatedRequest.status,
      message: `Request ${
        newStatus === RequestStatus.APPROVED ? "approved" : "rejected"
      } successfully`,
    };
  }

  // Method to apply the group change when approved
  private async applyGroupChange(request: ChangeRequest): Promise<void> {
    try {
      // Get the student with current group associations
      const student = await this.etudiantRepository.findOne({
        where: { id: request.etudiant.id },
        relations: ["tdGroupe", "tpGroupe"],
      });

      if (!student) {
        throw new NotFoundException(
          `Student with ID ${request.etudiant.id} not found`
        );
      }

      // Get the current and requested groups with full details
      const currentGroup = await this.groupeRepository.findOne({
        where: { id: request.currentGroupe.id },
      });

      const requestedGroup = await this.groupeRepository.findOne({
        where: { id: request.requestedGroupe.id },
      });

      if (!currentGroup || !requestedGroup) {
        throw new NotFoundException("One or both groups not found");
      }

      // Update the appropriate group based on request type
      if (request.requestType === RequestType.GROUPE_TD) {
        student.tdGroupe = requestedGroup;

        // Update occupancy counts
        if (currentGroup) {
          currentGroup.currentOccupancy = Math.max(
            0,
            currentGroup.currentOccupancy - 1
          );
          await this.groupeRepository.save(currentGroup);
        }

        requestedGroup.currentOccupancy += 1;
        await this.groupeRepository.save(requestedGroup);
      } else if (request.requestType === RequestType.GROUPE_TP) {
        student.tpGroupe = requestedGroup;

        // Update occupancy counts
        if (currentGroup) {
          currentGroup.currentOccupancy = Math.max(
            0,
            currentGroup.currentOccupancy - 1
          );
          await this.groupeRepository.save(currentGroup);
        }

        requestedGroup.currentOccupancy += 1;
        await this.groupeRepository.save(requestedGroup);
      }

      // Save the updated student
      await this.etudiantRepository.save(student);
    } catch (error) {
      console.error(`Error applying group change: ${error.message}`);
      throw error;
    }
  }

  // Method to get document details for a change request
  async getChangeRequestDocument(
    teacherId: number,
    requestId: string
  ): Promise<any> {
    // First verify the teacher has access to this request
    const request = await this.changeRequestRepository.findOne({
      where: { id: requestId },
      relations: ["currentGroupe", "currentGroupe.section"],
    });

    if (!request) {
      throw new NotFoundException(`Change request #${requestId} not found`);
    }

    // Verify teacher is responsible for this section
    const isResponsible = await this.sectionResponsableRepository.findOne({
      where: {
        enseignant: { id: teacherId },
        section: { id: request.currentGroupe.section.id },
      },
    });

    if (!isResponsible) {
      throw new ForbiddenException(
        `You are not authorized to access this document`
      );
    }

    // Use direct query to retrieve document data properly
    const documentData = await this.changeRequestRepository.query(
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

    if (!documentData || documentData.length === 0) {
      throw new NotFoundException(
        `Document data not found for request ${requestId}`
      );
    }

    return {
      id: documentData[0].id,
      documentData: documentData[0].documentData,
      documentName: documentData[0].documentName,
      documentMimeType: documentData[0].documentMimeType,
      documentPath: documentData[0].documentPath,
    };
  }

  // Method to get metadata for a change request (without the document data)
  async getChangeRequestWithMetadata(
    teacherId: number,
    requestId: string
  ): Promise<any> {
    // First verify the teacher has access to this request
    const request = await this.changeRequestRepository.findOne({
      where: { id: requestId },
      relations: ["currentGroupe", "currentGroupe.section", "etudiant"],
    });

    if (!request) {
      throw new NotFoundException(`Change request #${requestId} not found`);
    }

    // Verify teacher is responsible for this section
    const isResponsible = await this.sectionResponsableRepository.findOne({
      where: {
        enseignant: { id: teacherId },
        section: { id: request.currentGroupe.section.id },
      },
    });

    if (!isResponsible) {
      throw new ForbiddenException(
        `You are not authorized to access this document`
      );
    }

    return {
      id: request.id,
      documentName: request.documentName,
      documentMimeType: request.documentMimeType,
      documentPath: request.documentPath,
      createdAt: request.createdAt,
      studentName: `${request.etudiant.firstName} ${request.etudiant.lastName}`,
    };
  }
}
