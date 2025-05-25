import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
    })
  );
  app.enableCors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5500",
      "http://127.0.0.1:5502",
      "http://localhost:3001",
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "https://uni-front-zeta.vercel.app",
      "null", // For file:// protocol
      "*", // Allow all origins during development
    ],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Accept",
      "Authorization",
      "X-Requested-With",
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.setGlobalPrefix("api");

  const config = new DocumentBuilder()
    .setTitle("University API")
    .setDescription("API for university management")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(3000);
}
bootstrap();
