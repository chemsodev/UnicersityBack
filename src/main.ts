import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Authorization, Content-Type',
    exposedHeaders: 'Authorization',
    credentials: true,
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
