import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Loads the repository-root `.env` for host development.
 * Variables already present in the process environment (e.g. from Docker) take precedence.
 */
export function loadRootEnv(startDir: string = process.cwd()): string | null {
  let dir = startDir;
  for (;;) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) {
      const envFile = join(dir, '.env');
      if (!existsSync(envFile)) return null;
      process.loadEnvFile(envFile);
      return envFile;
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
