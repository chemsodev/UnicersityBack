import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, In } from "typeorm";
import { Enseignant } from "./enseignant.entity";
import { StudyModule } from "../modules/modules.entity";
import { Schedule } from "../schedules/entities/schedule.entity";
import { CreateEnseignantDto } from "./dto/create-enseignant.dto";
import { AssignModulesDto } from "./dto/assign-modules.dto";
import { UpdateEnseignantDto } from "./dto/update-enseignant.dto";
import { Section } from "../section/section.entity";
import { Etudiant } from "../etudiant/etudiant.entity";
import { SectionResponsable } from "../section/section-responsable.entity";
import { ChangeRequest, RequestStatus, RequestType } from "../change-request/change-request.entity";
import { Groupe, GroupeType } from "../groupe/groupe.entity";

@Injectable()
export class EnseignantService {
  constructor(
    @InjectRepository(Enseignant)
    private readonly enseignantRepository: Repository<Enseignant>,
    @InjectRepository(StudyModule)
    private readonly moduleRepository: Repository<StudyModule>,
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
    const enseignant = this.enseignantRepository.create(createEnseignantDto);
    return await this.enseignantRepository.save(enseignant);
  }

  async findAll(): Promise<Enseignant[]> {
    return this.enseignantRepository.find({
      relations: ["modules", "schedules"],
    });
  }

  async findOne(id: number): Promise<Enseignant> {
    const enseignant = await this.enseignantRepository.findOne({
      where: { id },
      relations: ["modules", "schedules"],
    });

    if (!enseignant) {
      throw new NotFoundException(`Enseignant with ID ${id} not found`);
    }

    return enseignant;
  }

  async findByIdEnseignant(idEnseignant: string): Promise<Enseignant> {
    const enseignant = await this.enseignantRepository.findOne({
      where: { id_enseignant: idEnseignant },
      relations: ["modules", "schedules"],
    });

    if (!enseignant) {
      throw new NotFoundException(
        `Enseignant with ID ${idEnseignant} not found`
      );
    }

    return enseignant;
  }

  async update(
    id: number,
    updateEnseignantDto: UpdateEnseignantDto
  ): Promise<Enseignant> {
    const enseignant = await this.findOne(id);

    // Update the fields
    Object.assign(enseignant, updateEnseignantDto);

    // Save the updated enseignant
    return this.enseignantRepository.save(enseignant);
  }

  async remove(id: number): Promise<void> {
    const result = await this.enseignantRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Enseignant with ID ${id} not found`);
    }
  }

  async assignModules(
    id: number,
    assignModulesDto: AssignModulesDto
  ): Promise<Enseignant> {
    const enseignant = await this.findOne(id);
    const modules: StudyModule[] = [];

    for (const moduleId of assignModulesDto.moduleIds) {
      const module = await this.moduleRepository.findOne({
        where: { id: moduleId },
      });

      if (!module) {
        throw new NotFoundException(`Module with ID ${moduleId} not found`);
      }

      modules.push(module);
    }

    enseignant.modules = modules;
    return this.enseignantRepository.save(enseignant);
  }

  async getSchedules(id: number): Promise<Schedule[]> {
    const enseignant = await this.findOne(id);
    
    // Instead of querying by uploadedById which doesn't exist,
    // we'll get all schedules and then filter by section
    const teacherSections = await this.getSectionsResponsable(id);
    
    if (!teacherSections || teacherSections.length === 0) {
      return [];
    }
    
    const sectionIds = teacherSections.map(section => section.id);
    
    // Get schedules by sectionIds instead
    return this.scheduleRepository.find({
      where: { 
        sectionId: In(sectionIds)
      },
      relations: ["section"],
    });
  }

  async getModules(id: number): Promise<StudyModule[]> {
    const enseignant = await this.enseignantRepository.findOne({
      where: { id },
      relations: ["modules"],
    });

    if (!enseignant) {
      throw new NotFoundException(`Enseignant with ID ${id} not found`);
    }

    return enseignant.modules;
  }

  async getSectionsResponsable(id: number): Promise<Section[]> {
    const enseignant = await this.enseignantRepository.findOne({
      where: { id }
    });

    if (!enseignant) {
      throw new NotFoundException(`Enseignant with ID ${id} not found`);
    }

    // Get section responsibilities
    const sectionResponsabilities = await this.sectionResponsableRepository.find({
      where: { enseignant: { id } },
      relations: ["section"]
    });

    if (!sectionResponsabilities || sectionResponsabilities.length === 0) {
      return [];
    }

    // Extract sections from responsibilities
    const sections = sectionResponsabilities.map(resp => resp.section);
    
    // Get full section details for each section
    const detailedSections = [];
    for (const section of sections) {
      const detailedSection = await this.sectionRepository.findOne({
        where: { id: section.id },
        relations: ["groupes", "department"]
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
      where: { id: teacherId }
    });

    if (!enseignant) {
      throw new NotFoundException(`Enseignant with ID ${teacherId} not found`);
    }

    // Get the teacher's sections
    const sections = await this.getSectionsResponsable(teacherId);
    if (!sections || sections.length === 0) {
      return []; // No sections, so no students
    }

    const sectionIds = sections.map(section => section.id);

    // Get students from these sections with pagination and search
    const skip = (page - 1) * limit;
    
    const query = this.etudiantRepository
      .createQueryBuilder("etudiant")
      .innerJoin("etudiant.sections", "section")
      .where("section.id IN (:...sectionIds)", { sectionIds })
      .take(limit)
      .skip(skip);

    if (search) {
      query.andWhere(qb => { // Use andWhere with a sub-query builder for OR conditions
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
    const uniqueStudents = Array.from(new Map(students.map(student => [student.id, student])).values());
    
    return uniqueStudents;
  }

  async getStudentsForTeacherSection(teacherId: number, sectionId: string): Promise<Etudiant[]> {
    // Verify that the teacher is responsible for this section
    const enseignant = await this.enseignantRepository.findOne({
      where: { id: teacherId }
    });

    if (!enseignant) {
      throw new NotFoundException(`Enseignant with ID ${teacherId} not found`);
    }

    const sectionResponsabilities = await this.sectionResponsableRepository.find({
      where: { 
        enseignant: { id: teacherId },
        section: { id: sectionId }
      }
    });

    // Check if the teacher is responsible for the section
    if (!sectionResponsabilities || sectionResponsabilities.length === 0) {
      throw new ForbiddenException(`Teacher ${teacherId} is not responsible for section ${sectionId}`);
    }

    // Get students for the section
    const students = await this.etudiantRepository
      .createQueryBuilder("etudiant")
      .innerJoin("etudiant.sections", "section")
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
      const sectionIds = sectionsResponsible.map(sr => sr.section.id);
      
      // Use a more efficient query with leftJoinAndSelect to avoid N+1 query problems
      // and optimize with a direct query using the sectionIds
      const requests = await this.changeRequestRepository
        .createQueryBuilder('request')
        .leftJoinAndSelect('request.etudiant', 'etudiant')
        .leftJoinAndSelect('request.currentGroupe', 'currentGroupe')
        .leftJoinAndSelect('request.requestedGroupe', 'requestedGroupe')
        .leftJoinAndSelect('currentGroupe.section', 'currentSection')
        .leftJoinAndSelect('requestedGroupe.section', 'requestedSection')
        .andWhere('request.requestType IN (:...types)', { 
          types: [RequestType.GROUPE_TD, RequestType.GROUPE_TP] 
        })
        .andWhere('currentSection.id IN (:...sectionIds)', { sectionIds })
        .getMany();

      // We no longer need to filter since the query already does it
      const filteredRequests = requests;

    // Map to a cleaner response format with safe property access
    return filteredRequests.map(request => ({
      id: request.id,
      studentId: request.etudiant?.id,
      studentName: `${request.etudiant?.firstName || ''} ${request.etudiant?.lastName || ''}`.trim(),
      matricule: request.etudiant?.matricule || '',
      sectionId: request.currentGroupe?.section?.id,
      sectionName: `${request.currentGroupe?.section?.specialty || 'Section'} - Section ${request.currentGroupe?.section?.name || 'N/A'}`,
      currentGroupType: request.currentGroupe?.type?.toLowerCase() || 'unknown',
      currentGroupName: request.currentGroupe?.name || '',
      requestedGroupType: request.requestedGroupe?.type?.toLowerCase() || 'unknown',
      requestedGroupName: request.requestedGroupe?.name || '',
      reason: request.justification || '',
      status: request.status?.toLowerCase() || 'pending',
      createdAt: request.createdAt,
      hasDocument: !!request.documentName || !!request.documentPath
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
        "requestedGroupe.section"
      ],
    });

    if (!request) {
      throw new NotFoundException(`Group change request #${requestId} not found`);
    }

    // Verify the teacher is responsible for the section
    const isResponsible = await this.sectionResponsableRepository.findOne({
      where: {
        enseignant: { id: teacherId },
        section: { id: request.currentGroupe.section.id },
      },
    });

    if (!isResponsible) {
      throw new ForbiddenException(`You are not authorized to manage this request`);
    }

    // Update the request status
    const newStatus = status === "approved" ? RequestStatus.APPROVED : RequestStatus.REJECTED;
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
      message: `Request ${newStatus === RequestStatus.APPROVED ? 'approved' : 'rejected'} successfully`
    };
  }

  // Method to apply the group change when approved
  private async applyGroupChange(request: ChangeRequest): Promise<void> {
    try {
      // Get the student with current group associations
      const student = await this.etudiantRepository.findOne({
        where: { id: request.etudiant.id },
        relations: ['tdGroupe', 'tpGroupe']
      });

      if (!student) {
        throw new NotFoundException(`Student with ID ${request.etudiant.id} not found`);
      }

      // Get the current and requested groups with full details
      const currentGroup = await this.groupeRepository.findOne({
        where: { id: request.currentGroupe.id }
      });
      
      const requestedGroup = await this.groupeRepository.findOne({
        where: { id: request.requestedGroupe.id }
      });

      if (!currentGroup || !requestedGroup) {
        throw new NotFoundException('One or both groups not found');
      }

      // Update the appropriate group based on request type
      if (request.requestType === RequestType.GROUPE_TD) {
        student.tdGroupe = requestedGroup;
        
        // Update occupancy counts
        if (currentGroup) {
          currentGroup.currentOccupancy = Math.max(0, currentGroup.currentOccupancy - 1);
          await this.groupeRepository.save(currentGroup);
        }
        
        requestedGroup.currentOccupancy += 1;
        await this.groupeRepository.save(requestedGroup);
      } else if (request.requestType === RequestType.GROUPE_TP) {
        student.tpGroupe = requestedGroup;
        
        // Update occupancy counts
        if (currentGroup) {
          currentGroup.currentOccupancy = Math.max(0, currentGroup.currentOccupancy - 1);
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
  async getChangeRequestDocument(teacherId: number, requestId: string): Promise<any> {
    // First verify the teacher has access to this request
    const request = await this.changeRequestRepository.findOne({
      where: { id: requestId },
      relations: ["currentGroupe", "currentGroupe.section"]
    });

    if (!request) {
      throw new NotFoundException(`Change request #${requestId} not found`);
    }

    // Verify teacher is responsible for this section
    const isResponsible = await this.sectionResponsableRepository.findOne({
      where: {
        enseignant: { id: teacherId },
        section: { id: request.currentGroupe.section.id }
      }
    });

    if (!isResponsible) {
      throw new ForbiddenException(`You are not authorized to access this document`);
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
      throw new NotFoundException(`Document data not found for request ${requestId}`);
    }

    return {
      id: documentData[0].id,
      documentData: documentData[0].documentData,
      documentName: documentData[0].documentName,
      documentMimeType: documentData[0].documentMimeType,
      documentPath: documentData[0].documentPath
    };
  }

  // Method to get metadata for a change request (without the document data)
  async getChangeRequestWithMetadata(teacherId: number, requestId: string): Promise<any> {
    // First verify the teacher has access to this request
    const request = await this.changeRequestRepository.findOne({
      where: { id: requestId },
      relations: ["currentGroupe", "currentGroupe.section", "etudiant"]
    });

    if (!request) {
      throw new NotFoundException(`Change request #${requestId} not found`);
    }

    // Verify teacher is responsible for this section
    const isResponsible = await this.sectionResponsableRepository.findOne({
      where: {
        enseignant: { id: teacherId },
        section: { id: request.currentGroupe.section.id }
      }
    });

    if (!isResponsible) {
      throw new ForbiddenException(`You are not authorized to access this document`);
    }

    return {
      id: request.id,
      documentName: request.documentName,
      documentMimeType: request.documentMimeType,
      documentPath: request.documentPath,
      createdAt: request.createdAt,
      studentName: `${request.etudiant.firstName} ${request.etudiant.lastName}`
    };
  }
}
