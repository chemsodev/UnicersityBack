// src/groupe/groupe.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from "@nestjs/common";
import { GroupeService } from "./groupe.service";
import { AuthGuard } from "../auth/auth.guard";
import { AdminRole } from "../user.entity";
import { RolesGuard } from "src/roles/roles.guard";
import { Roles } from "src/roles/roles.decorator";
import { GroupeType, Groupe } from "./groupe.entity";
import { CreateGroupeDto } from "./dto/create-groupe.dto";
import { UpdateGroupeDto } from "./dto/update-groupe.dto";

@Controller("groupes")
@UseGuards(AuthGuard)
export class GroupeController {
  constructor(private readonly groupeService: GroupeService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  create(@Body() createGroupeDto: CreateGroupeDto) {
    return this.groupeService.create(createGroupeDto);
  }

  @Get()
  findAll() {
    return this.groupeService.findAll();
  }

  @Get("td")
  findTdGroups() {
    console.log("Finding TD groups");
    return this.groupeService.findByType(GroupeType.TD);
  }

  @Get("tp")
  findTpGroups() {
    console.log("Finding TP groups");
    return this.groupeService.findByType(GroupeType.TP);
  }

  @Get("available")
  async getAvailableGroups(
    @Query("type") type: "td" | "tp",
    @Query("sectionId") sectionId?: string
  ): Promise<Groupe[]> {
    console.log(
      `Finding available groups, type: ${type}, sectionId: ${sectionId}`
    );
    return this.groupeService.findAvailableGroups(type, sectionId);
  }

  @Get("section/:sectionId")
  findBySection(@Param("sectionId") sectionId: string) {
    return this.groupeService.findBySection(sectionId);
  }

  @Get("type/:type")
  findByType(@Param("type") type: GroupeType) {
    return this.groupeService.findByType(type);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.groupeService.findOne(id);
  }

  @Get(":groupId/availability")
  async checkGroupAvailability(@Param("groupId") groupId: string) {
    return this.groupeService.checkGroupAvailability(groupId);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  update(@Param("id") id: string, @Body() updateGroupeDto: UpdateGroupeDto) {
    return this.groupeService.update(id, updateGroupeDto);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  remove(@Param("id") id: string) {
    return this.groupeService.remove(id);
  }

  @Post(":groupId/students/:studentId")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  async assignStudentToGroup(
    @Param("groupId") groupId: string,
    @Param("studentId") studentId: string
  ): Promise<Groupe> {
    return this.groupeService.assignStudentToGroup(studentId, groupId);
  }

  @Delete(":groupId/students/:studentId")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SECRETAIRE, AdminRole.CHEF_DE_DEPARTEMENT)
  async removeStudentFromGroup(
    @Param("groupId") groupId: string,
    @Param("studentId") studentId: string
  ): Promise<Groupe> {
    return this.groupeService.removeStudentFromGroup(studentId, groupId);
  }
}
