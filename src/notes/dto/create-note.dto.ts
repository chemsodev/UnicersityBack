import { IsNumber, IsString, Min, Max } from 'class-validator';

export class CreateNoteDto {
    @IsNumber()
    @Min(0)
    @Max(100)
    value: number;

    @IsString()
    etudiantId: string;

    @IsNumber()
    moduleId: number;
}