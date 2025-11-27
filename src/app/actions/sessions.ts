'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { handleServerActionError } from '@/lib/errors'
import { createHash } from 'crypto'

/**
 * Get device information from user agent
 */
function parseUserAgent(userAgent: string) {
  // Simple parsing - can be enhanced with a library like ua-parser-js
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent)
  const isTablet = /iPad|Android.*Tablet/i.test(userAgent)
  
  let deviceName = 'Desktop'
  if (isTablet) deviceName = 'Tablet'
  else if (isMobile) deviceName = 'Mobile'
  
  let browser = 'Unknown'
  if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'
  
  let os = 'Unknown'
  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'iOS'
  
  return { deviceName, browser, os }
}

/**
 * Get approximate location from IP (you can enhance with a GeoIP service)
 */
async function getLocationFromIP(ip: string): Promise<string> {
  // Placeholder - integrate with ipapi.co, ipgeolocation.io, or similar
  // For now return a generic location
  try {
    // Example: const response = await fetch(`https://ipapi.co/${ip}/json/`)
    // const data = await response.json()
    // return `${data.city}, ${data.country_name}`
    return 'Location Unknown'
  } catch {
    return 'Location Unknown'
  }
}

/**
 * Hash session token for storage (we don't store raw JWTs)
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Create a new session record when user logs in
 */
export async function createSessionRecord(sessionToken: string) {
  try {
    const supabase = await createClient()
    const headersList = await headers()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const userAgent = headersList.get('user-agent') || ''
    const ip = headersList.get('x-forwarded-for') || 
               headersList.get('x-real-ip') || 
               'Unknown'
    
    const { deviceName, browser, os } = parseUserAgent(userAgent)
    const location = await getLocationFromIP(ip)
    const tokenHash = hashToken(sessionToken)

    // Mark all existing sessions as not current
    await supabase
      .from('user_sessions')
      .update({ is_current: false })
      .eq('user_id', user.id)

    // Create new session record
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: tokenHash,
        device_name: `${os} ${deviceName}`,
        browser,
        os,
        ip_address: ip,
        location,
        user_agent: userAgent,
        is_current: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating session record:', error)
      return { error: error.message }
    }

    return { success: true, session: data }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

/**
 * Update session last active timestamp
 */
export async function updateSessionActivity(sessionToken: string) {
  try {
    const supabase = await createClient()
    const tokenHash = hashToken(sessionToken)

    const { error } = await supabase.rpc('update_session_activity', {
      p_session_token: tokenHash
    })

    if (error) {
      console.error('Error updating session activity:', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

/**
 * Get all active sessions for current user
 */
export async function getUserSessions() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('revoked', false)
      .order('last_active_at', { ascending: false })

    if (error) {
      console.error('Error fetching sessions:', error)
      return { error: error.message }
    }

    return { sessions: sessions || [] }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('user_sessions')
      .update({
        revoked: true,
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
        revoked_reason: 'User revoked session'
      })
      .eq('id', sessionId)
      .eq('user_id', user.id) // Ensure user can only revoke their own sessions

    if (error) {
      console.error('Error revoking session:', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

/**
 * Revoke all sessions except current one
 */
export async function revokeAllOtherSessions() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('user_sessions')
      .update({
        revoked: true,
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
        revoked_reason: 'User logged out all other devices'
      })
      .eq('user_id', user.id)
      .eq('is_current', false)
      .eq('revoked', false)

    if (error) {
      console.error('Error revoking all sessions:', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

/**
 * Log a login attempt (success or failure)
 */
export async function logLoginAttempt(params: {
  userId?: string
  email: string
  success: boolean
  failureReason?: string
}) {
  try {
    const supabase = await createClient()
    const headersList = await headers()
    
    const userAgent = headersList.get('user-agent') || ''
    const ip = headersList.get('x-forwarded-for') || 
               headersList.get('x-real-ip') || 
               'Unknown'
    
    const location = await getLocationFromIP(ip)

    const { error } = await supabase.rpc('log_login_attempt', {
      p_user_id: params.userId || null,
      p_email: params.email,
      p_success: params.success,
      p_ip_address: ip,
      p_location: location,
      p_user_agent: userAgent,
      p_failure_reason: params.failureReason || null
    })

    if (error) {
      console.error('Error logging login attempt:', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

/**
 * Get recent login attempts for current user
 */
export async function getLoginAttempts(limit: number = 10) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: attempts, error } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching login attempts:', error)
      return { error: error.message }
    }

    return { attempts: attempts || [] }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}
