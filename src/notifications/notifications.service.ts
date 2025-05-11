import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
    ) {}

    async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
        const notification = this.notificationRepository.create(createNotificationDto);
        return await this.notificationRepository.save(notification);
    }

    async findAll(userId: string): Promise<Notification[]> {
        return await this.notificationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: string): Promise<Notification> {
        return await this.notificationRepository.findOneBy({ id });
    }

    async markAsRead(id: string): Promise<Notification> {
        await this.notificationRepository.update(id, { isRead: true });
        return this.findOne(id);
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationRepository.update(
            { userId, isRead: false },
            { isRead: true }
        );
    }

    async findUnreadCount(userId: string): Promise<number> {
        return await this.notificationRepository.count({
            where: { userId, isRead: false }
        });
    }

    async remove(id: string): Promise<void> {
        await this.notificationRepository.delete(id);
    }

    async removeAllRead(userId: string): Promise<void> {
        await this.notificationRepository.delete({
            userId,
            isRead: true
        });
    }
}