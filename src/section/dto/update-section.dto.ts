// src/section/dto/update-section.dto.ts
import { IsOptional, IsString, IsNumber, Length } from "class-validator";

export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  specialty?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  level?: string;

  @IsOptional()
  @IsString()
  @Length(2, 20)
  code?: string;

  @IsOptional()
  @IsNumber()
  departmentId?: number;
}
