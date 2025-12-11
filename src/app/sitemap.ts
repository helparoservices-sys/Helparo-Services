import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://helparo.in'
  const lastModified = new Date()

  // Main pages with high priority
  const mainRoutes = [
    { path: '/', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/services', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/auth/signup', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/auth/login', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/helper/register', priority: 0.8, changeFrequency: 'monthly' as const },
  ]

  // Service category pages (for SEO - "plumber near me" type searches)
  const serviceRoutes = [
    { path: '/services/plumbing', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/services/electrical', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/services/cleaning', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/services/ac-repair', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/services/carpentry', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/services/painting', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/services/appliance-repair', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/services/pest-control', priority: 0.8, changeFrequency: 'weekly' as const },
  ]

  // Legal pages
  const legalRoutes = [
    { path: '/legal/terms', priority: 0.4, changeFrequency: 'monthly' as const },
    { path: '/legal/privacy', priority: 0.4, changeFrequency: 'monthly' as const },
  ]

  // Customer dashboard pages
  const customerRoutes = [
    { path: '/customer/dashboard', priority: 0.6, changeFrequency: 'daily' as const },
    { path: '/customer/requests/new', priority: 0.7, changeFrequency: 'daily' as const },
    { path: '/customer/subscriptions', priority: 0.5, changeFrequency: 'weekly' as const },
  ]

  const allRoutes = [...mainRoutes, ...serviceRoutes, ...legalRoutes, ...customerRoutes]

  return allRoutes.map((route) => ({
    url: `${base}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
