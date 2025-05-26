// src/section/section.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Section } from "./section.entity";
import { Department } from "../departments/departments.entity";
import { Etudiant } from "../etudiant/etudiant.entity";
import { Groupe } from "../groupe/groupe.entity";
import { CreateSectionDto } from "./dto/create-section.dto";
import { UpdateSectionDto } from "./dto/update-section.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/notification.entity";
import { SectionResponsableService } from "./section-responsable.service";
import { Enseignant } from "../enseignant/enseignant.entity";
import { ResponsableRole } from "./section-responsable.entity";
import { toNumberOrStringId } from "../utils/id-conversion.util";

@Injectable()
export class SectionService {
  constructor(
    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(Etudiant)
    private readonly etudiantRepo: Repository<Etudiant>,
    @InjectRepository(Groupe)
    private readonly groupeRepo: Repository<Groupe>,
    @InjectRepository(Enseignant)
    private readonly enseignantRepo: Repository<Enseignant>,
    private readonly notificationsService: NotificationsService,
    private readonly sectionResponsableService: SectionResponsableService
  ) {}

  async create(
    createSectionDto: CreateSectionDto,
    adminId: string
  ): Promise<Section> {
    try {
      const department = await this.departmentRepo.findOneBy({
        id: createSectionDto.departmentId,
      });
      if (!department) {
        throw new NotFoundException(
          `Department with ID ${createSectionDto.departmentId} not found`
        );
      }

      const section = this.sectionRepo.create({
        ...createSectionDto,
        department,
      });

      const savedSection = await this.sectionRepo.save(section);

      // Get all students in the department through their sections
      const students = await this.etudiantRepo
        .createQueryBuilder("etudiant")
        .innerJoin("etudiant.sections", "section")
        .where("section.departmentId = :departmentId", {
          departmentId: department.id,
        })
        .getMany();

      // Create notifications for each student
      for (const student of students) {
        await this.notificationsService.create({
          title: "Nouvelle section créée",
          content: `Une nouvelle section ${savedSection.name} a été créée dans votre département.`,
          type: NotificationType.ADMIN,
          userId: student.id,
        });
      }

      return savedSection;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error creating section: ${error.message}`);
    }
  }
  findAll(
    departmentId?: number,
    level?: string,
    specialty?: string
  ): Promise<Section[]> {
    const query = this.sectionRepo
      .createQueryBuilder("section")
      .leftJoinAndSelect("section.department", "department");

    if (departmentId) {
      query.where("section.departmentId = :departmentId", { departmentId });
    }
    if (level) {
      query.andWhere("section.level = :level", { level });
    }
    if (specialty) {
      query.andWhere("section.specialty = :specialty", { specialty });
    }

    return query.getMany();
  }

  findOne(id: string): Promise<Section> {
    return this.sectionRepo.findOne({
      where: { id },
      relations: [
        "department",
        "groupes",
        "etudiants",
        "responsables",
        "responsables.enseignant",
      ],
    });
  }

  async findStudents(id: string): Promise<Etudiant[]> {
    const section = await this.sectionRepo.findOne({
      where: { id },
      relations: ["etudiants"],
    });
    if (!section) {
      throw new NotFoundException("Section not found");
    }
    return section.etudiants;
  }
  async findGroups(id: string, type?: string): Promise<Groupe[]> {
    console.log(
      `[Section Service] Finding groups for section ID: ${id}, type: ${type}`
    );
    try {
      const query = this.groupeRepo
        .createQueryBuilder("groupe")
        .leftJoinAndSelect("groupe.section", "section")
        .where("section.id = :id", { id });

      if (type) {
        query.andWhere("groupe.type = :type", { type });
      }

      const groups = await query.getMany();

      console.log(
        `[Section Service] Found ${groups.length} groups for section ${id}`
      );

      // Log group details for debugging
      if (groups.length > 0) {
        const groupSummary = groups.map((g) => ({
          id: g.id,
          name: g.name,
          type: g.type,
          currentOccupancy: g.currentOccupancy,
          capacity: g.capacity,
        }));

        console.log(
          `[Section Service] Group details:`,
          JSON.stringify(groupSummary, null, 2)
        );
      }

      return groups;
    } catch (error) {
      console.error(
        `[Section Service] Error finding groups for section ${id}:`,
        error
      );
      throw error;
    }
  }

  async update(
    id: string,
    updateSectionDto: UpdateSectionDto,
    adminId: string
  ): Promise<Section> {
    const section = await this.sectionRepo.findOneBy({ id });
    if (!section) {
      throw new NotFoundException("Section not found");
    }

    if (updateSectionDto.departmentId) {
      const department = await this.departmentRepo.findOneBy({
        id: updateSectionDto.departmentId,
      });
      if (!department) {
        throw new NotFoundException("Department not found");
      }
      section.department = department;
    }

    Object.assign(section, updateSectionDto);
    const updatedSection = await this.sectionRepo.save(section);

    await this.notificationsService.create({
      title: "Section mise à jour",
      content: `La section ${updatedSection.name} a été mise à jour.`,
      type: NotificationType.ADMIN,
      userId: adminId,
    });

    return updatedSection;
  }

  async remove(id: string): Promise<void> {
    const result = await this.sectionRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException("Section not found");
    }
  }

  async assignStudentToSection(
    sectionId: string,
    studentId: string
  ): Promise<Section> {
    const section = await this.sectionRepo.findOne({
      where: { id: sectionId },
      relations: ["etudiants"],
    });
    if (!section) throw new NotFoundException("Section not found");

    // Convert IDs to string for comparison
    const studentExists = section.etudiants.some(
      (e) => String(e.id) === String(studentId)
    );

    if (!studentExists) {
      // Convert studentId to appropriate type
      const entityId = toNumberOrStringId(studentId);
      const student = await this.etudiantRepo.findOne({
        where: { id: entityId as any },
      });

      if (!student) {
        throw new NotFoundException(`Student with ID ${studentId} not found`);
      }

      section.etudiants.push(student);
      await this.sectionRepo.save(section);

      // Create notification for the student
      await this.notificationsService.create({
        title: "Affectation à une nouvelle section",
        content: `Vous avez été affecté(e) à la section ${section.name}. Consultez votre nouvel emploi du temps.`,
        type: NotificationType.ADMIN,
        userId: studentId,
      });
    }

    return section;
  }

  async removeStudentFromSection(
    sectionId: string,
    studentId: string
  ): Promise<Section> {
    const section = await this.sectionRepo.findOne({
      where: { id: sectionId },
      relations: ["etudiants"],
    });
    if (!section) throw new NotFoundException("Section not found");

    // Convert IDs to string for comparison
    section.etudiants = section.etudiants.filter(
      (e) => String(e.id) !== String(studentId)
    );
    const updatedSection = await this.sectionRepo.save(section);

    // Create notification for the student
    await this.notificationsService.create({
      title: "Retrait de section",
      content: `Vous avez été retiré(e) de la section ${section.name}.`,
      type: NotificationType.ADMIN,
      userId: studentId,
    });

    return updatedSection;
  }

  async getResponsables(id: string) {
    // First check if the section exists
    const section = await this.sectionRepo.findOne({
      where: { id },
      relations: ["department"],
    });

    if (!section) {
      throw new NotFoundException("Section not found");
    }

    // Get all the responsables for this section
    const responsables =
      await this.sectionResponsableService.getResponsablesForSection(id);

    // Format the responsables into the expected structure
    return this.formatResponsables(responsables);
  }

  private formatResponsables(responsables: any[]) {
    const result = {
      filiere: { nom: "Non assigné" },
      section: { nom: "Non assigné" },
      td: { nom: "Non assigné" },
      tp: { nom: "Non assigné" },
    };

    // Map each responsable to the correct role
    responsables.forEach((resp) => {
      if (resp.role === ResponsableRole.FILIERE && resp.enseignant) {
        result.filiere = {
          nom: `${resp.enseignant.firstName} ${resp.enseignant.lastName}`,
        };
      } else if (resp.role === ResponsableRole.SECTION && resp.enseignant) {
        result.section = {
          nom: `${resp.enseignant.firstName} ${resp.enseignant.lastName}`,
        };
      } else if (resp.role === ResponsableRole.TD && resp.enseignant) {
        result.td = {
          nom: `${resp.enseignant.firstName} ${resp.enseignant.lastName}`,
        };
      } else if (resp.role === ResponsableRole.TP && resp.enseignant) {
        result.tp = {
          nom: `${resp.enseignant.firstName} ${resp.enseignant.lastName}`,
        };
      }
    });

    return result;
  }
}
