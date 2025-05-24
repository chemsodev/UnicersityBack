import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  Put,
} from "@nestjs/common";
import { Administrateur } from "./administrateur.entity";
import { CreateAdministrateurDto } from "./dto/create-administrateur.dto";
import { UpdateAdministrateurDto } from "./dto/update-administrateur.dto";
import { AdministrateurService } from "./administrateur.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../roles/roles.guard";
import { Roles } from "../roles/roles.decorator";
import { AdminRole } from "../user.entity";
import { HierarchyAccessDto } from "./dto/hierarchy-access.dto";
import { DashboardStatsDto } from "./dto/dashboard-stats.dto";

@Controller("administrateurs")
export class AdministrateurController {
  constructor(private readonly administrateurService: AdministrateurService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.DOYEN, AdminRole.VICE_DOYEN)
  async create(
    @Body() createAdministrateurDto: CreateAdministrateurDto,
    @Request() req
  ): Promise<Administrateur> {
    // Only DOYEN can create VICE_DOYEN administrators
    if (
      createAdministrateurDto.adminRole === AdminRole.VICE_DOYEN &&
      req.user.adminRole !== AdminRole.DOYEN
    ) {
      throw new ForbiddenException(
        "Seul le Doyen peut créer des comptes Vice-Doyen"
      );
    }

    // Check if the current admin has permission to create this role
    if (
      !this.administrateurService.canAccessRole(
        req.user.adminRole,
        createAdministrateurDto.adminRole
      )
    ) {
      throw new ForbiddenException(
        `Vous n'avez pas l'autorité pour créer un ${createAdministrateurDto.adminRole}`
      );
    }

    return this.administrateurService.create(createAdministrateurDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.DOYEN, AdminRole.VICE_DOYEN, AdminRole.CHEF_DE_DEPARTEMENT)
  async findAll(@Request() req): Promise<Administrateur[]> {
    // Filter administrators based on the user's role in the hierarchy
    return this.administrateurService.getManageableAdmins(req.user.adminRole);
  }

  @Get("hierarchy/subordinates")
  @UseGuards(JwtAuthGuard)
  getSubordinates(@Request() req) {
    // Extract user ID from JWT token
    const userId = req.user?.userId;
    return this.administrateurService.getSubordinates(userId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.administrateurService.findOne(id);
  }

  @Get("by-email/:email")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.DOYEN, AdminRole.VICE_DOYEN)
  async findByEmail(@Param("email") email: string): Promise<Administrateur> {
    return this.administrateurService.findByEmail(email);
  }

  @Get("by-role/:role")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.DOYEN, AdminRole.VICE_DOYEN, AdminRole.CHEF_DE_DEPARTEMENT)
  async findByRole(
    @Param("role") role: string,
    @Request() req
  ): Promise<Administrateur[]> {
    // Check if the user has permission to view this role
    if (
      !this.administrateurService.canAccessRole(
        req.user.adminRole,
        role as AdminRole
      )
    ) {
      throw new ForbiddenException(
        `Vous n'avez pas l'autorité pour accéder aux administrateurs de type ${role}`
      );
    }

    return this.administrateurService.getAdminsByRole(role);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.DOYEN, AdminRole.VICE_DOYEN)
  async update(
    @Param("id") id: string,
    @Body() updateAdministrateurDto: UpdateAdministrateurDto,
    @Request() req
  ): Promise<Administrateur> {
    const admin = await this.administrateurService.findOne(id);

    // Check if the user has permission to edit this admin
    if (
      !this.administrateurService.canAccessRole(
        req.user.adminRole,
        admin.adminRole
      )
    ) {
      throw new ForbiddenException(
        `Vous n'avez pas l'autorité pour modifier ce profil administratif`
      );
    }

    // If trying to change role, check permissions
    if (
      updateAdministrateurDto.adminRole &&
      updateAdministrateurDto.adminRole !== admin.adminRole
    ) {
      if (
        !this.administrateurService.canAccessRole(
          req.user.adminRole,
          updateAdministrateurDto.adminRole
        )
      ) {
        throw new ForbiddenException(
          `Vous n'avez pas l'autorité pour promouvoir au rôle ${updateAdministrateurDto.adminRole}`
        );
      }
    }

    return this.administrateurService.update(id, updateAdministrateurDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.DOYEN, AdminRole.VICE_DOYEN)
  async remove(@Param("id") id: string, @Request() req): Promise<void> {
    const admin = await this.administrateurService.findOne(id);

    // Check if the user has permission to delete this admin
    if (
      !this.administrateurService.canAccessRole(
        req.user.adminRole,
        admin.adminRole
      )
    ) {
      throw new ForbiddenException(
        `Vous n'avez pas l'autorité pour supprimer ce profil administratif`
      );
    }

    return this.administrateurService.remove(id);
  }

  @Post("assign-role")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.DOYEN, AdminRole.VICE_DOYEN, AdminRole.CHEF_DE_DEPARTEMENT)
  async assignRole(
    @Body("adminId") adminId: string,
    @Body("role") role: AdminRole,
    @Request() req
  ): Promise<Administrateur> {
    return this.administrateurService.assignRole(
      req.user.userId,
      adminId,
      role
    );
  }
  @Get("subordinates")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.DOYEN, AdminRole.VICE_DOYEN, AdminRole.CHEF_DE_DEPARTEMENT)
  async getDirectSubordinates(@Request() req): Promise<Administrateur[]> {
    return this.administrateurService.getSubordinates(req.user.userId);
  }

  @Post("hierarchy-access")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    AdminRole.DOYEN,
    AdminRole.VICE_DOYEN,
    AdminRole.CHEF_DE_DEPARTEMENT,
    AdminRole.CHEF_DE_SPECIALITE
  )
  async checkHierarchyAccess(
    @Body() dto: HierarchyAccessDto,
    @Request() req
  ): Promise<{ allowed: boolean }> {
    const allowed = this.administrateurService.canAccessRole(
      req.user.adminRole,
      dto.targetRole
    );
    return { allowed };
  }

  @Get("dashboard/stats")
  @UseGuards(JwtAuthGuard)
  async getDashboardStats(@Request() req): Promise<DashboardStatsDto> {
    // Extract user ID from JWT token
    const userId = req.user?.userId;
    return this.administrateurService.getDashboardStats(userId);
  }
}
