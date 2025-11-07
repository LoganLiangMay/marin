/** @type {import('next').NextConfig} */
const nextConfig = {
  // Firebase Hosting compatibility - static export
  output: 'export',

  // Add trailing slashes for proper routing with static export
  trailingSlash: true,

  // Strict mode for better development experience
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '**.s3.amazonaws.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'AI Video Ad Generator',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Optimize CSS
    optimizeCss: true,
  },

  // Headers for security and CORS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ];
  },

  // Redirects for Firebase compatibility
  async redirects() {
    return [
      {
        source: '/api/auth/:path*',
        has: [
          {
            type: 'header',
            key: 'host',
            value: '(?!localhost).*',
          },
        ],
        destination: 'https://:host/api/auth/:path*',
        permanent: false,
      },
    ];
  },

  // Turbopack configuration (Next.js 16+)
  turbopack: {
    // Add any Turbopack-specific configuration here if needed
  },

  // Disable x-powered-by header
  poweredByHeader: false,

  // Compress responses
  compress: true,

  // Generate ETags
  generateEtags: true,
};

export default nextConfig;