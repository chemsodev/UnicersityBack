import { IsArray, IsNumber } from 'class-validator';

export class AssignTeachersDto {
    @IsArray()
    @IsNumber({}, { each: true })
    teacherIds: number[];
}