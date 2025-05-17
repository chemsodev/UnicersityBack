import { Module } from "@nestjs/common";
import { EtudiantService } from "./etudiant.service";
import { EtudiantController } from "./etudiant.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Etudiant } from "./etudiant.entity";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "../auth/auth.module";
import { Note } from "../notes/notes.entity";
import { MulterModule } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as path from "path";
import * as fs from "fs";
import { extname } from "path";
import { v4 as uuidv4 } from "uuid";
import { Schedule } from "../schedules/entities/schedule.entity";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Etudiant, Note, Schedule]),
    AuthModule,
    NotificationsModule,
    JwtModule,
    MulterModule.register({
      storage: diskStorage({
        destination: "./uploads/profiles",
        filename: (req, file, callback) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(
            Math.random() * 1e9
          )}`;
          const ext = extname(file.originalname);
          const filename = `${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
    }),
  ],
  providers: [EtudiantService],
  controllers: [EtudiantController],
  exports: [EtudiantService],
})
export class EtudiantModule {}
