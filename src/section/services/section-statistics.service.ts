import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Section } from "../section.entity";
import { Department } from "../../departments/departments.entity";
import { Etudiant } from "../../etudiant/etudiant.entity";
import { Groupe, GroupeType } from "../../groupe/groupe.entity";
import { Schedule } from "../../schedules/entities/schedule.entity";

export interface SectionStatisticsDto {
  id: string;
  name: string;
  level: string;
  specialty: string;
  departmentId: number;
  departmentName: string;
  capacity: number;
  studentCount: number;
  groupCount: { td: number; tp: number };
  occupancyRate: string; // As a percentage string (e.g., "85%")
  delegateId?: string;
  delegateName?: string;
}

export interface SectionAnalyticsDto {
  totalStudents: number;
  totalCapacity: number;
  averageOccupancyRate: string;
  sectionsByLevel: { level: string; count: number }[];
  sectionsBySpecialty: { specialty: string; count: number }[];
  sectionsByOccupancy: { range: string; count: number }[];
}

export interface SectionGrowthStatistics {
  sectionId: string;
  sectionName: string;
  currentYearStudents: number;
  previousYearStudents: number;
  growthRate: string;
  growthTrend: "increasing" | "decreasing" | "stable";
}

@Injectable()
export class SectionStatisticsService {
  constructor(
    @InjectRepository(Section)
    private readonly sectionRepo: Repository<Section>,
    @InjectRepository(Etudiant)
    private readonly etudiantRepo: Repository<Etudiant>,
    @InjectRepository(Groupe)
    private readonly groupeRepo: Repository<Groupe>,
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>
  ) {}

  /**
   * Get detailed statistics for all sections or specific sections
   */
  async getSectionStatistics(
    departmentId?: string,
    level?: string,
    specialty?: string
  ): Promise<SectionStatisticsDto[]> {
    // Build the base query to find sections based on filters
    let query = this.sectionRepo
      .createQueryBuilder("section")
      .leftJoinAndSelect("section.department", "department");

    if (departmentId) {
      query = query.where("department.id = :departmentId", { departmentId });
    }

    if (level) {
      query = query.andWhere("section.level = :level", { level });
    }

    if (specialty) {
      query = query.andWhere("section.specialty = :specialty", { specialty });
    }

    // Execute the query
    const sections = await query.getMany();

    // Enhanced statistics for each section
    const statistics: SectionStatisticsDto[] = [];

    for (const section of sections) {
      // Count students
      const studentCount = await this.etudiantRepo
        .createQueryBuilder("etudiant")
        .innerJoin("etudiant.sections", "section", "section.id = :sectionId", {
          sectionId: section.id,
        })
        .getCount();

      // Count groups
      const tdGroups = await this.groupeRepo.count({
        where: {
          section: { id: section.id },
          type: GroupeType.TD,
        },
      });

      const tpGroups = await this.groupeRepo.count({
        where: {
          section: { id: section.id },
          type: GroupeType.TP,
        },
      });

      // Find delegate
      const delegate = await this.etudiantRepo.findOne({
        where: {
          sections: { id: section.id },
          isSectionDelegate: true,
        },
      });

      // Calculate occupancy rate
      const capacity = section.capacity || 100; // Default capacity if not set
      const occupancyRateNumber = Math.round((studentCount / capacity) * 100);
      const occupancyRate = `${occupancyRateNumber}%`;

      statistics.push({
        id: section.id,
        name: section.name,
        level: section.level,
        specialty: section.specialty,
        departmentId: section.department?.id,
        departmentName: section.department?.name,
        capacity: section.capacity,
        studentCount: studentCount,
        groupCount: { td: tdGroups, tp: tpGroups },
        occupancyRate: occupancyRate,
        delegateId: delegate?.id?.toString(),
        delegateName: delegate
          ? `${delegate.firstName} ${delegate.lastName}`
          : null,
      });
    }

    return statistics;
  }

  /**
   * Get detailed analytics across all sections
   */
  async getSectionAnalytics(
    departmentId?: string
  ): Promise<SectionAnalyticsDto> {
    // Get all sections (filtered by department if specified)
    let query = this.sectionRepo.createQueryBuilder("section");

    if (departmentId) {
      query = query
        .leftJoin("section.department", "department")
        .where("department.id = :departmentId", { departmentId });
    }

    const sections = await query.getMany();

    // Calculate totals
    let totalStudents = 0;
    let totalCapacity = 0;
    const levelCounts = {};
    const specialtyCounts = {};
    const occupancyRanges = {
      "Below 50%": 0,
      "50% - 75%": 0,
      "75% - 90%": 0,
      "90% - 100%": 0,
      "Over 100%": 0,
    };

    for (const section of sections) {
      // Get student count
      const studentCount = await this.etudiantRepo
        .createQueryBuilder("etudiant")
        .innerJoin("etudiant.sections", "section", "section.id = :sectionId", {
          sectionId: section.id,
        })
        .getCount();

      // Increment totals
      totalStudents += studentCount;
      totalCapacity += section.capacity || 100;

      // Count by level
      levelCounts[section.level] = (levelCounts[section.level] || 0) + 1;

      // Count by specialty
      specialtyCounts[section.specialty] =
        (specialtyCounts[section.specialty] || 0) + 1;

      // Calculate occupancy rate and categorize
      const occupancyRate = (studentCount / (section.capacity || 100)) * 100;

      if (occupancyRate < 50) {
        occupancyRanges["Below 50%"]++;
      } else if (occupancyRate < 75) {
        occupancyRanges["50% - 75%"]++;
      } else if (occupancyRate < 90) {
        occupancyRanges["75% - 90%"]++;
      } else if (occupancyRate <= 100) {
        occupancyRanges["90% - 100%"]++;
      } else {
        occupancyRanges["Over 100%"]++;
      }
    }

    // Calculate average occupancy
    const avgOccupancy =
      totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;

    // Format data for return
    const analytics: SectionAnalyticsDto = {
      totalStudents,
      totalCapacity,
      averageOccupancyRate: `${avgOccupancy}%`,
      sectionsByLevel: Object.entries(levelCounts).map(([level, count]) => ({
        level,
        count: count as number,
      })),
      sectionsBySpecialty: Object.entries(specialtyCounts).map(
        ([specialty, count]) => ({
          specialty,
          count: count as number,
        })
      ),
      sectionsByOccupancy: Object.entries(occupancyRanges).map(
        ([range, count]) => ({
          range,
          count: count as number,
        })
      ),
    };

    return analytics;
  }

  /**
   * Get section growth statistics comparing current academic year with previous
   * @param sectionId Section ID to get growth statistics for
   */
  async getSectionGrowthStatistics(
    sectionId: string
  ): Promise<SectionGrowthStatistics> {
    const section = await this.sectionRepo.findOne({
      where: { id: sectionId },
    });

    if (!section) {
      throw new Error("Section not found");
    }

    // Get current academic year student count
    const currentYearStudents = await this.etudiantRepo
      .createQueryBuilder("etudiant")
      .innerJoin("etudiant.sections", "section", "section.id = :sectionId", {
        sectionId,
      })
      .getCount();

    // We'll simulate previous year data (in a real app this would come from historical data)
    // This is just for demonstration purposes
    const previousYearStudents = Math.floor(currentYearStudents * 0.9); // 10% less than current
    const growthRate =
      previousYearStudents > 0
        ? ((currentYearStudents - previousYearStudents) /
            previousYearStudents) *
          100
        : 100;

    return {
      sectionId,
      sectionName: section.name,
      currentYearStudents,
      previousYearStudents,
      growthRate: `${Math.round(growthRate)}%`,
      growthTrend:
        growthRate > 0
          ? "increasing"
          : growthRate < 0
          ? "decreasing"
          : "stable",
    };
  }
}
