import { Module } from '@nestjs/common';
import { EtudiantService } from './etudiant.service';
import { EtudiantController } from './etudiant.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Etudiant } from './etudiant.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Etudiant]) , JwtModule],
  providers: [EtudiantService ],
  controllers: [EtudiantController]
})
export class EtudiantModule {}
