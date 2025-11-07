/**
 * Reusable Authentication Middleware
 * Eliminates duplicate auth code across all server actions
 */

import { createClient } from '@/lib/supabase/server'
import { UserRole, ErrorCode } from './constants'
import { createUnauthorizedError, createForbiddenError } from './errors'
import { logger } from './logger'

interface AuthResult {
  user: {
    id: string
    email: string
  }
  profile: {
    id: string
    role: UserRole
    full_name: string
    email: string
  }
  supabase: Awaited<ReturnType<typeof createClient>>
}

/**
 * Require authentication and optionally check for specific role
 */
export async function requireAuth(
  requiredRole?: UserRole | UserRole[]
): Promise<AuthResult> {
  const supabase = await createClient()
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    logger.security('Unauthorized access attempt', 'medium', { error: authError?.message })
    throw createUnauthorizedError()
  }
  
  // Get user profile with role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .single()
  
  if (profileError || !profile) {
    logger.error('Failed to fetch user profile', profileError)
    throw createUnauthorizedError('Unable to verify your account')
  }
  
  // Check role if specified
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    
    if (!allowedRoles.includes(profile.role as UserRole)) {
      logger.security('Forbidden access attempt', 'high', {
        userId: user.id,
        requiredRole: allowedRoles,
        actualRole: profile.role
      })
      throw createForbiddenError()
    }
  }
  
  // Log successful auth
  logger.auth('Authenticated', user.id, true, { role: profile.role })
  
  return {
    user: {
      id: user.id,
      email: user.email || ''
    },
    profile: {
      id: profile.id,
      role: profile.role as UserRole,
      full_name: profile.full_name || '',
      email: profile.email || user.email || ''
    },
    supabase
  }
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<AuthResult> {
  return requireAuth(UserRole.ADMIN)
}

/**
 * Require helper role
 */
export async function requireHelper(): Promise<AuthResult> {
  return requireAuth(UserRole.HELPER)
}

/**
 * Require customer role
 */
export async function requireCustomer(): Promise<AuthResult> {
  return requireAuth(UserRole.CUSTOMER)
}

/**
 * Check if user owns a resource
 */
export async function requireOwnership(
  resourceUserId: string,
  currentUserId: string
): Promise<void> {
  if (resourceUserId !== currentUserId) {
    logger.security('Ownership check failed', 'high', {
      resourceUserId,
      currentUserId
    })
    throw createForbiddenError('You can only access your own resources')
  }
}

/**
 * Check if user has permission to access a resource
 * Either owner or admin
 */
export async function requireOwnershipOrAdmin(
  resourceUserId: string,
  auth: AuthResult
): Promise<void> {
  const isOwner = resourceUserId === auth.user.id
  const isAdmin = auth.profile.role === UserRole.ADMIN
  
  if (!isOwner && !isAdmin) {
    logger.security('Access denied - not owner or admin', 'high', {
      resourceUserId,
      currentUserId: auth.user.id,
      role: auth.profile.role
    })
    throw createForbiddenError()
  }
}

/**
 * Optional auth - returns null if not authenticated
 * Useful for pages that work both authenticated and unauthenticated
 */
export async function optionalAuth(): Promise<AuthResult | null> {
  try {
    return await requireAuth()
  } catch {
    return null
  }
}

/**
 * Check if email is verified
 */
export async function requireVerifiedEmail(): Promise<AuthResult> {
  const auth = await requireAuth()
  
  const { data: { user } } = await auth.supabase.auth.getUser()
  
  if (!user?.email_confirmed_at) {
    throw createForbiddenError('Please verify your email address first')
  }
  
  return auth
}

/**
 * Cache for profile lookups to reduce database queries
 * Simple in-memory cache with TTL
 */
const profileCache = new Map<string, { profile: any; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getCachedProfile(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const now = Date.now()
  const cached = profileCache.get(userId)
  
  // Return cached if valid
  if (cached && cached.expires > now) {
    return cached.profile
  }
  
  // Fetch from database
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (profile) {
    profileCache.set(userId, {
      profile,
      expires: now + CACHE_TTL
    })
  }
  
  return profile
}

/**
 * Clear profile cache for a user
 * Call this after profile updates
 */
export function clearProfileCache(userId: string) {
  profileCache.delete(userId)
}

/**
 * Clear all profile cache
 */
export function clearAllProfileCache() {
  profileCache.clear()
}
