import { PartialType } from '@nestjs/mapped-types';
import { CreateAdministrateurDto } from './create-administrateur.dto';
import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { AdminRole } from 'src/user.entity';

export class UpdateAdministrateurDto extends PartialType(CreateAdministrateurDto) {
    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    password?: string;

    @IsEnum(AdminRole)
    @IsOptional()
    adminRole?: AdminRole;
}