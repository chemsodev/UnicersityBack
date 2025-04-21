// src/groupe/dto/update-groupe.dto.ts
import { IsOptional, IsString, IsEnum, IsUUID, IsInt, Min } from 'class-validator';
import { GroupeType } from '../groupe.entity';


export class UpdateGroupeDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEnum(GroupeType)
    type?: GroupeType;

    @IsOptional()
    @IsUUID()
    sectionId?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    capacity?: number;
}