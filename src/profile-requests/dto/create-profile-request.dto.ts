import { IsOptional, IsString, IsUUID, IsObject } from "class-validator";

export class CreateProfileRequestDto {
  @IsUUID()
  studentId: string;

  @IsOptional()
  @IsString()
  adresseEmailPersonnelle?: string;

  @IsOptional()
  @IsString()
  numeroTelephonePrincipal?: string;

  @IsOptional()
  @IsString()
  numeroTelephoneSecondaire?: string;

  @IsOptional()
  @IsString()
  adressePostale?: string;

  @IsOptional()
  @IsString()
  codePostal?: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  contactEnCasDurgence?: string;

  @IsOptional()
  @IsObject()
  changes?: {
    personalEmail?: string;
    phone?: string;
    secondaryPhone?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    emergencyContact?: string;
  };
}
