import type { MetadataRoute } from 'next'
import { SEO_SERVICES, TARGET_CITIES, getAllServiceCityPairs } from '@/lib/seo-config'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://helparo.in'
  const lastModified = new Date()

  // Main pages with high priority
  const mainRoutes = [
    { path: '/', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/services', priority: 0.95, changeFrequency: 'daily' as const },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/careers', priority: 0.6, changeFrequency: 'weekly' as const },
    { path: '/pricing', priority: 0.8, changeFrequency: 'weekly' as const },
  ]

  // Service category pages - HIGH priority for "plumber near me" type searches
  const serviceRoutes = SEO_SERVICES.map(service => ({
    path: `/services/${service.slug}`,
    priority: 0.9,
    changeFrequency: 'weekly' as const,
  }))

  // City-specific service pages - HIGHEST priority for local SEO
  // These target "plumber in guntur", "electrician in vijayawada" type searches
  const serviceCityRoutes = getAllServiceCityPairs().map(({ service, city }) => ({
    path: `/services/${service}/${city}`,
    priority: 0.95, // High priority for local searches
    changeFrequency: 'weekly' as const,
  }))

  // City landing pages (if you have them)
  const cityRoutes = TARGET_CITIES.map(city => ({
    path: `/city/${city.slug}`,
    priority: 0.85,
    changeFrequency: 'weekly' as const,
  }))

  // Legal pages (lower priority but important for trust)
  const legalRoutes = [
    { path: '/legal/terms', priority: 0.3, changeFrequency: 'monthly' as const },
    { path: '/legal/privacy', priority: 0.3, changeFrequency: 'monthly' as const },
    { path: '/legal/refund', priority: 0.3, changeFrequency: 'monthly' as const },
  ]

  // Auth pages - low priority, still indexable for brand searches
  const authRoutes = [
    { path: '/auth/signup', priority: 0.4, changeFrequency: 'monthly' as const },
    { path: '/auth/login', priority: 0.3, changeFrequency: 'monthly' as const },
  ]

  const allRoutes = [
    ...mainRoutes, 
    ...serviceRoutes, 
    ...serviceCityRoutes,
    ...cityRoutes,
    ...legalRoutes,
    ...authRoutes,
  ]

  // Remove trailing slash from base URL to prevent double slashes
  const baseUrl = base.replace(/\/$/, '')

  return allRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
