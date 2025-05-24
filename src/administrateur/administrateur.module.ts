import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Administrateur } from "./administrateur.entity";
import { User } from "../user.entity";
import { AdministrateurController } from "./administrateur.controller";
import { AdministrateurService } from "./administrateur.service";
import { AdminNotificationsController } from "./controllers/admin-notifications.controller";
import { NotificationsService } from "../notifications/notifications.service";
import { Notification } from "../notifications/notification.entity";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Administrateur, User, Notification]),
    AuthModule,
  ],
  controllers: [AdministrateurController, AdminNotificationsController],
  providers: [AdministrateurService, NotificationsService],
  exports: [AdministrateurService],
})
export class AdministrateurModule {}
