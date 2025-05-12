import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateScheduleDto {
    @IsString()
    day: string;

    @IsString()
    startTime: string;

    @IsString()
    endTime: string;

    @IsString()
    room: string;

    @IsNumber()
    moduleId: number;

    @IsString()
    sectionId: string;

    @IsNumber()
    enseignantId: number;

    @IsNumber()
    @IsOptional()
    etudiantId?: number;
}