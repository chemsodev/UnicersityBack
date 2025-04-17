import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/roles/roles.decorator'; // Import ROLES_KEY
import { AdminRole } from 'src/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<AdminRole[]>(ROLES_KEY, context.getHandler());
        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.role) {
            return false; 
        }

        return requiredRoles.includes(user.role);
    }
}
