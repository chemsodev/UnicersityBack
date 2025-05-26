import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { Transform } from "class-transformer";
import { ResponsableRole } from "../section-responsable.entity";

export class AssignResponsableDto {
  @IsNotEmpty()
  @IsEnum(ResponsableRole)
  role: ResponsableRole;

  @IsNotEmpty()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  enseignantId: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @IsNumber()
  groupId?: number;
}
