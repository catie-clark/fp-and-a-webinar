import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  webpack: (config) => {
    const alias = config.resolve!.alias as Record<string, string>;
    alias.recharts = path.resolve(__dirname, 'node_modules/recharts/lib/index.js');
    return config;
  },
};

export default nextConfig;
