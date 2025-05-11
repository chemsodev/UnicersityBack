import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enseignant } from './enseignant.entity';
import { EnseignantController } from './enseignant.controller';
import { EnseignantService } from './enseignant.service';
import { Schedule } from '../schedules/entities/schedule.entity';
import { StudyModule } from '../modules/modules.entity';
import { StudyModuleModule } from '../modules/modules.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Enseignant, Schedule, StudyModule]),
        StudyModuleModule
    ],
    controllers: [EnseignantController],
    providers: [EnseignantService],
    exports: [EnseignantService]
})
export class EnseignantModule {}