import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Administrateur } from "../../administrateur/administrateur.entity";
import { AdminRole } from "../../user.entity";
import { AdministrateurService } from "../../administrateur/administrateur.service";

@Injectable()
export class AdminHierarchyService {
  constructor(
    @InjectRepository(Administrateur)
    private readonly adminRepository: Repository<Administrateur>,
    private readonly administrateurService: AdministrateurService
  ) {}

  /**
   * Returns the complete hierarchy structure with role descriptions
   */
  getHierarchyStructure() {
    return {
      hierarchy: [
        {
          role: AdminRole.DOYEN,
          title: "Doyen",
          description:
            "Supervision générale et pilotage stratégique de la faculté",
          level: 5,
          canManage: [
            AdminRole.VICE_DOYEN,
            AdminRole.CHEF_DE_DEPARTEMENT,
            AdminRole.CHEF_DE_SPECIALITE,
            AdminRole.SECRETAIRE,
          ],
        },
        {
          role: AdminRole.VICE_DOYEN,
          title: "Vice-Doyen",
          description: "Gestion des administrateurs",
          level: 4,
          canManage: [
            AdminRole.CHEF_DE_DEPARTEMENT,
            AdminRole.CHEF_DE_SPECIALITE,
            AdminRole.SECRETAIRE,
          ],
        },
        {
          role: AdminRole.CHEF_DE_DEPARTEMENT,
          title: "Chef de Département",
          description: "Gestion des spécialités et des enseignants",
          level: 3,
          canManage: [AdminRole.CHEF_DE_SPECIALITE, AdminRole.SECRETAIRE],
        },
        {
          role: AdminRole.CHEF_DE_SPECIALITE,
          title: "Chef de Spécialité",
          description: "Gestion des étudiants et des sections",
          level: 2,
          canManage: [],
        },
        {
          role: AdminRole.SECRETAIRE,
          title: "Secrétaire",
          description:
            "Gestion des emplois du temps et des demandes de changement de profil",
          level: 1,
          canManage: [],
        },
      ],
    };
  }

  /**
   * Checks if a given role has permission to access or modify a target role
   */
  canAccessRole(userRole: AdminRole, targetRole: AdminRole): boolean {
    return this.administrateurService.canAccessRole(userRole, targetRole);
  }

  /**
   * Returns the roles that can be managed by the given role
   */
  getManageableRoles(userRole: AdminRole): { roles: AdminRole[] } {
    return {
      roles: this.administrateurService.getManageableRoles(userRole),
    };
  }

  /**
   * Gets dashboard data relevant to a specific admin role
   */
  async getDashboardDataForRole(role: AdminRole) {
    // Basic structure shared by all roles
    const baseData = {
      roleInfo: this.getHierarchyStructure().hierarchy.find(
        (r) => r.role === role
      ),
      adminCount: await this.adminRepository.count({
        where: { adminRole: role },
      }),
    };

    // Add role-specific data
    switch (role) {
      case AdminRole.DOYEN:
        return {
          ...baseData,
          facultyStats: {
            departments: 5, // These would come from actual database calls
            specialties: 12,
            teachers: 120,
            students: 3500,
          },
          // Additional data specific to Doyen
        };

      case AdminRole.VICE_DOYEN:
        return {
          ...baseData,
          adminStats: {
            departmentHeads: await this.adminRepository.count({
              where: { adminRole: AdminRole.CHEF_DE_DEPARTEMENT },
            }),
            specialtyHeads: await this.adminRepository.count({
              where: { adminRole: AdminRole.CHEF_DE_SPECIALITE },
            }),
            secretaries: await this.adminRepository.count({
              where: { adminRole: AdminRole.SECRETAIRE },
            }),
          },
          // Additional data specific to Vice-Doyen
        };

      case AdminRole.CHEF_DE_DEPARTEMENT:
        return {
          ...baseData,
          departmentStats: {
            specialtyHeads: await this.adminRepository.count({
              where: { adminRole: AdminRole.CHEF_DE_SPECIALITE },
            }),
            teachers: 45, // This would be a real query to count teachers in the department
            specialties: 4, // This would be a real query for specialties in the department
          },
          // Additional data specific to Chef de Département
        };

      case AdminRole.CHEF_DE_SPECIALITE:
        return {
          ...baseData,
          specialtyStats: {
            students: 250, // This would be a real query for students in the specialty
            sections: 6, // This would be a real query for sections in the specialty
            subjects: 15, // This would be a real query for subjects in the specialty
          },
          // Additional data specific to Chef de Spécialité
        };

      case AdminRole.SECRETAIRE:
        return {
          ...baseData,
          secretaryStats: {
            pendingProfileChanges: 12, // These would come from actual database queries
            schedulesToManage: 18,
            pendingRequests: 7,
          },
          // Additional data specific to Secrétaire
        };

      default:
        return baseData;
    }
  }

  /**
   * Gets permissions for a specific role
   */
  getRolePermissions(role: AdminRole) {
    const basePermissions = {
      canViewOwnProfile: true,
      canEditOwnProfile: true,
      canViewNotifications: true,
      canSendNotifications: false,
    };

    switch (role) {
      case AdminRole.DOYEN:
        return {
          ...basePermissions,
          canSendNotifications: true,
          canCreateUsers: true,
          canDeleteUsers: true,
          canAssignRoles: true,
          canAccessAllModules: true,
          canApproveRequests: true,
          canManageFinances: true,
          canGenerateReports: true,
        };

      case AdminRole.VICE_DOYEN:
        return {
          ...basePermissions,
          canSendNotifications: true,
          canCreateUsers: true,
          canDeleteUsers: true,
          canAssignRoles: true,
          canApproveRequests: true,
          canGenerateReports: true,
        };

      case AdminRole.CHEF_DE_DEPARTEMENT:
        return {
          ...basePermissions,
          canSendNotifications: true,
          canCreateTeachers: true,
          canAssignSpecialtyHeads: true,
          canManageSpecialties: true,
          canGenerateReports: true,
        };

      case AdminRole.CHEF_DE_SPECIALITE:
        return {
          ...basePermissions,
          canSendNotifications: true,
          canManageSections: true,
          canManageStudents: true,
          canViewMarks: true,
          canGenerateClassReports: true,
        };

      case AdminRole.SECRETAIRE:
        return {
          ...basePermissions,
          canManageSchedules: true,
          canProcessProfileChangeRequests: true,
          canGenerateAttendanceReports: true,
          canManageRoomAllocation: true,
        };

      default:
        return basePermissions;
    }
  }

  /**
   * Delegates a task to a subordinate administrator
   */
  async delegateTask(
    senderId: string,
    targetAdminId: string,
    taskType: string,
    taskDetails: any
  ) {
    // Get sender and target admin details
    const sender = await this.administrateurService.findOne(senderId);
    const targetAdmin = await this.administrateurService.findOne(targetAdminId);

    // Check if sender has authority over target
    if (!this.canAccessRole(sender.adminRole, targetAdmin.adminRole)) {
      throw new ForbiddenException(
        `Vous n'avez pas l'autorité pour déléguer des tâches à ${targetAdmin.firstName} ${targetAdmin.lastName}`
      );
    }

    // Check if task type is valid for the target role
    this.validateTaskTypeForRole(taskType, targetAdmin.adminRole);

    // In a real implementation, we would save this task to a tasks collection
    // For now, we'll just return a success message
    return {
      success: true,
      message: `Tâche ${taskType} déléguée avec succès à ${targetAdmin.firstName} ${targetAdmin.lastName}`,
      task: {
        sender: `${sender.firstName} ${sender.lastName}`,
        target: `${targetAdmin.firstName} ${targetAdmin.lastName}`,
        type: taskType,
        details: taskDetails,
        delegatedAt: new Date(),
      },
    };
  }

  /**
   * Validates if a task type is appropriate for a given role
   */
  private validateTaskTypeForRole(taskType: string, role: AdminRole) {
    const validTasksPerRole = {
      [AdminRole.VICE_DOYEN]: [
        "create_admin",
        "manage_admin",
        "generate_report",
      ],
      [AdminRole.CHEF_DE_DEPARTEMENT]: [
        "manage_specialty",
        "assign_teachers",
        "review_curriculum",
      ],
      [AdminRole.CHEF_DE_SPECIALITE]: [
        "manage_section",
        "student_issue",
        "grade_review",
      ],
      [AdminRole.SECRETAIRE]: [
        "schedule_update",
        "process_request",
        "document_management",
      ],
    };

    // If no specific validation for this role or task type is valid for this role
    if (
      !validTasksPerRole[role] ||
      validTasksPerRole[role].includes(taskType)
    ) {
      return true;
    }

    throw new ForbiddenException(
      `Le type de tâche ${taskType} n'est pas valide pour le rôle ${role}`
    );
  }
}
