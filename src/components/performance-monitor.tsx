'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Page Load Performance Tracking
 * Automatically tracks page navigation performance
 */
export function PerformanceMonitor() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Track page load time
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigationTiming) {
        const pageLoadTime = navigationTiming.loadEventEnd - navigationTiming.fetchStart
        const domContentLoaded = navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart
        const ttfb = navigationTiming.responseStart - navigationTiming.requestStart

        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Page Performance:', {
            pathname,
            pageLoadTime: `${pageLoadTime.toFixed(0)}ms`,
            domContentLoaded: `${domContentLoaded.toFixed(0)}ms`,
            ttfb: `${ttfb.toFixed(0)}ms`
          })
        }

        // In production, send to analytics service
        // Example: analytics.track('Page Load', { pathname, pageLoadTime, ttfb })
      }
    }
  }, [pathname, searchParams])

  return null
}

/**
 * Web Vitals Reporter Component
 */
export function WebVitalsReporter() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Report Core Web Vitals
    const reportVital = (metric: any) => {
      const { name, value, id } = metric

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`📈 ${name}:`, {
          value: `${value.toFixed(2)}ms`,
          rating: metric.rating || 'N/A',
          id
        })
      }

      // Send to analytics in production
      // analytics.track('Web Vital', { metric: name, value, rating: metric.rating })
    }

    // Observe CLS (Cumulative Layout Shift)
    if ('PerformanceObserver' in window) {
      try {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ((entry as any).hadRecentInput) continue
            reportVital({
              name: 'CLS',
              value: (entry as any).value,
              rating: (entry as any).value < 0.1 ? 'good' : (entry as any).value < 0.25 ? 'needs-improvement' : 'poor',
              id: entry.entryType
            })
          }
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        // Browser doesn't support this observer
      }

      // Observe LCP (Largest Contentful Paint)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          reportVital({
            name: 'LCP',
            value: lastEntry.startTime,
            rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor',
            id: lastEntry.name
          })
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        // Browser doesn't support this observer
      }

      // Observe FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const duration = (entry as any).processingStart - entry.startTime
            reportVital({
              name: 'FID',
              value: duration,
              rating: duration < 100 ? 'good' : duration < 300 ? 'needs-improvement' : 'poor',
              id: entry.name
            })
          }
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
      } catch (e) {
        // Browser doesn't support this observer
      }
    }
  }, [])

  return null
}

/**
 * Network Speed Detector
 */
export function NetworkSpeedIndicator() {
  useEffect(() => {
    if (typeof navigator === 'undefined') return

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    if (connection) {
      const logNetworkInfo = () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🌐 Network:', {
            effectiveType: connection.effectiveType,
            downlink: `${connection.downlink}Mbps`,
            rtt: `${connection.rtt}ms`,
            saveData: connection.saveData
          })
        }
      }

      logNetworkInfo()
      connection.addEventListener('change', logNetworkInfo)

      return () => {
        connection.removeEventListener('change', logNetworkInfo)
      }
    }
  }, [])

  return null
}
