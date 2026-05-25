import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features
  experimental: {
    optimizePackageImports: ['axios'],
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Turbopack configuration (empty to silence warning)
  turbopack: {},

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Redirects
  async redirects() {
    return [
      // Add any redirects here
    ];
  },

  // Rewrites for API proxy if needed
  async rewrites() {
    return [
      // Add any rewrites here
    ];
  },
};

export default nextConfig;
