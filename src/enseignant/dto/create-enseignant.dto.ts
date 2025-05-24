import { IsString, IsNotEmpty, MaxLength, IsOptional } from "class-validator";

export class CreateEnseignantDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  matricule?: string;

  @IsString()
  @IsOptional()
  role?: string; // Will be set to 'enseignant' by default in service
}
