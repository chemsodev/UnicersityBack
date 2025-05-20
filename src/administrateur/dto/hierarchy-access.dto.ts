import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { AdminRole } from "src/user.entity";

export class HierarchyAccessDto {
  @IsEnum(AdminRole)
  @IsNotEmpty()
  targetRole: AdminRole;

  @IsString()
  @IsOptional()
  actionType?: string;

  @IsString()
  @IsOptional()
  resourceId?: string;
}
