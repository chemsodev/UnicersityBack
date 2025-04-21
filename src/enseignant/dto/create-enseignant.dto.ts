import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateEnseignantDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    id_enseignant: string;

    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsString()
    @IsNotEmpty()
    email: string;
}