import { PartialType } from '@nestjs/mapped-types';
import { CreateScheduleDto } from './create-schedule.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {
    @IsString()
    @IsOptional()
    etudiantId?: string | null;
}