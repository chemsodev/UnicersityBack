import { IsString, IsNumber, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateStudyModuleDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    title: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    type: string;

    @IsNumber()
    coefficient: number;
}