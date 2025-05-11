import { IsString, IsEnum, IsOptional } from 'class-validator';
import { NotificationType } from '../notification.entity';

export class CreateNotificationDto {
    @IsString()
    title: string;

    @IsString()
    content: string;

    @IsEnum(NotificationType)
    type: NotificationType;

    @IsString()
    userId: string;

    @IsString()
    @IsOptional()
    actionLink?: string;

    @IsString()
    @IsOptional()
    actionLabel?: string;
}