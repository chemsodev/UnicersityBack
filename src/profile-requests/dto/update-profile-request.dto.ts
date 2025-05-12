import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ProfileRequestStatus } from '../profile-request.entity';

export class UpdateProfileRequestDto {
  @IsEnum(ProfileRequestStatus)
  @IsOptional()
  status?: ProfileRequestStatus;

  @IsString()
  @IsOptional()
  adminComment?: string;
}