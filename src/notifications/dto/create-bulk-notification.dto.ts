import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNotEmpty,
} from "class-validator";
import { NotificationType } from "../notification.entity";
import { Transform } from "class-transformer";

export class CreateBulkNotificationDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsArray()
  @IsNotEmpty()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((id) => (typeof id === "string" ? parseInt(id, 10) : id))
      : value
  )
  userIds: number[] | string[];

  @IsString()
  @IsOptional()
  actionLink?: string;

  @IsString()
  @IsOptional()
  actionLabel?: string;

  @IsOptional()
  @IsString()
  senderName?: string;

  @IsOptional()
  senderId?: number | string;

  @IsOptional()
  @IsString()
  importance?: "normal" | "high";
}
