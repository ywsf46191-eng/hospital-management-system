import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { API_PREFIX } from '@hospital/config';
import helmet from 'helmet';
import type { AppConfig } from '../config/app-config';
import { APP_CONFIG } from '../config/config.module';
import { CSRF_HEADER } from '../modules/identity/session-token';

/** HTTP-level setup shared by the server entry point and integration tests. */
export function configureApp(app: INestApplication): AppConfig {
  const config = app.get<AppConfig>(APP_CONFIG);
  const express = app as NestExpressApplication;

  express.set('trust proxy', config.trustProxy);
  express.disable('x-powered-by');
  app.use(helmet());
  app.setGlobalPrefix(API_PREFIX.replace(/^\//, ''));
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'X-Request-ID', CSRF_HEADER],
    exposedHeaders: ['X-Request-ID'],
  });
  app.enableShutdownHooks();
  return config;
}
