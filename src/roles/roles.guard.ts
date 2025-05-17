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

    // Accept both adminRole and role fields for backward compatibility
    const userRole = user.adminRole || user.role;

    if (!userRole && !user.userType) {
      this.logger.warn(`User has no role information: ${JSON.stringify(user)}`);
      throw new ForbiddenException("Role information missing in token");
    }

    // Log the role comparison
    this.logger.log(
      `Comparing user role ${
        userRole || user.userType
      } with required roles: ${requiredRoles.join(", ")}`
    );

    // Special handling for student role which might come in different formats
    if (requiredRoles.includes(AdminRole.ETUDIANT)) {
      const isStudent =
        userRole === AdminRole.ETUDIANT ||
        userRole === "etudiant" ||
        user.userType === "etudiant";

      if (isStudent) {
        return true;
      }
    }

    // For other roles
    return requiredRoles.some(
      (role) => role === userRole || user.userType === role.toLowerCase()
    );
  }
}
