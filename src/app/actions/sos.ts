'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'
import { handleServerActionError } from '@/lib/errors'
import { sanitizeText } from '@/lib/sanitize'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function createSOS(alertType: string, lat: number, lng: number, description: string) {
  try {
    const { user } = await requireAuth()
    await rateLimit('create-sos', user.id, RATE_LIMITS.API_STRICT)

    const safeAlertType = sanitizeText(alertType)
    const safeDescription = sanitizeText(description)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('create_sos_alert', { 
      p_alert_type: safeAlertType, 
      p_latitude: lat, 
      p_longitude: lng, 
      p_description: safeDescription 
    } as any)
    
    if (error) throw error

    logger.error('SOS ALERT CREATED', { userId: user.id, alertType: safeAlertType, lat, lng, description: safeDescription, priority: 'CRITICAL' })
    return { data }
  } catch (error: any) {
    logger.error('Create SOS error', { error, priority: 'CRITICAL' })
    return handleServerActionError(error)
  }
}

export async function acknowledgeSOS(alertId: string) {
  try {
    const { user } = await requireAuth()
    await rateLimit('acknowledge-sos', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('acknowledge_sos_alert', { 
      p_alert_id: alertId 
    } as any)
    
    if (error) throw error

    logger.info('SOS acknowledged', { userId: user.id, alertId, priority: 'HIGH' })
    return { data }
  } catch (error: any) {
    logger.error('Acknowledge SOS error', { error })
    return handleServerActionError(error)
  }
}

export async function resolveSOS(alertId: string, resolutionNote?: string, falseAlarm?: boolean) {
  try {
    const { user } = await requireAuth()
    await rateLimit('resolve-sos', user.id, RATE_LIMITS.API_MODERATE)

    const safeResolutionNote = resolutionNote ? sanitizeText(resolutionNote) : null

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('resolve_sos_alert', { 
      p_alert_id: alertId, 
      p_resolution_note: safeResolutionNote, 
      p_is_false_alarm: !!falseAlarm 
    } as any)
    
    if (error) throw error

    logger.info('SOS resolved', { userId: user.id, alertId, falseAlarm: !!falseAlarm, priority: 'HIGH' })
    return { data }
  } catch (error: any) {
    logger.error('Resolve SOS error', { error })
    return handleServerActionError(error)
  }
}

export async function cancelSOS(alertId: string, reason?: string) {
  try {
    const { user } = await requireAuth()
    await rateLimit('cancel-sos', user.id, RATE_LIMITS.API_MODERATE)

    const safeReason = reason ? sanitizeText(reason) : null

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('cancel_sos_alert', { 
      p_alert_id: alertId, 
      p_reason: safeReason 
    } as any)
    
    if (error) throw error

    logger.info('SOS cancelled', { userId: user.id, alertId, reason: safeReason })
    return { data }
  } catch (error: any) {
    logger.error('Cancel SOS error', { error })
    return handleServerActionError(error)
  }
}

export async function getMySOSAlerts() {
  try {
    const { user } = await requireAuth()
    await rateLimit('get-sos', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sos_alerts')
      .select(`
        id,
        alert_type,
        status,
        description,
        latitude,
        longitude,
        created_at,
        acknowledged_at,
        resolved_at,
        resolution_note
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error

    return { data: { alerts: data || [] } }
  } catch (error: any) {
    logger.error('Get my SOS alerts error', { error })
    return handleServerActionError(error)
  }
}
