import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateScheduleDto {
    @IsString()
    @IsOptional()
    day?: string;
    
    @IsString()
    @IsOptional()
    startTime?: string;
    
    @IsString()
    @IsOptional()
    endTime?: string;
    
    @IsString()
    @IsOptional()
    room?: string;
    
    @IsString()
    @IsOptional()
    sectionId?: string;
    
    @IsNumber()
    @IsOptional()
    enseignantId?: number;
    
    @IsNumber()
    @IsOptional()
    etudiantId?: number;
}