import { 
  IsString, 
  IsOptional, 
  IsNumber, 
  IsEnum 
} from "class-validator";
import { ScheduleType } from "../entities/schedule.entity";

export class UpdateScheduleDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  sectionId?: string;

  @IsNumber()
  @IsOptional()
  uploadedById?: number;

  @IsEnum(ScheduleType)
  @IsOptional()
  scheduleType?: ScheduleType;
  
  @IsString()
  @IsOptional()
  academicYear?: string;
  
  @IsString()
  @IsOptional()
  semester?: string;
  
  @IsNumber()
  @IsOptional()
  weekNumber?: number;
}
