import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Administrateur } from './administrateur.entity';
import { User } from '../user.entity';
import { AdministrateurController } from './administrateur.controller';
import { AdministrateurService } from './administrateur.service';

@Module({
  imports: [TypeOrmModule.forFeature([Administrateur, User])],
  controllers: [AdministrateurController],
  providers: [AdministrateurService],
  exports: [AdministrateurService],
})
export class AdministrateurModule { }