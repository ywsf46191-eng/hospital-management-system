import { loadRootEnv } from './config/load-env';
loadRootEnv();

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { API_PREFIX } from '@hospital/config';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = configureApp(app);

  await app.listen(config.apiPort);
  Logger.log(`API listening on port ${config.apiPort} (${API_PREFIX})`, 'Bootstrap');
}

void bootstrap();
