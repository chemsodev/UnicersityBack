import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Patch } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notification } from './notification.entity';
import { AuthGuard } from '../auth/auth.guard';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Post()
    async create(@Body() createNotificationDto: CreateNotificationDto): Promise<Notification> {
        return this.notificationsService.create(createNotificationDto);
    }

    @Get()
    async findAll(@Request() req): Promise<Notification[]> {
        return this.notificationsService.findAll(req.user.userId);
    }

    @Get('unread-count')
    async getUnreadCount(@Request() req): Promise<{ count: number }> {
        const count = await this.notificationsService.findUnreadCount(req.user.userId);
        return { count };
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Notification> {
        return this.notificationsService.findOne(id);
    }

    @Patch(':id/mark-read')
    async markAsRead(@Param('id') id: string): Promise<Notification> {
        return this.notificationsService.markAsRead(id);
    }

    @Patch('mark-all-read')
    async markAllAsRead(@Request() req): Promise<void> {
        return this.notificationsService.markAllAsRead(req.user.userId);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return this.notificationsService.remove(id);
    }

    @Delete('read/all')
    async removeAllRead(@Request() req): Promise<void> {
        return this.notificationsService.removeAllRead(req.user.userId);
    }
}