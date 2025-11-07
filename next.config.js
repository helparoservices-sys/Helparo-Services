/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['opnjibjsddwyojrerbll.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
