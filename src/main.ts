import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import * as express from "express";

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

  // Serve static files from the uploads directory
  const uploadsDir = join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsDir));

  await app.listen(3000);
}
bootstrap();
