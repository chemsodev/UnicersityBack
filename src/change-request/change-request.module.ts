// src/change-request/change-request.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { ChangeRequestController } from "./change-request.controller";
import { ChangeRequestService } from "./change-request.service";
import { ChangeRequest } from "./change-request.entity";
import { Etudiant } from "../etudiant/etudiant.entity";
import { Section } from "../section/section.entity";
import { Groupe } from "../groupe/groupe.entity";
import { AuthModule } from "src/auth/auth.module";
import { JwtModule } from "@nestjs/jwt";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ChangeRequest, Etudiant, Section, Groupe]),
    AuthModule,
    JwtModule,
    NotificationsModule,
  ],
  controllers: [ChangeRequestController],
  providers: [ChangeRequestService],
  exports: [ChangeRequestService],
})
export class ChangeRequestModule {}
