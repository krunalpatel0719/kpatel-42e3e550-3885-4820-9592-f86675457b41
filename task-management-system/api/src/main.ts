/**
 * Task Management System API
 * Production-ready with security middleware enabled
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix for all routes
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Security middleware - Helmet for HTTP headers
  app.use(helmet());

  // CORS configuration - Allow frontend origin
  const isDevelopment = process.env.NODE_ENV !== 'production';
  app.enableCors({
    origin: isDevelopment
      ? ['http://localhost:4300', 'http://localhost:4200'] // Dev origins
      : process.env.FRONTEND_URL || 'https://yourdomain.com', // Production origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(`🔒 Security middleware enabled (Helmet + CORS)`);
}

bootstrap();
