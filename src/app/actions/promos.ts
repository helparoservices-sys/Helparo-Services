'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'
import { handleServerActionError } from '@/lib/errors'
import { sanitizeText } from '@/lib/sanitize'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function validatePromo(code: string, requestId?: string) {
  try {
    const { user } = await requireAuth()
    await rateLimit('validate-promo', user.id, RATE_LIMITS.API_MODERATE)

    const safeCode = sanitizeText(code.toUpperCase())

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('validate_promo_code', { 
      p_code: safeCode, 
      p_request_id: requestId || null 
    } as any)
    
    if (error) throw error

    logger.info('Promo code validated', { userId: user.id, code: safeCode, requestId, valid: !!data })
    return { data }
  } catch (error: any) {
    logger.error('Validate promo error', { error })
    return handleServerActionError(error)
  }
}

export async function applyPromo(code: string, requestId?: string) {
  try {
    const { user } = await requireAuth()
    await rateLimit('apply-promo', user.id, RATE_LIMITS.PAYMENT_ACTION)

    const safeCode = sanitizeText(code.toUpperCase())

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('apply_promo_code', { 
      p_code: safeCode, 
      p_request_id: requestId || null 
    } as any)
    
    if (error) throw error

    logger.info('Promo code applied', { userId: user.id, code: safeCode, requestId })
    return { data }
  } catch (error: any) {
    logger.error('Apply promo error', { error })
    return handleServerActionError(error)
  }
}

export async function generateReferralCode() {
  try {
    const { user } = await requireAuth()
    await rateLimit('generate-referral', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('generate_referral_code')
    
    if (error) throw error

    logger.info('Referral code generated', { userId: user.id })
    return { data }
  } catch (error: any) {
    logger.error('Generate referral error', { error })
    return handleServerActionError(error)
  }
}

export async function convertReferral(code: string) {
  try {
    const { user } = await requireAuth()
    await rateLimit('convert-referral', user.id, RATE_LIMITS.API_MODERATE)

    const safeCode = sanitizeText(code.toUpperCase())

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('convert_referral', { 
      p_referral_code: safeCode 
    } as any)
    
    if (error) throw error

    logger.info('Referral converted', { userId: user.id, code: safeCode })
    return { data }
  } catch (error: any) {
    logger.error('Convert referral error', { error })
    return handleServerActionError(error)
  }
}
