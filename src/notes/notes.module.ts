import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsModule } from '../notifications/notifications.module';

import { Etudiant } from '../etudiant/etudiant.entity';
import { StudyModule } from '../modules/modules.entity';
import { NoteController } from './notes.controller';
import { NoteService } from './notes.service';
import { Note } from './notes.entity';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60h' },
    }),
    TypeOrmModule.forFeature([Note, Etudiant, StudyModule]),
    NotificationsModule
  ],
  controllers: [NoteController],
  providers: [NoteService],
  exports: [NoteService],
})
export class NotesModule { }