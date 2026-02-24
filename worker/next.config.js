/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    webpackMemoryOptimizations: true,
    cpus: 1,
  },
};

module.exports = nextConfig;
