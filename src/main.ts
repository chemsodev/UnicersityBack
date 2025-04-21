import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true, // Explicit frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'Cache-Control',
      'X-Requested-With'
    ],
    exposedHeaders: ['Authorization'],
    credentials: true
  });
  
  // Add before other middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Headers', 'Authorization, Cache-Control, Content-Type');
    res.header('Access-Control-Expose-Headers', 'Authorization');
    next();
  });
  await app.listen(3000);
}
bootstrap();
