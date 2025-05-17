import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import * as express from "express";
import { DataSource } from "typeorm";
import { createSectionResponsablesTable } from "./data-migrations/create-section-responsables-table";
import { addEnseignantsAndResponsables } from "./data-migrations/add-enseignants-and-responsables";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors({
    origin: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Authorization, Content-Type",
    exposedHeaders: "Authorization",
    credentials: true,
  });

  // Add before other middleware
  app.use((req, res, next) => {
    res.header(
      "Access-Control-Allow-Headers",
      "Authorization, Cache-Control, Content-Type"
    );
    res.header("Access-Control-Expose-Headers", "Authorization");
    next();
  });

  // Run migrations
  const dataSource = app.get(DataSource);
  try {
    // First create the section_responsables table if needed
    await createSectionResponsablesTable(dataSource);

    // Then add enseignants and assign them as responsables
    await addEnseignantsAndResponsables(dataSource);

    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration error:", error);
  }

  // Serve static files from the uploads directory
  const uploadsDir = join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsDir));

  await app.listen(3000);
}
bootstrap();
