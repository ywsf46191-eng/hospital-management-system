import { loadRootEnv } from './config/load-env';
loadRootEnv();

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { API_PREFIX } from '@hospital/config';
import { AppModule } from './app.module';
import { APP_CONFIG } from './config/config.module';
import type { AppConfig } from './config/app-config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<AppConfig>(APP_CONFIG);

  app.setGlobalPrefix(API_PREFIX.replace(/^\//, ''));
  app.enableCors({ origin: config.corsOrigins, credentials: true });
  app.enableShutdownHooks();

  await app.listen(config.apiPort);
  Logger.log(`API listening on port ${config.apiPort} (${API_PREFIX})`, 'Bootstrap');
}

void bootstrap();
