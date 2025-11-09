'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'
import { handleServerActionError } from '@/lib/errors'
import { sanitizeText } from '@/lib/sanitize'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function counterOffer(applicationId: string, newAmount: number, note?: string) {
  try {
    const { user } = await requireAuth()
    await rateLimit('counter-offer', user.id, RATE_LIMITS.API_MODERATE)

    const safeNote = note ? sanitizeText(note) : null

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('counter_offer_bid', { 
      p_application_id: applicationId, 
      p_new_amount: newAmount, 
      p_note: safeNote 
    } as any)
    
    if (error) throw error

    logger.info('Counter offer made', { userId: user.id, applicationId, newAmount })
    return { data }
  } catch (error: any) {
    logger.error('Counter offer error', { error })
    return handleServerActionError(error)
  }
}

export async function acceptBid(applicationId: string) {
  try {
    const { user } = await requireAuth()
    await rateLimit('accept-bid', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('accept_bid', { p_application_id: applicationId } as any)
    
    if (error) throw error

    logger.info('Bid accepted', { userId: user.id, applicationId })
    return { data }
  } catch (error: any) {
    logger.error('Accept bid error', { error })
    return handleServerActionError(error)
  }
}

export async function rejectBid(applicationId: string, reason?: string) {
  try {
    const { user } = await requireAuth()
    await rateLimit('reject-bid', user.id, RATE_LIMITS.API_MODERATE)

    const safeReason = reason ? sanitizeText(reason) : null

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('reject_bid', { 
      p_application_id: applicationId, 
      p_reason: safeReason 
    } as any)
    
    if (error) throw error

    logger.info('Bid rejected', { userId: user.id, applicationId })
    return { data }
  } catch (error: any) {
    logger.error('Reject bid error', { error })
    return handleServerActionError(error)
  }
}

export async function withdrawBid(applicationId: string, reason?: string) {
  try {
    const { user } = await requireAuth()
    await rateLimit('withdraw-bid', user.id, RATE_LIMITS.API_MODERATE)

    const safeReason = reason ? sanitizeText(reason) : null

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('withdraw_bid', { 
      p_application_id: applicationId, 
      p_reason: safeReason 
    } as any)
    
    if (error) throw error

    logger.info('Bid withdrawn', { userId: user.id, applicationId })
    return { data }
  } catch (error: any) {
    logger.error('Withdraw bid error', { error })
    return handleServerActionError(error)
  }
}

export async function getBidStats(requestId: string) {
  try {
    await rateLimit('get-bid-stats', requestId, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()
    const { data: stats, error } = await supabase.rpc('get_bid_statistics', { p_request_id: requestId } as any)
    
    if (error) throw error

    return { data: stats }
  } catch (error: any) {
    logger.error('Get bid stats error', { error })
    return handleServerActionError(error)
  }
}
