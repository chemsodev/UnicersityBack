import { PartialType } from '@nestjs/mapped-types';
import { CreateNoteDto } from './create-note.dto';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdateNoteDto extends PartialType(CreateNoteDto) {
    @IsNumber()
    @Min(0)
    @Max(100)
    @IsOptional()
    value?: number;
}