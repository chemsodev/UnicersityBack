import { IsEnum, IsNotEmpty, IsNumber } from "class-validator";
import { ResponsableRole } from "../section-responsable.entity";

export class AssignResponsableDto {
  @IsNotEmpty()
  @IsEnum(ResponsableRole)
  role: ResponsableRole;

  @IsNotEmpty()
  @IsNumber()
  enseignantId: number;
}
