import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProfileRequestsController } from "./profile-requests.controller";
import { ProfileRequestsService } from "./profile-requests.service";
import { ProfileRequest } from "./profile-request.entity";
import { EtudiantModule } from "../etudiant/etudiant.module";
import { AuthModule } from "../auth/auth.module";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfileRequest]),
    EtudiantModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "1d" },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    AuthModule,
  ],
  controllers: [ProfileRequestsController],
  providers: [ProfileRequestsService],
  exports: [ProfileRequestsService],
})
export class ProfileRequestsModule {}
