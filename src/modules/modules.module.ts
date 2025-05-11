import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Enseignant } from '../enseignant/enseignant.entity';
import { Section } from '../section/section.entity';
import { StudyModule } from './modules.entity';
import { StudyModuleController } from './modules.controller';
import { StudyModuleService } from './modules.service';

@Module({
  imports: [TypeOrmModule.forFeature([StudyModule, Enseignant, Section])],
  controllers: [StudyModuleController],
  providers: [StudyModuleService],
  exports: [StudyModuleService, TypeOrmModule],
})
export class StudyModuleModule { }