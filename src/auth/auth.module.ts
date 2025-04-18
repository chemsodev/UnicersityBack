import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { Etudiant } from '../etudiant/etudiant.entity';
import { Enseignant } from '../enseignant/enseignant.entity';
import { Administrateur } from '../administrateur/administrateur.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([Etudiant, Enseignant, Administrateur]),
    JwtModule
  ],
  providers: [AuthService, AuthGuard],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
