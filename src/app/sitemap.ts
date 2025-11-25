import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://helparo.com'
  const lastModified = new Date()

  const routes = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
    '/legal/terms',
    '/legal/privacy',
    '/customer/dashboard',
    '/customer/subscriptions',
    '/services',
  ]

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: path === '/' ? 1.0 : 0.6,
  }))
}
