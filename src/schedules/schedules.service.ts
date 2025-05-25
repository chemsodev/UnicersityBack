import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Section } from "../section/section.entity";
import { Schedule } from "./entities/schedule.entity";
import { UpdateScheduleDto } from "./dto/update-schedule.dto";
import { CreateScheduleDto } from "./dto/create-schedule.dto";
import { NotificationsService } from "../notifications/notifications.service";
import { NotificationType } from "../notifications/notification.entity";
import { ScheduleType } from "./schedules.types";

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
    private readonly notificationsService: NotificationsService
  ) {}

  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    // Check if section exists
    const section = await this.sectionRepository.findOne({
      where: { id: createScheduleDto.sectionId },
    });

    if (!section) {
      throw new NotFoundException(
        `Section with ID ${createScheduleDto.sectionId} not found`
      );
    }

    // Remove id if present
    const { id, ...dtoWithoutId } = createScheduleDto as any;

    // Create new schedule
    const schedule = this.scheduleRepository.create(dtoWithoutId);
    const savedSchedule = (await this.scheduleRepository.save(
      schedule
    )) as unknown as Schedule;

    // Notify students in the section about the new schedule
    await this.notifyStudentsOfScheduleChange(
      section,
      "Nouvel emploi du temps disponible",
      `Un nouvel emploi du temps a été publié pour votre section.`
    );

    return savedSchedule;
  }

  async createWithDocument(
    createScheduleDto: CreateScheduleDto,
    documentFile: Express.Multer.File
  ): Promise<Schedule> {
    // Check if section exists
    const section = await this.sectionRepository.findOne({
      where: { id: createScheduleDto.sectionId },
    });

    if (!section) {
      throw new NotFoundException(
        `Section with ID ${createScheduleDto.sectionId} not found`
      );
    }

    // Validate file
    if (!documentFile) {
      throw new BadRequestException("Document file is required");
    }

    // Remove id if present
    const { id, ...dtoWithoutId } = createScheduleDto as any;

    // Create new schedule with document
    const schedule = this.scheduleRepository.create({
      ...dtoWithoutId,
      documentData: documentFile.buffer,
      documentName: documentFile.originalname,
      documentMimeType: documentFile.mimetype,
    });

    const savedSchedule = (await this.scheduleRepository.save(
      schedule
    )) as unknown as Schedule;

    // Notify students in the section about the new schedule
    await this.notifyStudentsOfScheduleChange(
      section,
      "Nouvel emploi du temps disponible",
      `Un nouvel emploi du temps a été publié pour votre section.`
    );

    return savedSchedule;
  }

  async findAll(): Promise<Schedule[]> {
    return this.scheduleRepository.find({
      relations: ["section", "uploadedBy"],
      order: { createdAt: "DESC" },
    });
  }

  async findBySection(sectionId: string): Promise<Schedule[]> {
    return this.scheduleRepository.find({
      where: {
        sectionId,
        scheduleType: ScheduleType.REGULAR, // Default to REGULAR type
      },
      relations: ["uploadedBy"],
      order: { createdAt: "DESC" },
    });
  }

  async findLatestBySection(sectionId: string): Promise<Schedule> {
    const schedules = await this.scheduleRepository.find({
      where: {
        sectionId,
        scheduleType: ScheduleType.REGULAR, // Default to REGULAR type
      },
      relations: ["uploadedBy"],
      order: { createdAt: "DESC" },
      take: 1,
    });

    if (schedules.length === 0) {
      throw new NotFoundException(`No schedule found for section ${sectionId}`);
    }

    return schedules[0];
  }

  async findOne(id: string): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ["section", "uploadedBy"],
    });

    if (!schedule) {
      throw new NotFoundException("Emploi du temps non trouvé");
    }

    return schedule;
  }

  async getScheduleWithDocument(scheduleId: string): Promise<Schedule> {
    console.log(`Retrieving document for schedule ID: ${scheduleId}`);

    try {
      // Check if schedule exists
      const scheduleExists = await this.scheduleRepository.findOne({
        where: { id: scheduleId },
      });

      if (!scheduleExists) {
        throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
      }

      // Use direct SQL query to ensure proper binary data retrieval
      const rawResult = await this.scheduleRepository.query(
        `SELECT
                    id,
                    document_data as "documentData",
                    document_name as "documentName",
                    document_mime_type as "documentMimeType"
                FROM schedules
                WHERE id = $1`,
        [scheduleId]
      );

      if (!rawResult || rawResult.length === 0) {
        throw new NotFoundException(
          `Schedule document not found for ID: ${scheduleId}`
        );
      }

      const scheduleDoc = rawResult[0];

      console.log(
        `Document found: ${scheduleDoc.documentName}, Size: ${
          scheduleDoc.documentData?.length || 0
        } bytes`
      );

      if (!scheduleDoc.documentData || scheduleDoc.documentData.length === 0) {
        console.log(`No document found for schedule ${scheduleId}`);
      }

      return scheduleDoc;
    } catch (error) {
      console.error(`Error retrieving schedule document: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    updateScheduleDto: UpdateScheduleDto
  ): Promise<Schedule> {
    const existingSchedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ["section"],
    });

    if (!existingSchedule) {
      throw new NotFoundException("Schedule not found");
    }

    Object.assign(existingSchedule, updateScheduleDto);
    const updatedSchedule = await this.scheduleRepository.save(
      existingSchedule
    );

    // If section exists, notify students about the update
    if (existingSchedule.section) {
      await this.notifyStudentsOfScheduleChange(
        existingSchedule.section,
        "Mise à jour de l'emploi du temps",
        `L'emploi du temps de votre section a été mis à jour.`
      );
    }

    return updatedSchedule;
  }

  async updateWithDocument(
    id: string,
    updateScheduleDto: UpdateScheduleDto,
    documentFile: Express.Multer.File
  ): Promise<Schedule> {
    const existingSchedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ["section"],
    });

    if (!existingSchedule) {
      throw new NotFoundException("Schedule not found");
    }

    // Update schedule with document
    Object.assign(existingSchedule, {
      ...updateScheduleDto,
      documentData: documentFile.buffer,
      documentName: documentFile.originalname,
      documentMimeType: documentFile.mimetype,
    });

    const updatedSchedule = await this.scheduleRepository.save(
      existingSchedule
    );

    // If section exists, notify students about the update
    if (existingSchedule.section) {
      await this.notifyStudentsOfScheduleChange(
        existingSchedule.section,
        "Mise à jour de l'emploi du temps",
        `L'emploi du temps de votre section a été mis à jour.`
      );
    }

    return updatedSchedule;
  }

  async remove(id: string): Promise<void> {
    const existingSchedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ["section"],
    });

    if (!existingSchedule) {
      throw new NotFoundException("Schedule not found");
    }

    await this.scheduleRepository.remove(existingSchedule);

    // If section exists, notify students about the deletion
    if (existingSchedule.section) {
      await this.notifyStudentsOfScheduleChange(
        existingSchedule.section,
        "Emploi du temps supprimé",
        `Un emploi du temps de votre section a été supprimé.`
      );
    }
  }

  async findExamSchedulesBySpecialtyAndLevel(
    specialty: string,
    level: string
  ): Promise<Schedule[]> {
    // Find all sections with the given specialty and level
    const sections = await this.sectionRepository.find({
      where: { specialty, level },
    });

    if (!sections || sections.length === 0) {
      return [];
    }

    const sectionIds = sections.map((section) => section.id);

    // Find all exam schedules for these sections
    return this.scheduleRepository.find({
      where: {
        sectionId: In(sectionIds),
        scheduleType: ScheduleType.EXAM,
      },
      relations: ["section", "uploadedBy"],
      order: { createdAt: "DESC" },
    });
  }

  async findSchedulesByType(
    sectionId: string,
    type: ScheduleType
  ): Promise<Schedule[]> {
    if (!type) {
      type = ScheduleType.REGULAR; // Default to REGULAR if type is not provided
    }

    return this.scheduleRepository.find({
      where: {
        sectionId,
        scheduleType: type,
      },
      relations: ["uploadedBy"],
      order: { createdAt: "DESC" },
    });
  }

  // Helper method to notify students in a section
  private async notifyStudentsOfScheduleChange(
    section: Section,
    title: string,
    message: string
  ): Promise<void> {
    try {
      // Get students in the section with fresh data
      const fullSection = await this.sectionRepository.findOne({
        where: { id: section.id },
        relations: ["etudiants"],
      });

      if (fullSection && fullSection.etudiants) {
        for (const etudiant of fullSection.etudiants) {
          await this.notificationsService.create({
            title,
            content: message,
            type: NotificationType.EMPLOI_DU_TEMPS,
            userId: etudiant.id,
          });
        }
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
      // Continue execution - notifications shouldn't block the main operation
    }
  }
}
