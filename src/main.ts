import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import * as express from "express";
import { DataSource } from "typeorm";
import { createSectionResponsablesTable } from "./data-migrations/create-section-responsables-table";
import { addEnseignantsAndResponsables } from "./data-migrations/add-enseignants-and-responsables";
import { Logger } from "@nestjs/common";

async function bootstrap() {
  // Create a logger instance
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Set log levels to reduce console noise
    logger: ['error', 'warn'],
  });
  app.setGlobalPrefix("api");
  
  // Improved CORS configuration with more headers
  app.enableCors({
    origin: "*", // Allow all origins for development
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Authorization, Content-Type, Accept, Cache-Control, Origin, X-Requested-With",
    exposedHeaders: "Authorization, Content-Disposition",
    credentials: true,
    maxAge: 3600, // Cache preflight requests for 1 hour
  });

  // Add better CORS middleware
  app.use((req, res, next) => {
    res.header(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, Accept, Cache-Control, Origin, X-Requested-With"
    );
    res.header("Access-Control-Expose-Headers", "Authorization, Content-Disposition");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).send();
    }
    
    next();
  });

  // Run migrations
  const dataSource = app.get(DataSource);
  try {
    // First create the section_responsables table if needed
    await createSectionResponsablesTable(dataSource);

    // Then add enseignants and assign them as responsables
    await addEnseignantsAndResponsables(dataSource);

    logger.log("Migrations completed successfully");
  } catch (error) {
    logger.error(`Migration error: ${error.message}`);
  }

  // Serve static files from the uploads directory
  const uploadsDir = join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsDir));
  
  // Add global error handler for unhandled promises
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at: ' + promise + ' reason: ' + reason);
  });

  // Set higher timeout for long-running queries
  app.use((req, res, next) => {
    // Set server timeout to 30 seconds 
    res.setTimeout(30000, () => {
      logger.warn(`Request timeout: ${req.method} ${req.url}`);
    });
    next();
  });

  // Start server with more detailed logging
  await app.listen(3000);
  logger.log(`Application is running on: http://localhost:3000/api`);
}

// Catch bootstrap errors
bootstrap().catch(err => {
  console.error('Error during application bootstrap:', err);
  process.exit(1);
});
