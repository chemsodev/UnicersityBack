import { IsString, IsOptional } from 'class-validator';

export class UpdateScheduleDto {
    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    sectionId?: string;

    @IsString()
    @IsOptional()
    semester?: string;
}