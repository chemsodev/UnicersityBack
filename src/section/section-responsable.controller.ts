import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from "@nestjs/common";
import { SectionResponsableService } from "./section-responsable.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../roles/roles.guard";
import { Roles } from "../roles/roles.decorator";
import { AdminRole } from "../user.entity";
import { ResponsableRole } from "./section-responsable.entity";
import { AssignResponsableDto } from "./dto/assign-responsable.dto";

@Controller("sections")
@UseGuards(JwtAuthGuard)
export class SectionResponsableController {
  constructor(
    private readonly sectionResponsableService: SectionResponsableService
  ) {}

  @Post(":sectionId/responsables")
  @UseGuards(RolesGuard)
  @Roles(
    AdminRole.CHEF_DE_DEPARTEMENT,
    AdminRole.VICE_DOYEN,
    AdminRole.DOYEN,
    AdminRole.SECRETAIRE
  )
  async assignResponsable(
    @Param("sectionId") sectionId: string,
    @Body() assignDto: AssignResponsableDto
  ) {
    console.log(`Controller received assignment request:`, assignDto);
    return this.sectionResponsableService.assignResponsable(
      sectionId,
      assignDto.enseignantId,
      assignDto.role,
      assignDto.groupId
    );
  }

  @Post(":sectionId/responsables/bulk")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.CHEF_DE_DEPARTEMENT, AdminRole.VICE_DOYEN, AdminRole.DOYEN)
  async assignResponsables(
    @Param("sectionId") sectionId: string,
    @Body() assignments: AssignResponsableDto[]
  ) {
    const results = [];
    for (const assignment of assignments) {
      const result = await this.sectionResponsableService.assignResponsable(
        sectionId,
        assignment.enseignantId,
        assignment.role
      );
      results.push(result);
    }
    return results;
  }

  @Delete(":sectionId/responsables/:responsableId")
  @UseGuards(RolesGuard)
  @Roles(AdminRole.CHEF_DE_DEPARTEMENT, AdminRole.VICE_DOYEN, AdminRole.DOYEN)
  async removeResponsableById(
    @Param("sectionId") sectionId: string,
    @Param("responsableId") responsableId: string
  ) {
    await this.sectionResponsableService.removeResponsableById(
      sectionId,
      responsableId
    );
    return { success: true, message: "Responsable removed successfully" };
  }

  @Get(":sectionId/responsables")
  async getResponsablesForSection(@Param("sectionId") sectionId: string) {
    const responsables =
      await this.sectionResponsableService.getResponsablesForSection(sectionId);
    return responsables;
  }
}
