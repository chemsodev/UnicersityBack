// auth.service.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { Etudiant } from "../etudiant/etudiant.entity";
import { Enseignant } from "../enseignant/enseignant.entity";
import { Administrateur } from "../administrateur/administrateur.entity";
import { LoginDto } from "./dto/login.dto";
import { AdminRole } from "../user.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Etudiant)
    private readonly etudiantRepo: Repository<Etudiant>,
    @InjectRepository(Enseignant)
    private readonly enseignantRepo: Repository<Enseignant>,
    @InjectRepository(Administrateur)
    private readonly adminRepo: Repository<Administrateur>,
    private readonly jwtService: JwtService
  ) {}

  private async validateUser(
    repo: Repository<any>,
    dto: LoginDto,
    isAdmin: boolean = false
  ) {
    const selectFields = ["id", "email", "password"];
    if (isAdmin) {
      selectFields.push("adminRole");
    }

    const user = await repo.findOne({
      where: { email: dto.email },
      select: selectFields,
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return user;
  }
  // For Student Login
  async loginEtudiant(dto: LoginDto) {
    if (!dto.email && !dto.matricule) {
      throw new UnauthorizedException("Email or matricule required");
    }
    let user: Etudiant;

    if (dto.matricule) {
      user = await this.etudiantRepo.findOne({
        where: { matricule: dto.matricule },
        select: ["id", "email", "matricule", "password"],
      });
    } else {
      user = await this.etudiantRepo.findOne({
        where: { email: dto.email },
        select: ["id", "email", "matricule", "password"],
      });
    }

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return {
      access_token: this.jwtService.sign({
        userId: user.id,
        email: user.email,
        matricule: user.matricule,
        adminRole: AdminRole.ETUDIANT,
        userType: "etudiant",
      }),
      user: {
        id: user.id,
        email: user.email,
        matricule: user.matricule,
      },
    };
  }

  // For Teacher Login
  async loginEnseignant(dto: LoginDto) {
    if (!dto.email) {
      throw new UnauthorizedException("Email required");
    }
    let teacher: Enseignant;

    teacher = await this.enseignantRepo.findOne({
      where: { email: dto.email },
      select: ["id", "email", "password"],
    });

    if (!teacher || !(await bcrypt.compare(dto.password, teacher.password))) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Create a token with explicit role information
    const tokenPayload = {
      userId: teacher.id,
      email: teacher.email,
      role: AdminRole.ENSEIGNANT, // Set explicit role
      userType: "enseignant",
    };

    return {
      access_token: this.jwtService.sign(tokenPayload),
      user: {
        id: teacher.id,
        email: teacher.email,
        role: AdminRole.ENSEIGNANT,
        userType: "enseignant",
      },
    };
  }

  async loginAdministrateur(dto: LoginDto, requestedRole?: string) {
    const admin = await this.validateUser(this.adminRepo, dto, true);

    if (!admin.adminRole) {
      throw new UnauthorizedException("Admin role not assigned");
    }

    // Handle role-based hierarchy - determine if user's role can access the requested role
    if (requestedRole && admin.adminRole !== requestedRole) {
      // Hierarchy check - DOYEN can access any role
      if (admin.adminRole === AdminRole.DOYEN) {
        console.log(`Doyen accessing ${requestedRole} role`);
      }
      // VICE_DOYEN can access all except DOYEN
      else if (
        admin.adminRole === AdminRole.VICE_DOYEN &&
        requestedRole !== AdminRole.DOYEN
      ) {
        console.log(`Vice-Doyen accessing ${requestedRole} role`);
      }
      // CHEF_DE_DEPARTEMENT can access CHEF_DE_SPECIALITE and SECRETAIRE
      else if (
        admin.adminRole === AdminRole.CHEF_DE_DEPARTEMENT &&
        (requestedRole === AdminRole.CHEF_DE_SPECIALITE ||
          requestedRole === AdminRole.SECRETAIRE)
      ) {
        console.log(`Chef de département accessing ${requestedRole} role`);
      } else {
        throw new UnauthorizedException(
          `Vous n'avez pas les permissions pour accéder au rôle ${requestedRole}`
        );
      }
    }

    const tokenPayload = {
      userId: admin.id,
      email: admin.email,
      adminRole: admin.adminRole, // always include
      role: admin.adminRole, // for compatibility
      userType: "administrateur",
      requestedRole: requestedRole || admin.adminRole, // Add the requested role to the token
    };

    return {
      access_token: this.jwtService.sign(tokenPayload),
      adminRole: admin.adminRole,
      email: admin.email,
      userId: admin.id,
      requestedRole: requestedRole || admin.adminRole,
    };
  }
  private generateToken(payload: {
    userId: string;
    email: string;
    role: string | AdminRole; // Role can be string or AdminRole
    userType: string;
  }) {
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Checks if a given role has permission to access or modify a target role
   * based on the administrative hierarchy
   */
  canAccessRole(
    userRole: string | AdminRole,
    targetRole: string | AdminRole
  ): boolean {
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

    // Check if the user's role has higher or equal authority than the target role
    const userRoleValue = roleHierarchy[userRole] || 0;
    const targetRoleValue = roleHierarchy[targetRole] || 0;

    return userRoleValue >= targetRoleValue;
  }
}
