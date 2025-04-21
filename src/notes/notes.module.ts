import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Etudiant } from '../etudiant/etudiant.entity';
import { StudyModule } from '../modules/modules.entity';
import { NoteController } from './notes.controller';
import { NoteService } from './notes.service';
import { Note } from './notes.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Note, Etudiant, StudyModule])],
  controllers: [NoteController],
  providers: [NoteService],
  exports: [NoteService],
})
export class NoteModule { }