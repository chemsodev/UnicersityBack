import { IsArray, IsString } from 'class-validator';

export class AssignModulesDto {
    @IsArray()
    @IsString({ each: true })
    moduleIds: string[];
}