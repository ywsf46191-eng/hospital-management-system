import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@hospital/ui',
    '@hospital/types',
    '@hospital/config',
    '@hospital/validation',
  ],
};

export default nextConfig;
