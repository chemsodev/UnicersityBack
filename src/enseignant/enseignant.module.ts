import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Enseignant } from "./enseignant.entity";
import { EnseignantController } from "./enseignant.controller";
import { EnseignantService } from "./enseignant.service";
import { Schedule } from "../schedules/entities/schedule.entity";
import { Section } from "../section/section.entity";
import { SectionResponsable } from "../section/section-responsable.entity";
import { Etudiant } from "../etudiant/etudiant.entity";
import { ChangeRequest } from "../change-request/change-request.entity";
import { Groupe } from "../groupe/groupe.entity";
import { User } from "../user.entity";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([
      Enseignant,
      User,
      Schedule,
      Section,
      SectionResponsable,
      Etudiant,
      ChangeRequest,
      Groupe,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || "secretKey",
      signOptions: { expiresIn: "60h" },
    }),
  ],
  controllers: [EnseignantController],
  providers: [EnseignantService],
  exports: [EnseignantService],
})
export class EnseignantModule {}
