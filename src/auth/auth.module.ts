import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
import { Etudiant } from "../etudiant/etudiant.entity";
import { Enseignant } from "../enseignant/enseignant.entity";
import { Administrateur } from "../administrateur/administrateur.entity";
import { NotificationsModule } from "../notifications/notifications.module";
import { JwtStrategy } from "./jwt.strategy";

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([Etudiant, Enseignant, Administrateur]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "60h" },
    }),
    NotificationsModule,
  ],
  providers: [AuthService, AuthGuard, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule {}
