import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import { AuthGuard } from "../../auth/auth.guard";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import { AdminRole } from "../../user.entity";
import { NotificationsService } from "../../notifications/notifications.service";
import { Notification } from "../../notifications/notification.entity";

@Controller("admin/notifications")
@UseGuards(AuthGuard, RolesGuard)
@Roles(
  AdminRole.DOYEN,
  AdminRole.VICE_DOYEN,
  AdminRole.CHEF_DE_DEPARTEMENT,
  AdminRole.CHEF_DE_SPECIALITE,
  AdminRole.SECRETAIRE
)
export class AdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getAdminNotifications(@Request() req): Promise<Notification[]> {
    // Get admin-related notifications based on the admin's role
    return this.notificationsService.findAdminNotifications(
      req.user.adminRole,
      req.user.userId
    );
  }
}
