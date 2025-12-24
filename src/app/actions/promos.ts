'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'
import { UserRole } from '@/lib/constants'
import { handleServerActionError } from '@/lib/errors'
import { sanitizeText } from '@/lib/sanitize'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

// Validate promo for an order amount (rupees) without applying
export async function validatePromo(code: string, orderAmountRupees: number) {
  try {
    const { user } = await requireAuth()
    await rateLimit('validate-promo', user.id, RATE_LIMITS.API_MODERATE)

    const safeCode = sanitizeText(code.toUpperCase())

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('validate_promo_code', {
      p_code: safeCode,
      p_order_amount_rupees: orderAmountRupees
    } as any)
    
    if (error) throw error

    logger.info('Promo code validated', { userId: user.id, code: safeCode, orderAmountRupees, valid: !!data })
    return { data }
  } catch (error: any) {
    logger.error('Validate promo error', { error })
    return handleServerActionError(error)
  }
}

// Apply promo to a specific request id for given order amount (rupees)
export async function applyPromo(code: string, requestId: string, orderAmountRupees: number) {
  try {
    const { user } = await requireAuth()
    await rateLimit('apply-promo', user.id, RATE_LIMITS.PAYMENT_ACTION)

    const safeCode = sanitizeText(code.toUpperCase())

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('apply_promo_code', {
      p_code: safeCode,
      p_request_id: requestId,
      p_order_amount_rupees: orderAmountRupees
    } as any)
    
    if (error) throw error

    logger.info('Promo code applied', { userId: user.id, code: safeCode, requestId, orderAmountRupees })
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

    // Just uppercase and trim - don't use sanitizeText as it may strip chars
    const safeCode = code.trim().toUpperCase()
    
    console.log('[convertReferral] Input code:', code)
    console.log('[convertReferral] Safe code:', safeCode)
    console.log('[convertReferral] User ID:', user.id)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('convert_referral', { 
      p_referral_code: safeCode,
      p_new_user_id: user.id
    })
    
    console.log('[convertReferral] RPC result - data:', data, 'error:', error)
    
    if (error) {
      logger.error('Convert referral RPC error', { error, code: safeCode, userId: user.id })
      return { error: error.message || 'Failed to apply referral code' }
    }

    // data is boolean - true if converted, false if not found/already used
    if (data === false) {
      console.log('[convertReferral] RPC returned false - invalid code or already used')
      return { error: 'Invalid referral code or already used' }
    }

    console.log('[convertReferral] Success!')
    logger.info('Referral converted', { userId: user.id, code: safeCode })
    return { data: true, success: true }
  } catch (error: any) {
    console.error('[convertReferral] Exception:', error)
    logger.error('Convert referral error', { error })
    return handleServerActionError(error)
  }
}

// Admin: create a promo code
export async function createPromo(input: {
  code: string
  description?: string
  discountType: 'flat' | 'percent'
  discountValue: number
  maxDiscountRupees?: number
  startDate: string
  endDate: string
  usageLimitTotal?: number
  usageLimitPerUser?: number
  minOrderAmountRupees?: number
  allowedRoles?: string[]
}) {
  try {
    const { user, profile } = await requireAuth(UserRole.ADMIN)
    await rateLimit('create-promo', user.id, RATE_LIMITS.API_MODERATE)

    const safeCode = sanitizeText(input.code.toUpperCase())
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('promo_codes')
      .insert({
        code: safeCode,
        description: input.description || null,
        discount_type: input.discountType,
        discount_value: input.discountValue,
        max_discount_rupees: input.maxDiscountRupees || null,
        start_date: input.startDate,
        end_date: input.endDate,
        usage_limit_total: input.usageLimitTotal || null,
        usage_limit_per_user: input.usageLimitPerUser || null,
        min_order_amount_rupees: input.minOrderAmountRupees || null,
        allowed_roles: input.allowedRoles && input.allowedRoles.length > 0 ? input.allowedRoles : ['customer'],
        created_by: profile.id
      })
      .select('id, code, description, discount_type, discount_value, is_active, start_date, end_date')
      .maybeSingle()
    if (error) throw error
    logger.info('Promo created', { code: safeCode, adminId: user.id })
    return { data }
  } catch (error: any) {
    logger.error('Create promo error', { error })
    return handleServerActionError(error)
  }
}

// Admin: toggle active state
export async function togglePromoActive(promoId: string, active: boolean) {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)
    await rateLimit('toggle-promo', user.id, RATE_LIMITS.API_MODERATE)
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('promo_codes')
      .update({ is_active: active })
      .eq('id', promoId)
      .select('id,is_active')
      .maybeSingle()
    if (error) throw error
    logger.info('Promo toggled', { promoId, active, adminId: user.id })
    return { data }
  } catch (error: any) {
    logger.error('Toggle promo error', { error })
    return handleServerActionError(error)
  }
}

// Admin: delete promo
export async function deletePromo(promoId: string) {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)
    await rateLimit('delete-promo', user.id, RATE_LIMITS.API_MODERATE)
    const supabase = await createClient()
    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', promoId)
    if (error) throw error
    logger.info('Promo deleted', { promoId, adminId: user.id })
    return { success: true }
  } catch (error: any) {
    logger.error('Delete promo error', { error })
    return handleServerActionError(error)
  }
}

// Admin: update promo (partial)
export async function updatePromo(promoId: string, changes: {
  code?: string
  description?: string | null
  discountType?: 'flat' | 'percent'
  discountValue?: number
  maxDiscountRupees?: number | null
  startDate?: string
  endDate?: string
  usageLimitTotal?: number | null
  usageLimitPerUser?: number | null
  minOrderAmountRupees?: number | null
  allowedRoles?: string[]
}) {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)
    await rateLimit('update-promo', user.id, RATE_LIMITS.API_MODERATE)
    const supabase = await createClient()

    const payload: any = {}
    if (changes.code) payload.code = sanitizeText(changes.code.toUpperCase())
    if (changes.description !== undefined) payload.description = changes.description
    if (changes.discountType) payload.discount_type = changes.discountType
    if (changes.discountValue !== undefined) payload.discount_value = changes.discountValue
    if (changes.maxDiscountRupees !== undefined) payload.max_discount_rupees = changes.maxDiscountRupees
    if (changes.startDate) payload.start_date = changes.startDate
    if (changes.endDate) payload.end_date = changes.endDate
    if (changes.usageLimitTotal !== undefined) payload.usage_limit_total = changes.usageLimitTotal
    if (changes.usageLimitPerUser !== undefined) payload.usage_limit_per_user = changes.usageLimitPerUser
    if (changes.minOrderAmountRupees !== undefined) payload.min_order_amount_rupees = changes.minOrderAmountRupees
    if (changes.allowedRoles) payload.allowed_roles = changes.allowedRoles

    if (Object.keys(payload).length === 0) {
      return { data: null }
    }

    const { data, error } = await supabase
      .from('promo_codes')
      .update(payload)
      .eq('id', promoId)
      .select('id, code, description, discount_type, discount_value, is_active, start_date, end_date')
      .maybeSingle()
    if (error) throw error
    logger.info('Promo updated', { promoId, adminId: user.id, fields: Object.keys(payload) })
    return { data }
  } catch (error: any) {
    logger.error('Update promo error', { error })
    return handleServerActionError(error)
  }
}
