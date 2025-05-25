import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  Query,
  StreamableFile,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import { AdminRole } from "../../user.entity";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { ScheduleService } from "../../schedules/schedules.service";
import { CreateScheduleDto } from "../../schedules/dto/create-schedule.dto";
import { ScheduleType } from "../../schedules/schedules.types";
import { SectionScheduleService } from "../services/section-schedule.service";
import * as fs from "fs";
import { join } from "path";
import { createReadStream } from "fs";

@Controller("sections/schedules")
@UseGuards(JwtAuthGuard)
export class SectionScheduleController {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly sectionScheduleService: SectionScheduleService
  ) {}

  @Post(":sectionId/upload")
  @UseGuards(RolesGuard)
  @Roles(
    AdminRole.SECRETAIRE,
    AdminRole.CHEF_DE_DEPARTEMENT,
    AdminRole.ENSEIGNANT,
    AdminRole.DOYEN,
    AdminRole.VICE_DOYEN,
    AdminRole.CHEF_DE_SPECIALITE
  )
  @UseInterceptors(FileInterceptor("document"))
  async uploadSectionSchedule(
    @Param("sectionId") sectionId: string,
    @Body() createScheduleDto: CreateScheduleDto,
    @UploadedFile() document: Express.Multer.File
  ) {
    // Add section ID to the DTO
    createScheduleDto.sectionId = sectionId;

    return this.scheduleService.createWithDocument(createScheduleDto, document);
  }

  @Get(":sectionId")
  async getSectionSchedules(
    @Param("sectionId") sectionId: string,
    @Query("type") type?: ScheduleType
  ) {
    if (type) {
      return this.sectionScheduleService.findSchedulesByType(sectionId, type);
    }

    return this.sectionScheduleService.findBySection(sectionId);
  }

  @Get(":sectionId/latest")
  async getLatestSectionSchedule(@Param("sectionId") sectionId: string) {
    return this.sectionScheduleService.findLatestBySection(sectionId);
  }

  @Get(":sectionId/document/:scheduleId")
  async viewScheduleDocument(
    @Param("sectionId") sectionId: string,
    @Param("scheduleId") scheduleId: string,
    @Res() res: Response
  ) {
    try {
      const schedule = await this.scheduleService.findOne(scheduleId);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      if (schedule.section?.id !== sectionId) {
        return res
          .status(403)
          .json({ message: "Schedule does not belong to this section" });
      }
      if (!schedule.documentData || !schedule.documentName) {
        return res.status(404).json({ message: "Document file not found" });
      }
      const mimeType = schedule.documentMimeType || "application/octet-stream";
      res.set({
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${schedule.documentName}"`,
      });
      return res.end(schedule.documentData);
    } catch (error) {
      console.error("Error serving schedule document:", error);
      return res.status(500).json({ message: "Error serving document" });
    }
  }

  @Get(":sectionId/download/:scheduleId")
  async downloadScheduleDocument(
    @Param("sectionId") sectionId: string,
    @Param("scheduleId") scheduleId: string,
    @Res() res: Response
  ) {
    try {
      const schedule = await this.scheduleService.findOne(scheduleId);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      if (schedule.section?.id !== sectionId) {
        return res
          .status(403)
          .json({ message: "Schedule does not belong to this section" });
      }
      if (!schedule.documentData || !schedule.documentName) {
        return res.status(404).json({ message: "Document file not found" });
      }
      const mimeType = schedule.documentMimeType || "application/octet-stream";
      res.set({
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${schedule.documentName}"`,
      });
      return res.end(schedule.documentData);
    } catch (error) {
      console.error("Error downloading schedule document:", error);
      return res.status(500).json({ message: "Error downloading document" });
    }
  }

  @Delete(":sectionId/:scheduleId")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  async deleteSectionSchedule(
    @Param("sectionId") sectionId: string,
    @Param("scheduleId") scheduleId: string
  ) {
    // Verify the schedule belongs to the section before deleting
    const schedule = await this.scheduleService.findOne(scheduleId);

    if (schedule && schedule.section?.id === sectionId) {
      return this.scheduleService.remove(scheduleId);
    }

    return { error: "Schedule not found or does not belong to this section" };
  }

  @Get(":sectionId/stats")
  async getSectionScheduleStats(@Param("sectionId") sectionId: string) {
    // Use the dedicated service for statistics
    return this.sectionScheduleService.getScheduleStatistics(sectionId);
  }

  /**
   * Helper method to get MIME type from file extension
   */
  private getMimeType(filePath: string): string {
    const extension = this.getFileExtension(filePath);

    const mimeTypes = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      txt: "text/plain",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
    };

    return mimeTypes[extension] || "application/octet-stream";
  }

  /**
   * Helper method to get file extension
   */
  private getFileExtension(filePath: string): string {
    return filePath.split(".").pop().toLowerCase();
  }
}
