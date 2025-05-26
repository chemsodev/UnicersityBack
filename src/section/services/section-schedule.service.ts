import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Schedule } from "../../schedules/entities/schedule.entity";
import { ScheduleType } from "../../schedules/schedules.types";

@Injectable()
export class SectionScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>
  ) {}

  /**
   * Find all schedules for a section
   */
  async findBySection(sectionId: string): Promise<Schedule[]> {
    return this.scheduleRepository.find({
      where: { sectionId: sectionId },
      relations: ["uploadedBy"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Find schedules by type for a section
   */
  async findSchedulesByType(
    sectionId: string,
    type: ScheduleType
  ): Promise<Schedule[]> {
    return this.scheduleRepository.find({
      where: {
        sectionId: sectionId,
        scheduleType: type,
      },
      relations: ["uploadedBy"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Find the latest schedule for a section
   */
  async findLatestBySection(sectionId: string): Promise<Schedule | null> {
    return this.scheduleRepository.findOne({
      where: { sectionId: sectionId },
      relations: ["uploadedBy"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Get statistics about schedules for a section
   */
  async getScheduleStatistics(sectionId: string) {
    const allSchedules = await this.findBySection(sectionId);
    const regularSchedules = await this.findSchedulesByType(
      sectionId,
      ScheduleType.REGULAR
    );
    const examSchedules = await this.findSchedulesByType(
      sectionId,
      ScheduleType.EXAM
    );

    // Find the latest uploaded schedule
    let latestUpload = null;
    if (allSchedules && allSchedules.length > 0) {
      latestUpload = allSchedules[0]; // Already sorted by createdAt DESC
    }

    return {
      totalSchedules: allSchedules.length,
      regularSchedules: regularSchedules.length,
      examSchedules: examSchedules.length,
      latestUpload: latestUpload
        ? {
            id: latestUpload.id,
            title: latestUpload.title,
            type: latestUpload.scheduleType,
            createdAt: latestUpload.createdAt,
          }
        : null,
    };
  }
}
