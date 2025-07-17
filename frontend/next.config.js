const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable this for better path resolution in Next.js 13
    esmExternals: false,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

module.exports = nextConfig;
