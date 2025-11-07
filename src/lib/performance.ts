/**
 * Performance Utilities
 * Measure and optimize application performance
 */

// Measure component render time
export function measureRender(componentName: string, callback: () => void) {
  if (typeof window === 'undefined') return callback()
  
  const start = performance.now()
  callback()
  const end = performance.now()
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`⚡ ${componentName} rendered in ${(end - start).toFixed(2)}ms`)
  }
}

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle function for scroll/resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Lazy load images with IntersectionObserver
export function lazyLoadImage(img: HTMLImageElement) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLImageElement
          if (target.dataset.src) {
            target.src = target.dataset.src
            target.removeAttribute('data-src')
          }
          observer.unobserve(target)
        }
      })
    })
    
    observer.observe(img)
  } else {
    // Fallback for older browsers
    if (img.dataset.src) {
      img.src = img.dataset.src
    }
  }
}

// Report Web Vitals
export function reportWebVitals(metric: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vital:', metric)
  }
  
  // In production, send to analytics
  // Example: analytics.track('Web Vitals', metric)
}

// Preload critical resources
export function preloadResource(url: string, type: 'script' | 'style' | 'font' | 'image') {
  if (typeof window === 'undefined') return
  
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = url
  link.as = type
  
  if (type === 'font') {
    link.crossOrigin = 'anonymous'
  }
  
  document.head.appendChild(link)
}

// Cache with expiry
interface CacheItem<T> {
  data: T
  expiry: number
}

export class CacheWithExpiry<T = any> {
  private cache: Map<string, CacheItem<T>> = new Map()

  set(key: string, data: T, ttlMs: number = 5 * 60 * 1000) {
    const expiry = Date.now() + ttlMs
    this.cache.set(key, { data, expiry })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  clear() {
    this.cache.clear()
  }

  delete(key: string) {
    this.cache.delete(key)
  }
}

// Global cache instance
export const apiCache = new CacheWithExpiry()

// Optimized fetch with caching
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000
): Promise<T> {
  const cached = apiCache.get(key)
  
  if (cached) {
    if (process.env.NODE_ENV === 'development') {
      console.log('✨ Cache hit:', key)
    }
    return cached
  }
  
  const data = await fetcher()
  apiCache.set(key, data, ttlMs)
  
  return data
}

// Check if device has slow connection
export function hasSlowConnection(): boolean {
  if (typeof navigator === 'undefined') return false
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  
  if (!connection) return false
  
  return connection.effectiveType === 'slow-2g' || 
         connection.effectiveType === '2g' ||
         connection.saveData === true
}

// Adaptive loading strategy
export function shouldLoadHeavyContent(): boolean {
  if (hasSlowConnection()) return false
  
  // Check if user prefers reduced data
  if (typeof navigator !== 'undefined') {
    const connection = (navigator as any).connection
    if (connection?.saveData) return false
  }
  
  return true
}
