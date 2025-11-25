'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth-middleware'
import { sanitizeHTML } from '@/lib/sanitize'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { UserRole } from '@/lib/constants'
import { logger } from '@/lib/logger'

export async function getHelperSOSAlerts() {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    const supabase = await createClient()

    const { data: alerts, error } = await supabase
      .from('sos_alerts')
      .select('id, alert_type, status, description, created_at, latitude, longitude')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      logger.error('Failed to fetch SOS alerts', { error })
      return { error: 'Failed to load alerts' }
    }

    return { data: { alerts: alerts || [] } }
  } catch (error) {
    logger.error('Get SOS alerts error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

export async function createSOSAlert(data: {
  alert_type: string
  description: string
  latitude: number | null
  longitude: number | null
}) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    await rateLimit('create-sos-alert', user.id, RATE_LIMITS.API_RELAXED)

    if (!data.description || data.description.trim().length === 0) {
      return { error: 'Description is required' }
    }

    const supabase = await createClient()

    const { error } = await supabase.rpc('create_sos_alert', {
      p_alert_type: data.alert_type,
      p_latitude: data.latitude || 0,
      p_longitude: data.longitude || 0,
      p_description: sanitizeHTML(data.description.trim()),
    } as any)

    if (error) {
      logger.error('Failed to create SOS alert', { error })
      return { error: 'Failed to create alert' }
    }

    logger.info('SOS alert created', { user_id: user.id, alert_type: data.alert_type })
    revalidatePath('/helper/sos')

    return { success: true }
  } catch (error) {
    logger.error('Create SOS alert error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

export async function cancelSOSAlert(alertId: string) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    const supabase = await createClient()

    const { error } = await supabase.rpc('cancel_sos_alert', {
      p_alert_id: alertId,
    } as any)

    if (error) {
      logger.error('Failed to cancel SOS alert', { error })
      return { error: 'Failed to cancel alert' }
    }

    revalidatePath('/helper/sos')
    return { success: true }
  } catch (error) {
    logger.error('Cancel SOS alert error', { error })
    return { error: 'An unexpected error occurred' }
  }
}
