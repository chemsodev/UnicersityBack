import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Request,
  ForbiddenException,
} from "@nestjs/common";
import { AdminHierarchyService } from "./admin-hierarchy.service";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import { AdminRole } from "../../user.entity";

@Controller("admin-hierarchy")
export class AdminHierarchyController {
  constructor(private readonly adminHierarchyService: AdminHierarchyService) {}

  @Get("structure")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    AdminRole.DOYEN,
    AdminRole.VICE_DOYEN,
    AdminRole.CHEF_DE_DEPARTEMENT,
    AdminRole.CHEF_DE_SPECIALITE,
    AdminRole.SECRETAIRE
  )
  async getHierarchyStructure() {
    return this.adminHierarchyService.getHierarchyStructure();
  }

  @Get("manageable-roles")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.DOYEN, AdminRole.VICE_DOYEN, AdminRole.CHEF_DE_DEPARTEMENT)
  async getManageableRoles(@Request() req) {
    return this.adminHierarchyService.getManageableRoles(req.user.adminRole);
  }
  @Get("dashboard-data")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    AdminRole.DOYEN,
    AdminRole.VICE_DOYEN,
    AdminRole.CHEF_DE_DEPARTEMENT,
    AdminRole.CHEF_DE_SPECIALITE,
    AdminRole.SECRETAIRE
  )
  async getDashboardData(@Request() req) {
    return this.adminHierarchyService.getDashboardDataForRole(
      req.user.adminRole
    );
  }

  @Get("role-permissions/:role")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.DOYEN, AdminRole.VICE_DOYEN)
  async getRolePermissions(@Param("role") role: AdminRole, @Request() req) {
    // Check if user can access this role's permissions
    if (!this.adminHierarchyService.canAccessRole(req.user.adminRole, role)) {
      throw new ForbiddenException(
        `Vous n'avez pas l'autorité pour consulter les permissions du rôle ${role}`
      );
    }
    return this.adminHierarchyService.getRolePermissions(role);
  }
  @Post("delegate-task")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    AdminRole.DOYEN,
    AdminRole.VICE_DOYEN,
    AdminRole.CHEF_DE_DEPARTEMENT,
    AdminRole.CHEF_DE_SPECIALITE
  )
  async delegateTask(
    @Body("targetAdminId") targetAdminId: string,
    @Body("taskType") taskType: string,
    @Body("taskDetails") taskDetails: any,
    @Request() req
  ) {
    return this.adminHierarchyService.delegateTask(
      req.user.userId,
      targetAdminId,
      taskType,
      taskDetails
    );
  }
}
