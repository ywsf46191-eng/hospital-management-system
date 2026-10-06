#!/usr/bin/env node
// Runs the Prisma CLI against the shared schema in /prisma, loading the root .env
// for host development. Existing environment variables take precedence.
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = join(__dirname, '..', '..', '..');
const envFile = join(repoRoot, '.env');
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const schema = join(repoRoot, 'prisma', 'schema.prisma');
const cli = require.resolve('prisma/build/index.js');
const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2), '--schema', schema], {
  stdio: 'inherit',
  env: process.env,
});
process.exit(result.status ?? 1);
