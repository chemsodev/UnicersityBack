// src/section/section.module.ts
import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SectionController } from "./section.controller";
import { SectionService } from "./section.service";
import { Section } from "./section.entity";
import { Department } from "../departments/departments.entity";
import { Etudiant } from "../etudiant/etudiant.entity";
import { Groupe } from "../groupe/groupe.entity";
import { SectionResponsable } from "./section-responsable.entity";
import { SectionResponsableService } from "./section-responsable.service";
import { SectionResponsableController } from "./section-responsable.controller";
import { Enseignant } from "../enseignant/enseignant.entity";
import { AuthModule } from "../auth/auth.module";
import { JwtModule } from "@nestjs/jwt";
import { NotificationsModule } from "../notifications/notifications.module";
import { SectionStatisticsService } from "./services/section-statistics.service";
import { SectionStatisticsController } from "./controllers/section-statistics.controller";
import { SectionScheduleService } from "./services/section-schedule.service";
import { SectionScheduleController } from "./controllers/section-schedule.controller";
import { Schedule } from "../schedules/entities/schedule.entity";
import { SchedulesModule } from "../schedules/schedules.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Section,
      Department,
      Etudiant,
      Groupe,
      SectionResponsable,
      Enseignant,
      Schedule,
    ]),
    AuthModule,
    JwtModule,
    NotificationsModule,
    forwardRef(() => SchedulesModule),
  ],
  controllers: [
    SectionController,
    SectionResponsableController,
    SectionStatisticsController,
    SectionScheduleController,
  ],
  providers: [
    SectionService,
    SectionResponsableService,
    SectionStatisticsService,
    SectionScheduleService,
  ],
  exports: [
    SectionService,
    SectionResponsableService,
    SectionStatisticsService,
    SectionScheduleService,
  ],
})
export class SectionModule {}
