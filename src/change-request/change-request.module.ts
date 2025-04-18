// src/change-request/change-request.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChangeRequestController } from './change-request.controller';
import { ChangeRequestService } from './change-request.service';
import { ChangeRequest } from './change-request.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Section } from '../section/section.entity';
import { Groupe } from '../groupe/groupe.entity';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        TypeOrmModule.forFeature([ChangeRequest, Etudiant, Section, Groupe]),
        AuthModule , JwtModule
    ],
    controllers: [ChangeRequestController],
    providers: [ChangeRequestService],
})
export class ChangeRequestModule { }