import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://helparo.in'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/services',
          '/services/*',
          '/about',
          '/contact',
          '/pricing',
          '/careers',
          '/city/*',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/customer/',
          '/helper/',
          '/auth/callback',
          '/auth/error',
          '/auth/complete-*',
          '/_next/',
          '/private/',
          '/*.json$',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/customer/', '/helper/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/customer/', '/helper/'],
      },
      // Block bad bots that waste server resources
      {
        userAgent: 'AhrefsBot',
        disallow: '/',
      },
      {
        userAgent: 'SemrushBot',
        disallow: '/',
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
