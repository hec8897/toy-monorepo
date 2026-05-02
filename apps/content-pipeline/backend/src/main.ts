import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigins = [
    process.env.FRONTEND_URL ?? 'http://localhost:3004',
    /https:\/\/content-pipeline.*\.vercel\.app$/,
  ];

  app.enableCors({ origin: allowedOrigins, credentials: true });

  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  Logger.log(`🚀 content-pipeline backend on http://localhost:${port}/api`);
}

bootstrap();
