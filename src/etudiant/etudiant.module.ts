import { Module } from '@nestjs/common';
import { EtudiantService } from './etudiant.service';
import { EtudiantController } from './etudiant.controller';

@Module({
  providers: [EtudiantService],
  controllers: [EtudiantController]
})
export class EtudiantModule {}
