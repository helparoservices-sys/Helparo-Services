'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'
import { UserRole } from '@/lib/constants'
import { handleServerActionError } from '@/lib/errors'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function startJob(requestId: string) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    await rateLimit('start-job', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('start_job', { p_request_id: requestId } as any)
    
    if (error) throw error

    logger.info('Job started', { userId: user.id, requestId })
    return { data }
  } catch (error: any) {
    logger.error('Start job error', { error })
    return handleServerActionError(error)
  }
}

export async function recordArrival(requestId: string) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    await rateLimit('record-arrival', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('record_arrival', { p_request_id: requestId } as any)
    
    if (error) throw error

    logger.info('Arrival recorded', { userId: user.id, requestId })
    return { data }
  } catch (error: any) {
    logger.error('Record arrival error', { error })
    return handleServerActionError(error)
  }
}

export async function completeJob(requestId: string) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    await rateLimit('complete-job', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('complete_job', { p_request_id: requestId } as any)
    
    if (error) throw error

    logger.info('Job completed', { userId: user.id, requestId })
    return { data }
  } catch (error: any) {
    logger.error('Complete job error', { error })
    return handleServerActionError(error)
  }
}

export async function getTimeline(requestId: string) {
  try {
    await rateLimit('get-timeline', requestId, RATE_LIMITS.API_RELAXED)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_job_timeline', { p_request_id: requestId } as any)
    
    if (error) throw error

    return { data }
  } catch (error: any) {
    logger.error('Get timeline error', { error })
    return handleServerActionError(error)
  }
}

