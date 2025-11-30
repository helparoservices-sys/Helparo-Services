'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth-middleware'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { UserRole } from '@/lib/constants'
import { logger } from '@/lib/logger'

export async function getHelperSubscription() {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    const supabase = await createClient()

    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('id, code, name, description, price_rupees, interval, included_features, commission_discount_percent, extra_radius_km, trial_days')
      .like('code', 'HELPER_%')
      .eq('is_active', true)
      .order('price_rupees')

    if (plansError) {
      logger.error('Failed to fetch subscription plans', { error: plansError })
      return { error: 'Failed to load subscription plans' }
    }

    const { data: subscriptionData } = await supabase
      .rpc('get_helper_subscription_status')

    return {
      data: {
        plans: plans || [],
        subscription: subscriptionData || null,
      },
    }
  } catch (error) {
    logger.error('Get helper subscription error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

export async function subscribeToPllan(planId: string) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    await rateLimit('subscribe-plan', user.id, RATE_LIMITS.API_RELAXED)

    const supabase = await createClient()
    
    const { error } = await supabase.rpc('subscribe_helper', {
      p_plan_id: planId,
    } as any)

    if (error) {
      logger.error('Failed to subscribe', { error })
      return { error: 'Failed to update subscription' }
    }

    revalidatePath('/helper/subscriptions')
    return { success: true }
  } catch (error) {
    logger.error('Subscribe error', { error })
    return { error: 'An unexpected error occurred' }
  }
}
