import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from "@nestjs/common";
import { ScheduleService } from "./schedules.service";
import { CreateScheduleDto } from "./dto/create-schedule.dto";
import { UpdateScheduleDto } from "./dto/update-schedule.dto";
import { Schedule } from "./entities/schedule.entity";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../roles/roles.guard";
import { Roles } from "../roles/roles.decorator";
import { AdminRole } from "../user.entity";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { ScheduleType } from "./schedules.types";

@Controller("schedules")
@UseGuards(JwtAuthGuard)
export class SchedulesController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(
    AdminRole.SECRETAIRE,
    AdminRole.CHEF_DE_DEPARTEMENT,
    AdminRole.ENSEIGNANT
  )
  async create(
    @Body() createScheduleDto: CreateScheduleDto
  ): Promise<Schedule> {
    return this.scheduleService.create(createScheduleDto);
  }

  @Post("upload")
  @UseGuards(RolesGuard)
  @Roles(
    AdminRole.SECRETAIRE,
    AdminRole.CHEF_DE_DEPARTEMENT,
    AdminRole.ENSEIGNANT
  )
  @UseInterceptors(FileInterceptor("document"))
  async uploadSchedule(
    @Body() createScheduleDto: CreateScheduleDto,
    @UploadedFile() document: Express.Multer.File
  ): Promise<Schedule> {
    if (!document) {
      throw new BadRequestException("No file uploaded");
    }
    return this.scheduleService.createWithDocument(createScheduleDto, document);
  }

  @Get()
  async findAll(): Promise<Schedule[]> {
    return this.scheduleService.findAll();
  }

  @Get("section/:sectionId")
  async findBySection(
    @Param("sectionId") sectionId: string
  ): Promise<Schedule[]> {
    return this.scheduleService.findBySection(sectionId);
  }

  @Get("section/:sectionId/latest")
  async findLatestBySection(
    @Param("sectionId") sectionId: string
  ): Promise<Schedule> {
    return this.scheduleService.findLatestBySection(sectionId);
  }

  @Get("specialty/:specialty/level/:level/exams")
  async findExamSchedulesBySpecialtyAndLevel(
    @Param("specialty") specialty: string,
    @Param("level") level: string
  ): Promise<Schedule[]> {
    return this.scheduleService.findExamSchedulesBySpecialtyAndLevel(
      specialty,
      level
    );
  }

  @Get("section/:sectionId/type/:type")
  async findSchedulesByType(
    @Param("sectionId") sectionId: string,
    @Param("type") type: string
  ): Promise<Schedule[]> {
    // Validate the type parameter
    if (!type || !Object.values(ScheduleType).includes(type as ScheduleType)) {
      throw new BadRequestException(
        "Invalid schedule type. Must be one of: regular, exam, special"
      );
    }
    return this.scheduleService.findSchedulesByType(
      sectionId,
      type as ScheduleType
    );
  }

  @Get(":id")
  async findOne(@Param("id") id: string): Promise<Schedule> {
    return this.scheduleService.findOne(id);
  }

  @Get(":id/document")
  async getScheduleDocument(@Param("id") id: string, @Res() res: Response) {
    try {
      const schedule = await this.scheduleService.getScheduleWithDocument(id);

      if (!schedule) {
        throw new BadRequestException("Schedule not found");
      }

      // Check if document data exists and has actual content
      if (!schedule.documentData || schedule.documentData.length === 0) {
        console.log(`No document found for schedule ${id}`);

        // Return a 204 No Content response instead of an error
        return res.status(204).send();
      }

      console.log(
        `Serving document: ${schedule.documentName}, ${schedule.documentMimeType}, Size: ${schedule.documentData.length} bytes`
      );

      // Set appropriate headers for the document
      res.set({
        "Content-Type": schedule.documentMimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${
          schedule.documentName || "schedule-document"
        }"`,
        "Content-Length": schedule.documentData.length,
      });

      // Send the binary data
      return res.send(schedule.documentData);
    } catch (error) {
      console.error(`Error retrieving schedule document: ${error.message}`);
      if (error.status === 404) {
        return res.status(204).send();
      }
      throw error;
    }
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(
    AdminRole.SECRETAIRE,
    AdminRole.CHEF_DE_DEPARTEMENT,
    AdminRole.ENSEIGNANT
  )
  async update(
    @Param("id") id: string,
    @Body() updateScheduleDto: UpdateScheduleDto
  ): Promise<Schedule> {
    return this.scheduleService.update(id, updateScheduleDto);
  }

  @Patch(":id/update-document")
  @UseGuards(RolesGuard)
  @Roles(
    AdminRole.SECRETAIRE,
    AdminRole.CHEF_DE_DEPARTEMENT,
    AdminRole.ENSEIGNANT
  )
  @UseInterceptors(FileInterceptor("document"))
  async updateWithDocument(
    @Param("id") id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
    @UploadedFile() document: Express.Multer.File
  ): Promise<Schedule> {
    if (!document) {
      throw new BadRequestException("No file uploaded");
    }
    return this.scheduleService.updateWithDocument(
      id,
      updateScheduleDto,
      document
    );
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  async remove(@Param("id") id: string): Promise<void> {
    return this.scheduleService.remove(id);
  }
}
