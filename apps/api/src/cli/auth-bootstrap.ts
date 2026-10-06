import { loadRootEnv } from '../config/load-env';
loadRootEnv();

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createInterface } from 'node:readline/promises';
import { AppError } from '../common/errors';
import { runWithRequestContext } from '../common/request-context';
import { AppConfigModule } from '../config/config.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { BootstrapAdminService, BootstrapRefusedError } from '../modules/identity/bootstrap-admin.service';
import { SecurityModule } from '../modules/security.module';

@Module({ imports: [AppConfigModule, InfrastructureModule, SecurityModule] })
class BootstrapCliModule {}

async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

/** Reads a line without echoing it. Requires an interactive terminal. */
function askHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    const finish = (error?: Error) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', onData);
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') return finish();
        if (char === '\u0003') return finish(new Error('Cancelled.'));
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else if (char >= ' ') value += char;
      }
    };
    stdin.on('data', onData);
  });
}

async function main(): Promise<number> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error('auth:bootstrap must be run in an interactive terminal (passwords are never read from arguments, files or pipes).');
    return 1;
  }

  const app = await NestFactory.createApplicationContext(BootstrapCliModule, { logger: ['error', 'warn'] });
  try {
    const bootstrap = app.get(BootstrapAdminService);
    if (await bootstrap.platformAdminExists()) {
      console.error('An active platform administrator already exists. Bootstrap refused.');
      return 2;
    }

    console.log('Create the initial platform administrator. The password must be changed at first sign-in.');
    const username = await ask('Username: ');
    const displayName = await ask('Display name: ');
    const email = await ask('Email (optional): ');
    const password = await askHidden('Password: ');
    const confirmation = await askHidden('Confirm password: ');
    if (password !== confirmation) {
      console.error('Passwords do not match. Nothing was created.');
      return 1;
    }

    const context = { requestId: `cli-${Date.now()}`, ipAddress: null, userAgent: 'auth:bootstrap' };
    const result = await runWithRequestContext(context, () =>
      bootstrap.createInitialPlatformAdmin({ username, displayName, email: email || undefined, password }),
    );
    console.log(`Platform administrator "${result.username}" created (id ${result.userId}).`);
    return 0;
  } catch (error) {
    if (error instanceof BootstrapRefusedError) {
      console.error(error.message);
      return 2;
    }
    if (error instanceof AppError) {
      console.error(`${error.message}${error.details ? ` ${JSON.stringify(error.details)}` : ''}`);
      return 1;
    }
    console.error(`Bootstrap failed: ${(error as Error).message}`);
    return 1;
  } finally {
    await app.close();
  }
}

void main().then((code) => process.exit(code));
