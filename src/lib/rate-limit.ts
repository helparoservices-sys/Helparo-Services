/**
 * Free Rate Limiting Middleware (In-Memory)
 * Simple rate limiting without external services
 * Note: This is per-server instance. For production with multiple servers, consider Redis.
 */

import { createRateLimitError } from './errors'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string // Custom error message
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  // Authentication endpoints
  LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  SIGNUP: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 signups per hour
  MAGIC_LINK: { windowMs: 5 * 60 * 1000, maxRequests: 3 }, // 3 links per 5 minutes
  PASSWORD_RESET: { windowMs: 15 * 60 * 1000, maxRequests: 3 }, // 3 resets per 15 minutes
  
  // API endpoints
  API_STRICT: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 requests per minute
  API_MODERATE: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 requests per minute
  API_RELAXED: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  
  // Specific actions
  CREATE_REQUEST: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 requests per hour
  CREATE_REVIEW: { windowMs: 60 * 60 * 1000, maxRequests: 20 }, // 20 reviews per hour
  SEND_MESSAGE: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 messages per minute
  PAYMENT_ACTION: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 payments per minute
  
  // Admin actions
  ADMIN_BAN: { windowMs: 60 * 60 * 1000, maxRequests: 50 }, // 50 bans per hour
  ADMIN_APPROVE: { windowMs: 60 * 60 * 1000, maxRequests: 100 }, // 100 approvals per hour
} as const

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; resetTime: number; remaining: number } {
  const now = Date.now()
  const key = identifier
  
  const entry = rateLimitStore.get(key)
  
  // No existing entry or window expired
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return {
      allowed: true,
      resetTime,
      remaining: config.maxRequests - 1
    }
  }
  
  // Within window
  if (entry.count < config.maxRequests) {
    entry.count++
    return {
      allowed: true,
      resetTime: entry.resetTime,
      remaining: config.maxRequests - entry.count
    }
  }
  
  // Rate limit exceeded
  return {
    allowed: false,
    resetTime: entry.resetTime,
    remaining: 0
  }
}

/**
 * Rate limit middleware for server actions
 * Usage: await rateLimit('action-name', userId)
 */
export async function rateLimit(
  action: string,
  identifier: string,
  config?: RateLimitConfig
) {
  const limitConfig = config || RATE_LIMITS.API_MODERATE
  const key = `${action}:${identifier}`
  
  const result = checkRateLimit(key, limitConfig)
  
  if (!result.allowed) {
    const resetInSeconds = Math.ceil((result.resetTime - Date.now()) / 1000)
    throw createRateLimitError()
  }
  
  return result
}

/**
 * Rate limit by IP address (for non-authenticated endpoints)
 */
export function rateLimitByIP(ip: string, config?: RateLimitConfig) {
  const limitConfig = config || RATE_LIMITS.API_MODERATE
  const result = checkRateLimit(`ip:${ip}`, limitConfig)
  
  if (!result.allowed) {
    throw createRateLimitError()
  }
  
  return result
}

/**
 * Rate limit by user ID (for authenticated endpoints)
 */
export function rateLimitByUser(userId: string, config?: RateLimitConfig) {
  const limitConfig = config || RATE_LIMITS.API_MODERATE
  const result = checkRateLimit(`user:${userId}`, limitConfig)
  
  if (!result.allowed) {
    throw createRateLimitError()
  }
  
  return result
}

/**
 * Clear rate limit for an identifier (e.g., after successful login)
 */
export function clearRateLimit(action: string, identifier: string) {
  const key = `${action}:${identifier}`
  rateLimitStore.delete(key)
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(
  action: string,
  identifier: string,
  config?: RateLimitConfig
): { count: number; remaining: number; resetTime: number } {
  const limitConfig = config || RATE_LIMITS.API_MODERATE
  const key = `${action}:${identifier}`
  const now = Date.now()
  
  const entry = rateLimitStore.get(key)
  
  if (!entry || now > entry.resetTime) {
    return {
      count: 0,
      remaining: limitConfig.maxRequests,
      resetTime: now + limitConfig.windowMs
    }
  }
  
  return {
    count: entry.count,
    remaining: Math.max(0, limitConfig.maxRequests - entry.count),
    resetTime: entry.resetTime
  }
}

/**
 * Helper to format reset time for user display
 */
export function formatResetTime(resetTime: number): string {
  const now = Date.now()
  const diff = resetTime - now
  
  if (diff <= 0) return 'now'
  
  const minutes = Math.ceil(diff / 60000)
  
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  
  const hours = Math.ceil(minutes / 60)
  return `${hours} hour${hours !== 1 ? 's' : ''}`
}
