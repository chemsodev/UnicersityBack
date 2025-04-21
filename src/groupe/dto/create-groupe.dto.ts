// src/groupe/dto/create-groupe.dto.ts
import { IsNotEmpty, IsString, IsEnum, IsUUID, IsInt, Min } from 'class-validator';
import { GroupeType } from '../groupe.entity';

export class CreateGroupeDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(GroupeType)
    type: GroupeType;

    @IsUUID()
    @IsNotEmpty()
    sectionId: string;

    @IsInt()
    @Min(1)
    capacity: number;
}