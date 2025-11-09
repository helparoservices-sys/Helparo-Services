'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'
import { UserRole } from '@/lib/constants'
import { handleServerActionError } from '@/lib/errors'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function subscribeHelper(planId: string) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    await rateLimit('subscribe-helper', user.id, RATE_LIMITS.PAYMENT_ACTION)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('subscribe_helper', { p_plan_id: planId } as any)
    
    if (error) throw error

    logger.info('Helper subscribed', { userId: user.id, planId })
    return { data }
  } catch (error: any) {
    logger.error('Subscribe helper error', { error })
    return handleServerActionError(error)
  }
}

export async function cancelSubscription() {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    await rateLimit('cancel-subscription', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('cancel_subscription')
    
    if (error) throw error

    logger.info('Subscription cancelled', { userId: user.id })
    return { data }
  } catch (error: any) {
    logger.error('Cancel subscription error', { error })
    return handleServerActionError(error)
  }
}

export async function getSubscriptionStatus() {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    await rateLimit('get-subscription-status', user.id, RATE_LIMITS.API_RELAXED)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_helper_subscription_status')
    
    if (error) throw error

    return { data }
  } catch (error: any) {
    logger.error('Get subscription status error', { error })
    return handleServerActionError(error)
  }
}

