import {
  IsDateString,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsUUID,
} from "class-validator";
export enum Gender {
  MASCULIN = "masculin",
  FEMININ = "féminin",
  AUTRE = "autre",
}
export class CreateEtudiantDto {
  // User fields
  @IsEmail({}, { message: "Email doit être valide" })
  email: string;

  @IsString({ message: "Le prénom est requis" })
  @MinLength(2, { message: "Le prénom doit contenir au moins 2 caractères" })
  @MaxLength(50, { message: "Le prénom ne peut pas dépasser 50 caractères" })
  prenom: string;

  @IsString({ message: "Le nom est requis" })
  @MinLength(2, { message: "Le nom doit contenir au moins 2 caractères" })
  @MaxLength(50, { message: "Le nom ne peut pas dépasser 50 caractères" })
  nom: string;

  @IsString({ message: "Le mot de passe est requis" })
  @MinLength(8, {
    message: "Le mot de passe doit contenir au moins 8 caractères",
  })
  motDePasse: string;

  // Student-specific fields
  @IsString({ message: "Le matricule est requis" })
  @MaxLength(20, { message: "Le matricule ne peut pas dépasser 20 caractères" })
  matricule: string;

  @IsDateString({}, { message: "Date de naissance doit être une date valide" })
  dateNaissance: Date;

  @IsEnum(Gender, { message: "Genre doit être masculin, féminin ou autre" })
  genre: Gender;

  @IsString({ message: "La nationalité est requise" })
  @MaxLength(50, {
    message: "La nationalité ne peut pas dépasser 50 caractères",
  })
  nationalite: string;

  @IsBoolean({ message: "Le champ handicap doit être un booléen" })
  @IsOptional()
  handicap?: boolean = false;

  // Delegate fields
  @IsBoolean()
  @IsOptional()
  isSectionDelegate?: boolean = false;

  @IsBoolean()
  @IsOptional()
  isGroupDelegate?: boolean = false;

  @IsUUID()
  @IsOptional()
  delegateSectionId?: string;

  @IsUUID()
  @IsOptional()
  delegateGroupId?: string;

  // Contact information (from your original request)
  @IsEmail({}, { message: "Email personnel doit être valide" })
  @IsOptional()
  adresseEmailPersonnelle?: string;

  @IsNotEmpty({ message: "Numéro de téléphone principal est requis" })
  @Matches(/^\+?[0-9\s-]{10,}$/, {
    message: "Format de numéro de téléphone invalide",
  })
  numeroTelephonePrincipal: string;

  @IsOptional()
  @Matches(/^\+?[0-9\s-]{10,}$/, {
    message: "Format de numéro de téléphone invalide",
  })
  numeroTelephoneSecondaire?: string;

  @IsNotEmpty({ message: "Adresse postale est requise" })
  adressePostale: string;

  @IsNotEmpty({ message: "Code postal est requis" })
  codePostal: string;

  @IsOptional()
  ville?: string;

  @IsOptional()
  @Matches(/^\+?[0-9\s-]{10,}$/, {
    message: "Format de numéro de téléphone invalide",
  })
  contactEnCasDurgence?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

import { PartialType } from "@nestjs/mapped-types";

export class UpdateEtudiantDto extends PartialType(CreateEtudiantDto) {}
