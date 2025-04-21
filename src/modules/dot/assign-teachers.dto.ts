import { IsArray, IsString } from 'class-validator';

export class AssignTeachersDto {
    @IsArray()
    @IsString({ each: true })
    teacherIds: string[];
}