import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudyModule } from '../modules/modules.entity';
import { Section } from '../section/section.entity';
import { Enseignant } from '../enseignant/enseignant.entity';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Schedule } from './schedules.entity';
import { ScheduleController } from './schedules.controller';
import { ScheduleService } from './schedules.service';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, StudyModule, Section, Enseignant, Etudiant])],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule { }