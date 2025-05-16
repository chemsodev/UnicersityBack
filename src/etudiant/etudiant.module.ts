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

@Module({
  imports: [
    TypeOrmModule.forFeature([Etudiant, Note]),
    AuthModule,
    JwtModule,
    MulterModule.register({
      dest: path.join(process.cwd(), "uploads"),
    }),
  ],
  providers: [EtudiantService],
  controllers: [EtudiantController],
  exports: [EtudiantService],
})
export class EtudiantModule {}
