import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enseignant } from './enseignant.entity';
import { EnseignantService } from './enseignant.service';
import { EnseignantController } from './enseignant.controller';
import { StudyModule } from '../modules/modules.entity';
import { Schedule } from '../schedules/schedules.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Enseignant, StudyModule, Schedule])],
  controllers: [EnseignantController],
  providers: [EnseignantService],
  exports: [EnseignantService],
})
export class EnseignantModule { }