import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

// Import your modules
import { AuthModule } from "./auth/auth.module";
import { SectionModule } from "./section/section.module";
import { GroupeModule } from "./groupe/groupe.module";
import { EtudiantModule } from "./etudiant/etudiant.module";
import { ProfileRequestsModule } from "./profile-requests/profile-requests.module";
import { ChangeRequestModule } from "./change-request/change-request.module";
import { AdministrateurModule } from "./administrateur/administrateur.module";
import { AdminHierarchyModule } from "./modules/admin-hierarchy/admin-hierarchy.module";

// You might have more modules to import based on your needs

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // TypeORM configuration
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD, // Using env variable from .env
      database: process.env.DB_NAME,
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: false, // Set to false in production
      ssl: {
        rejectUnauthorized: false, // Depending on your Aiven setup
      },
    }), // Feature modules
    AuthModule,
    SectionModule,
    GroupeModule,
    EtudiantModule,
    ProfileRequestsModule,
    ChangeRequestModule,
    AdministrateurModule,
    AdminHierarchyModule,

    // Add other modules as needed
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
