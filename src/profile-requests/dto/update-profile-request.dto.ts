import { IsEnum, IsOptional, IsString } from "class-validator";
import { ProfileRequestStatus } from "../profile-request.entity";

export class UpdateProfileRequestDto {
  @IsOptional()
  @IsEnum(ProfileRequestStatus)
  status?: ProfileRequestStatus;

  @IsOptional()
  @IsString()
  adminComment?: string;
}
