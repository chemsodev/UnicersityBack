import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateScheduleDto {
    @IsString()
    day: string;

    @IsString()
    startTime: string;

    @IsString()
    endTime: string;

    @IsString()
    room: string;

    @IsString()
    moduleId: string;

    @IsString()
    sectionId: string;

    @IsString()
    enseignantId: string;

    @IsString()
    @IsOptional()
    etudiantId?: string;

    @IsString()
    @IsNotEmpty()
    imageUrl: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    semester?: string;
}