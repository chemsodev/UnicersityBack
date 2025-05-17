import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsNotEmpty,
} from "class-validator";
import { NotificationType } from "../notification.entity";
import { Transform } from "class-transformer";

export class CreateNotificationDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === "string" ? parseInt(value, 10) : value
  )
  userId: number | string;

  @IsString()
  @IsOptional()
  actionLink?: string;

  @IsString()
  @IsOptional()
  actionLabel?: string;
}
