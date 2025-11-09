'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'
import { handleServerActionError } from '@/lib/errors'
import { sanitizeText } from '@/lib/sanitize'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function registerDevice(token: string, platform: string) {
  try {
    const { user } = await requireAuth()
    await rateLimit('register-device', user.id, RATE_LIMITS.API_MODERATE)

    const safeToken = sanitizeText(token)
    const safePlatform = sanitizeText(platform)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('register_device_token', { 
      p_device_token: safeToken, 
      p_platform: safePlatform 
    } as any)
    
    if (error) throw error

    logger.info('Device registered for notifications', { userId: user.id, platform: safePlatform })
    return { data }
  } catch (error: any) {
    logger.error('Register device error', { error })
    return handleServerActionError(error)
  }
}

export async function setNotificationPref(channel: string, enabled: boolean) {
  try {
    const { user } = await requireAuth()
    await rateLimit('set-notification-pref', user.id, RATE_LIMITS.API_MODERATE)

    const safeChannel = sanitizeText(channel)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('set_notification_pref', { 
      p_channel: safeChannel, 
      p_enabled: enabled 
    } as any)
    
    if (error) throw error

    logger.info('Notification preference updated', { userId: user.id, channel: safeChannel, enabled })
    return { data }
  } catch (error: any) {
    logger.error('Set notification preference error', { error })
    return handleServerActionError(error)
  }
}

export async function markNotificationRead(id: string) {
  try {
    const { user } = await requireAuth()
    await rateLimit('mark-notification-read', user.id, RATE_LIMITS.API_RELAXED)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('mark_notification_read', { 
      p_notification_id: id 
    } as any)
    
    if (error) throw error

    return { data }
  } catch (error: any) {
    logger.error('Mark notification read error', { error })
    return handleServerActionError(error)
  }
}
