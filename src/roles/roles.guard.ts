import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AdminRole } from "src/user.entity";
import { ROLES_KEY } from "./roles.decorator";
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<AdminRole[]>(ROLES_KEY, context.getHandler());
        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (user.userType === 'etudiant') {
            return true;
        }
        if (user.userType === 'administrateur') {
            return requiredRoles.includes(user.role as AdminRole);
        }

        return false;
    }
}