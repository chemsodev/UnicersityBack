import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminHierarchyController } from "./admin-hierarchy.controller";
import { AdminHierarchyService } from "./admin-hierarchy.service";
import { Administrateur } from "../../administrateur/administrateur.entity";
import { AdministrateurModule } from "../../administrateur/administrateur.module";

@Module({
  imports: [TypeOrmModule.forFeature([Administrateur]), AdministrateurModule],
  controllers: [AdminHierarchyController],
  providers: [AdminHierarchyService],
  exports: [AdminHierarchyService],
})
export class AdminHierarchyModule {}
