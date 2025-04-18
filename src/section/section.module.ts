// src/section/section.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SectionController } from './section.controller';
import { SectionService } from './section.service';
import { Section } from './section.entity';
import { Department } from '../departments/departments.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Groupe } from '../groupe/groupe.entity';
import { StudyModule } from '../modules/modules.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Section, Department, Etudiant, Groupe, StudyModule]),
    AuthModule , JwtModule
  ],
  controllers: [SectionController],
  providers: [SectionService],
  exports: [SectionService]
})
export class SectionModule { }