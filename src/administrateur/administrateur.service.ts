import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Administrateur } from "./administrateur.entity";
import { AdminRole, User } from "../user.entity";
import { CreateAdministrateurDto } from "./dto/create-administrateur.dto";
import { UpdateAdministrateurDto } from "./dto/update-administrateur.dto";
import { toNumberOrStringId } from "../utils/id-conversion.util";
import { DashboardStatsDto } from "./dto/dashboard-stats.dto";

@Injectable()
export class AdministrateurService {
  constructor(
    @InjectRepository(Administrateur)
    private readonly administrateurRepository: Repository<Administrateur>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async create(
    createAdministrateurDto: CreateAdministrateurDto
  ): Promise<Administrateur> {
    const admin = this.administrateurRepository.create(createAdministrateurDto);
    return await this.administrateurRepository.save(admin);
  }

  async findAll(): Promise<Administrateur[]> {
    return await this.administrateurRepository.find();
  }

  async findOne(id: string | number): Promise<Administrateur> {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    return this.administrateurRepository.findOne({ where: { id: numericId } });
  }

  async findByEmail(email: string): Promise<Administrateur> {
    const admin = await this.administrateurRepository.findOne({
      where: { email },
    });

    if (!admin) {
      throw new NotFoundException(
        `Administrateur with email ${email} not found`
      );
    }

    return admin;
  }

  async update(
    id: string,
    updateAdministrateurDto: UpdateAdministrateurDto
  ): Promise<Administrateur> {
    const entityId = toNumberOrStringId(id);
    const admin = await this.findOne(id);

    // Update admin properties
    Object.assign(admin, updateAdministrateurDto);

    // Save updated admin
    return await this.administrateurRepository.save({
      ...admin,
      id: entityId as any,
    });
  }

  async remove(id: string): Promise<void> {
    const result = await this.administrateurRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Administrateur with ID ${id} not found`);
    }
  }

  async getAdminsByRole(role: string): Promise<Administrateur[]> {
    return this.administrateurRepository.find({
      where: { adminRole: role as any },
    });
  }

  /**
   * Checks if a given role has permission to access or modify a target role
   * based on the administrative hierarchy
   */
  canAccessRole(userRole: AdminRole, targetRole: AdminRole): boolean {
    const roleHierarchy = {
      [AdminRole.DOYEN]: 5, // Highest authority
      [AdminRole.VICE_DOYEN]: 4,
      [AdminRole.CHEF_DE_DEPARTEMENT]: 3,
      [AdminRole.CHEF_DE_SPECIALITE]: 2,
      [AdminRole.SECRETAIRE]: 1,
      [AdminRole.ENSEIGNANT]: 0,
      [AdminRole.ETUDIANT]: 0,
    };

    // Doyen has access to all roles
    if (userRole === AdminRole.DOYEN) {
      return true;
    }

    // Check if the user's role has higher authority than the target role
    return roleHierarchy[userRole] > roleHierarchy[targetRole];
  }

  /**
   * Gets administrators that the current role is allowed to manage
   * based on the hierarchy
   */
  async getManageableAdmins(userRole: AdminRole): Promise<Administrateur[]> {
    let query = this.administrateurRepository.createQueryBuilder("admin");

    // Filter based on role hierarchy
    if (userRole !== AdminRole.DOYEN) {
      const manageableRoles = this.getManageableRoles(userRole);
      query = query.where("admin.adminRole IN (:...roles)", {
        roles: manageableRoles,
      });
    }

    return query.getMany();
  }

  /**
   * Returns the roles that can be managed by the given role
   */
  getManageableRoles(userRole: AdminRole): AdminRole[] {
    switch (userRole) {
      case AdminRole.DOYEN:
        return [
          AdminRole.VICE_DOYEN,
          AdminRole.CHEF_DE_DEPARTEMENT,
          AdminRole.CHEF_DE_SPECIALITE,
          AdminRole.SECRETAIRE,
        ];
      case AdminRole.VICE_DOYEN:
        return [
          AdminRole.CHEF_DE_DEPARTEMENT,
          AdminRole.CHEF_DE_SPECIALITE,
          AdminRole.SECRETAIRE,
        ];
      case AdminRole.CHEF_DE_DEPARTEMENT:
        return [AdminRole.CHEF_DE_SPECIALITE, AdminRole.SECRETAIRE];
      default:
        return [];
    }
  }

  /**
   * Assigns a role to an administrator, with permission check
   */
  async assignRole(
    assignerId: string,
    adminId: string,
    role: AdminRole
  ): Promise<Administrateur> {
    // Get the assigner's role
    const assigner = await this.findOne(assignerId);

    // Get the admin to be assigned a role
    const admin = await this.findOne(adminId);

    // Check if assigner has permission to assign this role
    if (!this.canAccessRole(assigner.adminRole, role)) {
      throw new ForbiddenException(
        `Vous n'avez pas l'autorité pour assigner le rôle ${role}`
      );
    }

    // Update the admin's role
    admin.adminRole = role;
    return this.administrateurRepository.save(admin);
  }
  /**
   * Gets administrators with roles subordinate to the specified role
   */
  async getSubordinates(adminId?: number): Promise<Administrateur[]> {
    // If no adminId is provided, return empty array
    if (!adminId) {
      return [];
    }

    // Get the admin's role first
    const admin = await this.findOne(adminId);
    if (!admin) {
      return [];
    } // Define role hierarchy
    const roleHierarchy = {
      doyen: [
        "vice-doyen",
        "chef-de-departement",
        "chef-de-specialite",
        "secretaire",
      ],
      "vice-doyen": ["chef-de-departement", "chef-de-specialite", "secretaire"],
      "chef-de-departement": ["chef-de-specialite", "secretaire"],
      "chef-de-specialite": ["secretaire"],
      secretaire: [],
    };

    // Get subordinate roles based on admin's type (assuming type is used instead of role)
    const adminType = admin.adminRole || "";
    const subordinateRoles = roleHierarchy[adminType] || [];
    if (subordinateRoles.length === 0) {
      return [];
    }

    // Get admins with subordinate roles
    return this.administrateurRepository.find({
      where: {
        adminRole: In(subordinateRoles),
      },
    });
  }
  /**
   * Retrieves dashboard statistics for an admin user
   */
  async getDashboardStats(adminId?: number): Promise<DashboardStatsDto> {
    // Get counts from database
    const teachersCount = await this.userRepository.count({
      where: { adminRole: AdminRole.ENSEIGNANT },
    });

    const studentsCount = await this.userRepository.count({
      where: { adminRole: AdminRole.ETUDIANT },
    });

    // Get sections count from the Section repository
    let sectionsCount = 0;
    try {
      const sectionRepo = this.userRepository.manager.getRepository("Section");
      sectionsCount = await sectionRepo.count();
    } catch (error) {
      console.error("Error counting sections:", error);
    }

    // Get pending requests count from the ChangeRequest repository
    let pendingRequestsCount = 0;
    try {
      const requestRepo =
        this.userRepository.manager.getRepository("change_requests");
      pendingRequestsCount = await requestRepo.count({
        where: { status: "pending" },
      });
    } catch (error) {
      console.error("Error counting pending requests:", error);
    }

    return {
      teachersCount,
      studentsCount,
      sectionsCount,
      pendingRequestsCount,
    };
  }
}
