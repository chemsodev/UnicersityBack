import { IsArray, IsNumber } from 'class-validator';

export class AssignSectionsDto {
    @IsArray()
    @IsNumber({}, { each: true })
    sectionIds: number[];
}