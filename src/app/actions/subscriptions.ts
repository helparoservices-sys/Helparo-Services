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

// Admin functions
export async function createSubscriptionPlan(input: {
  code: string
  name: string
  description: string
  interval: 'monthly' | 'quarterly' | 'yearly'
  price_rupees: number
  commission_discount_percent?: number
  extra_radius_km?: number
  priority_level?: number
  features?: string[]
  trial_days?: number
}) {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)
    await rateLimit('create-subscription-plan', user.id, RATE_LIMITS.ADMIN_APPROVE)

    const supabase = await createClient()
    
    const { data, error } = await supabase.rpc('create_subscription_plan', {
      p_code: input.code,
      p_name: input.name,
      p_description: input.description,
      p_interval: input.interval,
      p_price_rupees: input.price_rupees,
      p_commission_discount_percent: input.commission_discount_percent || null,
      p_extra_radius_km: input.extra_radius_km || null,
      p_priority_level: input.priority_level || 0,
      p_features: input.features || [],
      p_trial_days: input.trial_days || 0,
    } as any)
    
    if (error) throw error

    logger.info('Subscription plan created', { adminId: user.id, code: input.code })
    return { success: true, planId: data }
  } catch (error: any) {
    logger.error('Create subscription plan error', { error })
    return handleServerActionError(error)
  }
}

export async function updateSubscriptionPlan(planId: string, input: {
  name?: string
  description?: string
  price_rupees?: number
  commission_discount_percent?: number
  extra_radius_km?: number
  priority_level?: number
  is_active?: boolean
}) {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)
    await rateLimit('update-subscription-plan', user.id, RATE_LIMITS.ADMIN_APPROVE)

    const supabase = await createClient()
    
    const updates: any = {}
    if (input.name !== undefined) updates.name = input.name
    if (input.description !== undefined) updates.description = input.description
    if (input.price_rupees !== undefined) updates.price_rupees = input.price_rupees
    if (input.commission_discount_percent !== undefined) updates.commission_discount_percent = input.commission_discount_percent
    if (input.extra_radius_km !== undefined) updates.extra_radius_km = input.extra_radius_km
    if (input.priority_level !== undefined) updates.priority_level = input.priority_level
    if (input.is_active !== undefined) updates.is_active = input.is_active

    const { error } = await supabase
      .from('subscription_plans')
      .update(updates)
      .eq('id', planId)
    
    if (error) throw error

    logger.info('Subscription plan updated', { adminId: user.id, planId })
    return { success: true }
  } catch (error: any) {
    logger.error('Update subscription plan error', { error })
    return handleServerActionError(error)
  }
}

export async function deleteSubscriptionPlan(planId: string) {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)
    await rateLimit('delete-subscription-plan', user.id, RATE_LIMITS.ADMIN_APPROVE)

    const supabase = await createClient()
    
    // Check if any active subscriptions exist
    const { data: activeSubscriptions } = await supabase
      .from('helper_subscriptions')
      .select('id')
      .eq('plan_id', planId)
      .in('status', ['active', 'pending', 'past_due'])
      .limit(1)

    if (activeSubscriptions && activeSubscriptions.length > 0) {
      return { error: 'Cannot delete plan with active subscriptions. Deactivate instead.' }
    }

    const { error } = await supabase
      .from('subscription_plans')
      .delete()
      .eq('id', planId)
    
    if (error) throw error

    logger.info('Subscription plan deleted', { adminId: user.id, planId })
    return { success: true }
  } catch (error: any) {
    logger.error('Delete subscription plan error', { error })
    return handleServerActionError(error)
  }
}

export async function getAllSubscriptionPlans() {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)
    await rateLimit('get-all-plans', user.id, RATE_LIMITS.API_RELAXED)

    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price_rupees', { ascending: true })
    
    if (error) throw error

    return { success: true, plans: data }
  } catch (error: any) {
    logger.error('Get all subscription plans error', { error })
    return handleServerActionError(error)
  }
}
