import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Schedule } from "./entities/schedule.entity";
import { SchedulesController } from "./schedules.controller";
import { ScheduleService } from "./schedules.service";
import { Section } from "../section/section.entity";
import { NotificationsModule } from "../notifications/notifications.module";
import { SectionModule } from "../section/section.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Schedule, Section]),
    NotificationsModule,
    forwardRef(() => SectionModule),
  ],
  controllers: [SchedulesController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class SchedulesModule {}
