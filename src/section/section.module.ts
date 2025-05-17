// src/section/section.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SectionController } from "./section.controller";
import { SectionService } from "./section.service";
import { Section } from "./section.entity";
import { Department } from "../departments/departments.entity";
import { Etudiant } from "../etudiant/etudiant.entity";
import { Groupe } from "../groupe/groupe.entity";
import { StudyModule } from "../modules/modules.entity";
import { SectionResponsable } from "./section-responsable.entity";
import { SectionResponsableService } from "./section-responsable.service";
import { SectionResponsableController } from "./section-responsable.controller";
import { Enseignant } from "../enseignant/enseignant.entity";
import { AuthModule } from "../auth/auth.module";
import { JwtModule } from "@nestjs/jwt";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Section,
      Department,
      Etudiant,
      Groupe,
      StudyModule,
      SectionResponsable,
      Enseignant,
    ]),
    AuthModule,
    JwtModule,
    NotificationsModule,
  ],
  controllers: [SectionController, SectionResponsableController],
  providers: [SectionService, SectionResponsableService],
  exports: [SectionService, SectionResponsableService],
})
export class SectionModule {}
