import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output is enabled only for container builds (see infrastructure/docker/web.Dockerfile).
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  outputFileTracingRoot: path.join(__dirname, '../..'),
  transpilePackages: [
    '@hospital/ui',
    '@hospital/types',
    '@hospital/config',
    '@hospital/validation',
  ],
};

export default nextConfig;
