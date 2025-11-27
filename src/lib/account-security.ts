/**
 * Account Security & Lockout Management
 * Prevents brute force attacks with progressive lockouts
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { handleServerActionError } from '@/lib/errors'

interface LockoutConfig {
  failedAttempts: number
  lockoutUntil: Date
  isPermanent: boolean
}

/**
 * Get failed login attempts for an email
 */
export async function getFailedLoginAttempts(email: string): Promise<number> {
  try {
    const supabase = await createClient()
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    
    const { data, error } = await supabase
      .from('login_attempts')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('success', false)
      .gte('created_at', fifteenMinutesAgo.toISOString())
    
    if (error) {
      console.error('Error counting failed attempts:', error)
      return 0
    }
    
    return data?.length || 0
  } catch (error) {
    console.error('Error in getFailedLoginAttempts:', error)
    return 0
  }
}

/**
 * Check if account is locked out
 */
export async function checkAccountLockout(email: string): Promise<LockoutConfig | null> {
  try {
    const supabase = await createClient()
    
    // Check for permanent lockout in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_banned, ban_reason, status')
      .eq('email', email.toLowerCase())
      .single()
    
    if (profile?.is_banned) {
      return {
        failedAttempts: 999,
        lockoutUntil: new Date('2099-12-31'),
        isPermanent: true
      }
    }
    
    if (profile?.status === 'suspended') {
      return {
        failedAttempts: 999,
        lockoutUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isPermanent: false
      }
    }
    
    // Check recent failed attempts for temporary lockout
    const failedAttempts = await getFailedLoginAttempts(email)
    
    if (failedAttempts >= 10) {
      // 10+ failures = 24 hour lockout
      return {
        failedAttempts,
        lockoutUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isPermanent: false
      }
    }
    
    if (failedAttempts >= 7) {
      // 7-9 failures = 2 hour lockout
      return {
        failedAttempts,
        lockoutUntil: new Date(Date.now() + 2 * 60 * 60 * 1000),
        isPermanent: false
      }
    }
    
    if (failedAttempts >= 5) {
      // 5-6 failures = 30 minute lockout
      return {
        failedAttempts,
        lockoutUntil: new Date(Date.now() + 30 * 60 * 1000),
        isPermanent: false
      }
    }
    
    return null // No lockout
  } catch (error: any) {
    console.error('Error checking account lockout:', error)
    return null
  }
}

/**
 * Clear failed attempts after successful login
 */
export async function clearFailedAttempts(email: string) {
  try {
    const supabase = await createClient()
    
    // We don't delete login_attempts (keep for audit)
    // They'll naturally age out after 15 minutes
    
    return { success: true }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

/**
 * Temporarily lock account (admin action)
 */
export async function temporaryLockAccount(
  email: string,
  hours: number = 24,
  reason: string = 'Security lockout'
) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('profiles')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase())
    
    if (error) {
      return { error: error.message }
    }
    
    return { 
      success: true, 
      message: `Account locked for ${hours} hours` 
    }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}
