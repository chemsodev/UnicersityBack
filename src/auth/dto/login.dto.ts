import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Format email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @IsString({ message: 'Mot de passe doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Mot de passe requis' })
  @MinLength(8, { message: 'Mot de passe trop court (8 caractères minimum)' })
  @MaxLength(32, { message: 'Mot de passe trop long (32 caractères maximum)' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'Le mot de passe doit contenir au moins 1 majuscule, 1 minuscule et 1 chiffre'
  })
  password: string;
}