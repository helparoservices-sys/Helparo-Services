'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'
import { UserRole } from '@/lib/constants'
import { handleServerActionError } from '@/lib/errors'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export interface UserBonus {
  id: string
  bonus_type: 'welcome' | 'referral' | 'campaign' | 'loyalty' | 'promotion'
  amount: number
  status: 'pending' | 'credited' | 'expired' | 'cancelled'
  description: string | null
  credited_at: string | null
  expires_at: string | null
  created_at: string
}

/**
 * Get user's bonus history
 */
export async function getUserBonuses() {
  try {
    const { user } = await requireAuth()
    await rateLimit('get-bonuses', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_user_bonuses')
    
    if (error) throw error

    logger.info('User bonuses fetched', { userId: user.id, count: data?.length || 0 })
    return { data: data as UserBonus[] }
  } catch (error: any) {
    logger.error('Get user bonuses error', { error })
    return handleServerActionError(error)
  }
}

/**
 * Get bonus statistics for user
 */
export async function getUserBonusStats() {
  try {
    const { user } = await requireAuth()
    await rateLimit('bonus-stats', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()
    const { data: bonuses, error } = await supabase
      .from('user_bonuses')
      .select('bonus_type, amount, status')
      .eq('user_id', user.id)
    
    if (error) throw error

    // Calculate statistics
    const stats = {
      total_bonuses: bonuses?.length || 0,
      total_amount: bonuses?.reduce((sum, b) => sum + Number(b.amount), 0) || 0,
      by_type: {
        welcome: bonuses?.filter(b => b.bonus_type === 'welcome').reduce((sum, b) => sum + Number(b.amount), 0) || 0,
        referral: bonuses?.filter(b => b.bonus_type === 'referral').reduce((sum, b) => sum + Number(b.amount), 0) || 0,
        campaign: bonuses?.filter(b => b.bonus_type === 'campaign').reduce((sum, b) => sum + Number(b.amount), 0) || 0,
        loyalty: bonuses?.filter(b => b.bonus_type === 'loyalty').reduce((sum, b) => sum + Number(b.amount), 0) || 0,
        promotion: bonuses?.filter(b => b.bonus_type === 'promotion').reduce((sum, b) => sum + Number(b.amount), 0) || 0,
      },
      by_status: {
        credited: bonuses?.filter(b => b.status === 'credited').length || 0,
        pending: bonuses?.filter(b => b.status === 'pending').length || 0,
        expired: bonuses?.filter(b => b.status === 'expired').length || 0,
        cancelled: bonuses?.filter(b => b.status === 'cancelled').length || 0,
      }
    }

    logger.info('Bonus stats fetched', { userId: user.id, stats })
    return { data: stats }
  } catch (error: any) {
    logger.error('Get bonus stats error', { error })
    return handleServerActionError(error)
  }
}

/**
 * ADMIN: Manually grant bonus to a user
 */
export async function adminGrantBonus(input: {
  userId: string
  bonusType: 'welcome' | 'referral' | 'campaign' | 'loyalty' | 'promotion'
  amount: number
  description?: string
  expiresAt?: string
}) {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)
    await rateLimit('admin-grant-bonus', user.id, RATE_LIMITS.API_MODERATE)

    if (input.amount <= 0) {
      throw new Error('Bonus amount must be positive')
    }

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('admin_grant_bonus', {
      p_user_id: input.userId,
      p_bonus_type: input.bonusType,
      p_amount: input.amount,
      p_description: input.description || null,
      p_expires_at: input.expiresAt || null
    })
    
    if (error) throw error

    logger.info('Admin granted bonus', { 
      adminId: user.id, 
      userId: input.userId, 
      type: input.bonusType,
      amount: input.amount 
    })
    return { data }
  } catch (error: any) {
    logger.error('Admin grant bonus error', { error })
    return handleServerActionError(error)
  }
}

/**
 * ADMIN: Get all bonuses across platform
 */
export async function adminGetAllBonuses(filters?: {
  bonusType?: string
  status?: string
  limit?: number
  offset?: number
}) {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)
    await rateLimit('admin-all-bonuses', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()
    let query = supabase
      .from('user_bonuses')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false })
    
    if (filters?.bonusType) {
      query = query.eq('bonus_type', filters.bonusType)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }
    
    const { data, error, count } = await supabase
      .from('user_bonuses')
      .select('*', { count: 'exact', head: true })
    
    const { data: bonuses, error: fetchError } = await query

    if (fetchError) throw fetchError

    logger.info('Admin fetched all bonuses', { 
      adminId: user.id, 
      count: bonuses?.length || 0,
      filters 
    })
    return { data: bonuses, count }
  } catch (error: any) {
    logger.error('Admin get all bonuses error', { error })
    return handleServerActionError(error)
  }
}

/**
 * ADMIN: Get platform-wide bonus statistics
 */
export async function adminGetBonusStats() {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)
    await rateLimit('admin-bonus-stats', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()
    const { data: bonuses, error } = await supabase
      .from('user_bonuses')
      .select('bonus_type, amount, status')
    
    if (error) throw error

    // Calculate platform-wide statistics
    const stats = {
      total_bonuses_granted: bonuses?.length || 0,
      total_amount_granted: bonuses?.reduce((sum, b) => sum + Number(b.amount), 0) || 0,
      by_type: {
        welcome: {
          count: bonuses?.filter(b => b.bonus_type === 'welcome').length || 0,
          amount: bonuses?.filter(b => b.bonus_type === 'welcome').reduce((sum, b) => sum + Number(b.amount), 0) || 0,
        },
        referral: {
          count: bonuses?.filter(b => b.bonus_type === 'referral').length || 0,
          amount: bonuses?.filter(b => b.bonus_type === 'referral').reduce((sum, b) => sum + Number(b.amount), 0) || 0,
        },
        campaign: {
          count: bonuses?.filter(b => b.bonus_type === 'campaign').length || 0,
          amount: bonuses?.filter(b => b.bonus_type === 'campaign').reduce((sum, b) => sum + Number(b.amount), 0) || 0,
        },
        loyalty: {
          count: bonuses?.filter(b => b.bonus_type === 'loyalty').length || 0,
          amount: bonuses?.filter(b => b.bonus_type === 'loyalty').reduce((sum, b) => sum + Number(b.amount), 0) || 0,
        },
        promotion: {
          count: bonuses?.filter(b => b.bonus_type === 'promotion').length || 0,
          amount: bonuses?.filter(b => b.bonus_type === 'promotion').reduce((sum, b) => sum + Number(b.amount), 0) || 0,
        },
      },
      by_status: {
        credited: bonuses?.filter(b => b.status === 'credited').length || 0,
        pending: bonuses?.filter(b => b.status === 'pending').length || 0,
        expired: bonuses?.filter(b => b.status === 'expired').length || 0,
        cancelled: bonuses?.filter(b => b.status === 'cancelled').length || 0,
      }
    }

    logger.info('Admin bonus stats fetched', { adminId: user.id, stats })
    return { data: stats }
  } catch (error: any) {
    logger.error('Admin get bonus stats error', { error })
    return handleServerActionError(error)
  }
}
