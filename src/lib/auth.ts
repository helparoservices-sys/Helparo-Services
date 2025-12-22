/**
 * Authentication & Authorization Middleware
 * Reusable auth functions to eliminate duplicate code
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { UserRole } from './constants'
import { createUnauthorizedError, createForbiddenError } from './errors'
import { logger } from './logger'

/**
 * Profile cache to avoid repeated database queries
 * NOTE: In serverless (Vercel), cache is per-invocation so keep duration short
 */
const profileCache = new Map<string, { profile: Record<string, unknown>; timestamp: number }>()
const CACHE_DURATION = 30 * 1000 // 30 seconds (reduced from 5 min for serverless)

/**
 * Get profile from cache or database
 * Uses admin client to bypass RLS for reliable lookups
 */
async function getCachedProfile(userId: string, bypassCache = false) {
  const cached = profileCache.get(userId)
  const now = Date.now()
  
  // Return cached profile if still valid and not bypassing
  if (!bypassCache && cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.profile
  }
  
  // Use admin client to bypass RLS for profile lookups
  const adminClient = createAdminClient()
  
  // Fetch fresh profile
  const { data: profile, error } = await adminClient
    .from('profiles')
    .select('id, email, role, full_name, phone, avatar_url, is_active, email_verified, created_at, updated_at')
    .eq('id', userId)
    .single()
  
  if (error || !profile) {
    logger.error('Profile fetch failed', { userId, error })
    throw createUnauthorizedError('User profile not found')
  }
  
  // Cache the profile
  profileCache.set(userId, { profile, timestamp: now })
  
  return profile
}

/**
 * Clear profile cache (call after profile updates)
 */
export function clearProfileCache(userId: string) {
  profileCache.delete(userId)
}

/**
 * Require authentication (user must be logged in)
 */
export async function requireAuth() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw createUnauthorizedError('Please log in to continue')
  }
  
  return { user, supabase }
}

/**
 * Require specific role (admin, helper, or customer)
 * For admin role checks, we always bypass cache to ensure fresh data
 */
export async function requireRole(role: UserRole | UserRole[]) {
  const { user, supabase } = await requireAuth()
  
  const allowedRoles = Array.isArray(role) ? role : [role]
  const isAdminCheck = allowedRoles.includes(UserRole.ADMIN)
  
  // Always bypass cache for admin checks (critical security)
  // Uses admin client internally to bypass RLS
  const profile = await getCachedProfile(user.id, isAdminCheck)
  
  logger.info('Role check', { 
    userId: user.id, 
    userRole: profile.role, 
    requiredRoles: allowedRoles,
    isAdminCheck 
  })
  
  if (!allowedRoles.includes(profile.role as UserRole)) {
    // Clear cache so next request gets fresh data
    clearProfileCache(user.id)
    logger.warn('Role check failed', { 
      userId: user.id, 
      userRole: profile.role, 
      requiredRoles: allowedRoles 
    })
    throw createForbiddenError('You don\'t have permission to perform this action')
  }
  
  return { user, profile, supabase }
}

/**
 * Require admin role (always fetches fresh profile)
 */
export async function requireAdmin() {
  return requireRole(UserRole.ADMIN)
}

/**
 * Require helper role
 */
export async function requireHelper() {
  return requireRole(UserRole.HELPER)
}

/**
 * Require customer role
 */
export async function requireCustomer() {
  return requireRole(UserRole.CUSTOMER)
}

/**
 * Check if user owns a resource
 */
export async function requireOwnership(
  resourceTable: string,
  resourceId: string,
  ownerField: string = 'user_id'
) {
  const { user, supabase } = await requireAuth()
  
  const { data, error } = await supabase
    .from(resourceTable)
    .select(ownerField)
    .eq('id', resourceId)
    .single()
  
  if (error || !data) {
    throw createForbiddenError('Resource not found')
  }
  
  if ((data as any)[ownerField] !== user.id) {
    throw createForbiddenError('You don\'t have access to this resource')
  }
  
  return { user, supabase }
}

/**
 * Check if user is admin OR owner of resource
 */
export async function requireAdminOrOwnership(
  resourceTable: string,
  resourceId: string,
  ownerField: string = 'user_id'
) {
  const { user, supabase } = await requireAuth()
  
  const profile = await getCachedProfile(user.id)
  
  // Admins have access to everything
  if (profile.role === UserRole.ADMIN) {
    return { user, profile, supabase, isAdmin: true }
  }
  
  // Check ownership
  const { data, error } = await supabase
    .from(resourceTable)
    .select(ownerField)
    .eq('id', resourceId)
    .single()
  
  if (error || !data) {
    throw createForbiddenError('Resource not found')
  }
  
  if ((data as any)[ownerField] !== user.id) {
    throw createForbiddenError('You don\'t have access to this resource')
  }
  
  return { user, profile, supabase, isAdmin: false }
}

/**
 * Optional auth (returns null if not authenticated)
 */
export async function optionalAuth() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { user: null, supabase, profile: null }
    }
    
    const profile = await getCachedProfile(user.id)
    
    return { user, supabase, profile }
  } catch {
    const supabase = await createClient()
    return { user: null, supabase, profile: null }
  }
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    
    const userProfile = await getCachedProfile(user.id)
    return userProfile.role === UserRole.ADMIN
  } catch {
    return false
  }
}

/**
 * Check if current user is helper
 */
export async function isHelper(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    
    const profile = await getCachedProfile(user.id)
    return profile.role === UserRole.HELPER
  } catch {
    return false
  }
}

/**
 * Check if current user is customer
 */
export async function isCustomer(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    
    const profile = await getCachedProfile(user.id)
    return profile.role === UserRole.CUSTOMER
  } catch {
    return false
  }
}

/**
 * Get current user profile (throws if not authenticated)
 */
export async function getCurrentProfile() {
  const { user } = await requireAuth()
  return getCachedProfile(user.id)
}

/**
 * Helper function to check multiple roles
 */
export function hasAnyRole(userRole: string, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole as UserRole)
}
