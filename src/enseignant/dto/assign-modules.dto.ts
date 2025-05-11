import { IsArray, IsNumber } from 'class-validator';

export class AssignModulesDto {
    @IsArray()
    @IsNumber({}, { each: true })
    moduleIds: number[];
}