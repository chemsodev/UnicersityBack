import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AdminRole } from "src/user.entity";
import { ROLES_KEY } from "./roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<AdminRole[]>(
      ROLES_KEY,
      context.getHandler()
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Debug log to check what's in the user object
    this.logger.log(`User in token: ${JSON.stringify(user)}`);

    if (!user) {
      this.logger.warn("No user object in request");
      throw new ForbiddenException("Authentication required");
    }

    // Get user role from any available source in token
    const userRole = user.adminRole || user.role;
    const userType = user.userType?.toLowerCase();
    // Get requested role if an admin is accessing another role's functionality
    const requestedRole = user.requestedRole;

    if (!userRole && !userType) {
      this.logger.warn(`User has no role information: ${JSON.stringify(user)}`);

      // For endpoints marked with ENSEIGNANT role, check if the request comes from teacher-related paths
      if (
        requiredRoles.includes(AdminRole.ENSEIGNANT) &&
        (request.path.includes("/enseignants/") ||
          request.path.includes("/api/enseignants/"))
      ) {
        this.logger.log("Allowing access to teacher endpoint based on path");
        return true;
      }

      // For endpoints marked with ETUDIANT role, check if the request comes from student-related paths
      if (
        requiredRoles.includes(AdminRole.ETUDIANT) &&
        (request.path.includes("/etudiants/") ||
          request.path.includes("/api/etudiants/"))
      ) {
        this.logger.log("Allowing access to student endpoint based on path");
        return true;
      }

      throw new ForbiddenException("Role information missing in token");
    }

    // Log the role comparison
    this.logger.log(
      `Comparing user role ${
        userRole || userType
      } with required roles: ${requiredRoles.join(", ")}`
    );

    // Check for administrative hierarchy access:
    // 1. If the user is a DOYEN, they can access any role
    if (userRole === AdminRole.DOYEN) {
      this.logger.log("DOYEN access granted - full access to all roles");
      return true;
    }

    // 2. If the user is using a requestedRole, verify against that
    if (requestedRole && requiredRoles.includes(requestedRole)) {
      this.logger.log(`Access granted via requested role: ${requestedRole}`);
      return true;
    }

    // Handle ENSEIGNANT role specifically (for teacher pages)
    if (requiredRoles.includes(AdminRole.ENSEIGNANT)) {
      const isTeacher =
        userRole === AdminRole.ENSEIGNANT ||
        userRole === "enseignant" ||
        userType === "enseignant";

      if (isTeacher) {
        return true;
      }
    }

    // Handle ETUDIANT role specifically (for student pages)
    if (requiredRoles.includes(AdminRole.ETUDIANT)) {
      const isStudent =
        userRole === AdminRole.ETUDIANT ||
        userRole === "etudiant" ||
        userType === "etudiant";

      if (isStudent) {
        // For student endpoints, ensure user.userId is in the expected format
        // Log more details about the student access
        this.logger.log(
          `Student access granted. UserId: ${user.userId}, Path: ${request.path}`
        );

        // If this is a specific student profile request, check if IDs match
        if (
          request.path.match(/\/etudiants\/\d+/) ||
          request.path.match(/\/api\/etudiants\/\d+/)
        ) {
          const requestedId =
            request.params.id || request.path.split("/").pop();
          this.logger.log(
            `Student accessing profile: ${requestedId}, Student's own ID: ${user.userId}`
          );

          // We'll let the controller handle the actual permission check
          // This is just for logging purposes
        }

        return true;
      }
    }

    // For other admin roles, check both formats
    const hasRequiredRole = requiredRoles.some((role) => {
      // Check against role directly
      if (userRole === role) return true;

      // Check against userType (lowercase comparison)
      if (userType === role.toString().toLowerCase()) return true;

      return false;
    });

    return hasRequiredRole;
  }
}
