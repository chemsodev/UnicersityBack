import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateDepartmentDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    headOfDepartment: string;
}