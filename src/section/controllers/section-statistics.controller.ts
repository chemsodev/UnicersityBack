import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import { AdminRole } from "../../user.entity";
import {
  SectionStatisticsService,
  SectionStatisticsDto,
  SectionAnalyticsDto,
} from "../services/section-statistics.service";

@Controller("sections/statistics")
@UseGuards(JwtAuthGuard)
export class SectionStatisticsController {
  constructor(private readonly statisticsService: SectionStatisticsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(
    AdminRole.DOYEN,
    AdminRole.VICE_DOYEN,
    AdminRole.CHEF_DE_DEPARTEMENT,
    AdminRole.CHEF_DE_SPECIALITE,
    AdminRole.SECRETAIRE
  )
  async getSectionStatistics(
    @Query("departmentId") departmentId?: string,
    @Query("level") level?: string,
    @Query("specialty") specialty?: string
  ): Promise<SectionStatisticsDto[]> {
    return this.statisticsService.getSectionStatistics(
      departmentId,
      level,
      specialty
    );
  }

  @Get("analytics")
  @UseGuards(RolesGuard)
  @Roles(
    AdminRole.DOYEN,
    AdminRole.VICE_DOYEN,
    AdminRole.CHEF_DE_DEPARTEMENT,
    AdminRole.CHEF_DE_SPECIALITE,
    AdminRole.SECRETAIRE
  )
  async getSectionAnalytics(
    @Query("departmentId") departmentId?: string
  ): Promise<SectionAnalyticsDto> {
    return this.statisticsService.getSectionAnalytics(departmentId);
  }

  @Get(":sectionId/growth")
  @UseGuards(RolesGuard)
  @Roles(
    AdminRole.DOYEN,
    AdminRole.VICE_DOYEN,
    AdminRole.CHEF_DE_DEPARTEMENT,
    AdminRole.CHEF_DE_SPECIALITE,
    AdminRole.SECRETAIRE
  )
  async getSectionGrowthStatistics(@Param("sectionId") sectionId: string) {
    return this.statisticsService.getSectionGrowthStatistics(sectionId);
  }
}
