// src/section/dto/create-section.dto.ts
import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class CreateSectionDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @Length(2, 100)
    specialty: string;

    @IsString()
    @IsNotEmpty()
    @Length(1, 50)
    level: string;

    @IsString()
    @IsNotEmpty()
    @Length(2, 20)
    code: string;

    @IsUUID()
    @IsNotEmpty()
    departmentId: string;
}