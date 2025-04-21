import { IsArray, IsString } from 'class-validator';

export class AssignSectionsDto {
    @IsArray()
    @IsString({ each: true })
    sectionIds: string[];
}