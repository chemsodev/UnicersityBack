import { IsString, IsOptional, IsNotEmpty, IsUUID } from 'class-validator';

// Remove the duplicate class declaration at line 36
// Keep only one instance of:
export class CreateProfileRequestDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsOptional()
  adresseEmailPersonnelle?: string;

  @IsString()
  @IsOptional()
  numeroTelephonePrincipal?: string;

  @IsString()
  @IsOptional()
  numeroTelephoneSecondaire?: string;

  @IsString()
  @IsOptional()
  adressePostale?: string;

  @IsString()
  @IsOptional()
  codePostal?: string;

  @IsString()
  @IsOptional()
  ville?: string;

  @IsString()
  @IsOptional()
  contactEnCasDurgence?: string;
}