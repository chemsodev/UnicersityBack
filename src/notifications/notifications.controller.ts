import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Patch,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { Notification } from "./notification.entity";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../roles/roles.guard";
import { Roles } from "../roles/roles.decorator";
import { AdminRole } from "../user.entity";

@Controller("notifications")
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  async create(
    @Body() createNotificationDto: CreateNotificationDto
  ): Promise<Notification> {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  async findAll(@Request() req): Promise<Notification[]> {
    return this.notificationsService.findAll(req.user.userId);
  }

  @Get("unread-count")
  async getUnreadCount(@Request() req): Promise<{ count: number }> {
    const count = await this.notificationsService.findUnreadCount(
      req.user.userId
    );
    return { count };
  }

  @Get("from-teacher/:teacherId")
  async findFromTeacher(
    @Param("teacherId") teacherId: string
  ): Promise<Notification[]> {
    return this.notificationsService.findByTeacherId(teacherId);
  }

  @Get(":id")
  async findOne(@Param("id") id: string): Promise<Notification> {
    return this.notificationsService.findOne(id);
  }

  @Patch(":id/mark-read")
  async markAsRead(@Param("id") id: string): Promise<Notification> {
    return this.notificationsService.markAsRead(id);
  }

  @Patch("mark-all-read")
  async markAllAsRead(@Request() req): Promise<void> {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Delete(":id")
  async remove(@Param("id") id: string): Promise<void> {
    return this.notificationsService.remove(id);
  }

  @Delete("read/all")
  async removeAllRead(@Request() req): Promise<void> {
    return this.notificationsService.removeAllRead(req.user.userId);
  }

  @Get("admin/notifications")
  @UseGuards(RolesGuard)
  @Roles(
    AdminRole.DOYEN,
    AdminRole.VICE_DOYEN,
    AdminRole.CHEF_DE_DEPARTEMENT,
    AdminRole.CHEF_DE_SPECIALITE,
    AdminRole.SECRETAIRE
  )
  async getAdminNotifications(@Request() req): Promise<Notification[]> {
    // Get admin-related notifications based on the admin's role
    return this.notificationsService.findAdminNotifications(
      req.user.adminRole,
      req.user.userId
    );
  }
}
