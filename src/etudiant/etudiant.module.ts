import { Module } from "@nestjs/common";
import { EtudiantService } from "./etudiant.service";
import { EtudiantController } from "./etudiant.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Etudiant } from "./etudiant.entity";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "../auth/auth.module";
import { MulterModule } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as path from "path";
import * as fs from "fs";
import { extname } from "path";
import { v4 as uuidv4 } from "uuid";
import { Schedule } from "../schedules/entities/schedule.entity";
import { NotificationsModule } from "../notifications/notifications.module";
import { EnseignantModule } from "../enseignant/enseignant.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Etudiant, Schedule]),
    AuthModule,
    NotificationsModule,
    JwtModule,
    EnseignantModule,
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, callback) => {
          const uploadPath = "./uploads/profiles";
          // Create directory if it doesn't exist
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          callback(null, uploadPath);
        },
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
