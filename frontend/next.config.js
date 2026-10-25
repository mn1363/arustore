/** @type {import('next').NextConfig} */
const backendInternalUrl =
  process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:8000'

const nextConfig = {
  transpilePackages: ['three'],
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },
  reactStrictMode: true,
  swcMinify: true,
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return {
      fallback: [
        {
          source: '/api/v1/:path*/',
          destination: `${backendInternalUrl}/api/v1/:path*/`,
        },
        {
          source: '/api/v1/:path*',
          destination: `${backendInternalUrl}/api/v1/:path*`,
        },
        {
          source: '/docs',
          destination: `${backendInternalUrl}/docs`,
        },
        {
          source: '/openapi.json',
          destination: `${backendInternalUrl}/openapi.json`,
        },
      ],
    }
  },
}

module.exports = nextConfig
