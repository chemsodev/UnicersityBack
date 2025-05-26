// src/section/section.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { SectionService } from "./section.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../roles/roles.guard";
import { Roles } from "../roles/roles.decorator";
import { AdminRole } from "../user.entity";
import { CreateSectionDto } from "./dto/create-section.dto";
import { UpdateSectionDto } from "./dto/update-section.dto";

@Controller("sections")
@UseGuards(JwtAuthGuard)
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  create(@Body() createSectionDto: CreateSectionDto, @Request() req) {
    return this.sectionService.create(createSectionDto, req.user.id);
  }
  @Get()
  findAll(
    @Query("departmentId") departmentId?: string,
    @Query("level") level?: string,
    @Query("specialty") specialty?: string
  ) {
    return this.sectionService.findAll(
      departmentId ? +departmentId : undefined,
      level,
      specialty
    );
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.sectionService.findOne(id);
  }

  @Get(":id/etudiants")
  findStudents(@Param("id") id: string) {
    return this.sectionService.findStudents(id);
  }
  @Get(":id/groupes")
  async findGroups(@Param("id") id: string, @Query("type") type?: string) {
    console.log(
      `[Section Controller] Finding groups for section ID: ${id}, type: ${type}`
    );
    try {
      const groups = await this.sectionService.findGroups(id, type);
      console.log(
        `[Section Controller] Found ${groups.length} groups for section ${id}`
      );
      return groups;
    } catch (error) {
      console.error(
        `[Section Controller] Error finding groups for section ${id}:`,
        error
      );
      throw error;
    }
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  update(
    @Param("id") id: string,
    @Body() updateSectionDto: UpdateSectionDto,
    @Request() req
  ) {
    return this.sectionService.update(id, updateSectionDto, req.user.id);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  remove(@Param("id") id: string) {
    return this.sectionService.remove(id);
  }

  @Post(":sectionId/students/:studentId")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  async assignStudentToSection(
    @Param("sectionId") sectionId: string,
    @Param("studentId") studentId: string
  ) {
    return this.sectionService.assignStudentToSection(sectionId, studentId);
  }
}
