import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProfileRequestsController } from "./profile-requests.controller";
import { ProfileRequestsService } from "./profile-requests.service";
import { ProfileRequest } from "./profile-request.entity";
import { EtudiantModule } from "../etudiant/etudiant.module";

@Module({
  imports: [TypeOrmModule.forFeature([ProfileRequest]), EtudiantModule],
  controllers: [ProfileRequestsController],
  providers: [ProfileRequestsService],
  exports: [ProfileRequestsService],
})
export class ProfileRequestsModule {}
