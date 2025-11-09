'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth-middleware'
import { handleServerActionError } from '@/lib/errors'
import { sanitizeText, sanitizeHTML } from '@/lib/sanitize'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { UserRole } from '@/lib/constants'
import { logger } from '@/lib/logger'

/**
 * Server Actions for Gamification (Migration 022)
 * Tables: badge_definitions, user_badges, achievements, user_achievements, loyalty_points, loyalty_transactions
 */

// ============================================
// BADGES
// ============================================

export async function createBadgeDefinition(formData: FormData) {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)
    await rateLimit('create-badge', user.id, RATE_LIMITS.ADMIN_APPROVE)

    const name = sanitizeText(formData.get('name') as string)
    const description = sanitizeText(formData.get('description') as string)
    const iconUrl = sanitizeText(formData.get('icon_url') as string)
    const badgeType = sanitizeText(formData.get('badge_type') as string)
    const requirement = parseInt(formData.get('requirement') as string)
    const points = parseInt(formData.get('points') as string)

    if (!name || !description || isNaN(requirement) || isNaN(points)) {
      return { error: 'Invalid input data' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('badge_definitions')
      .insert({
        name,
        description,
        icon_url: iconUrl,
        badge_type: badgeType,
        requirement,
        points_reward: points
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/gamification')
    logger.info('Badge definition created', { adminId: user.id, badgeName: name })
    return { success: true, badge: data }
  } catch (error: any) {
    logger.error('Create badge definition error', { error })
    return handleServerActionError(error)
  }
}

export async function awardBadgeToUser(userId: string, badgeId: string) {
  try {
    // Internal function - auth check at call site
    const supabase = await createClient()

    // Check if user already has this badge
    const { data: existing } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', badgeId)
      .maybeSingle()

    if (existing) {
      return { error: 'User already has this badge' }
    }

    // Get badge details
    const { data: badge } = await supabase
      .from('badge_definitions')
      .select('name, points_reward')
      .eq('id', badgeId)
      .single()

    if (!badge) {
      return { error: 'Badge not found' }
    }

    // Award badge
    const { data: userBadge, error } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badgeId
      })
      .select()
      .single()

    if (error) throw error

    // Award loyalty points
    if (badge.points_reward > 0) {
      await addLoyaltyPoints(userId, badge.points_reward, 'badge_earned', `Earned ${badge.name} badge`)
    }

    revalidatePath(`/customer/profile`)
    revalidatePath(`/helper/profile`)
    logger.info('Badge awarded to user', { userId, badgeId, badgeName: badge.name })
    return { success: true, userBadge }
  } catch (error: any) {
    logger.error('Award badge error', { error })
    return handleServerActionError(error)
  }
}

export async function getUserBadges(userId: string) {
  const supabase = await createClient()

  try {
    await rateLimit('get-user-badges', userId, RATE_LIMITS.API_MODERATE)

    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badge_definitions(
          name,
          description,
          icon_url,
          badge_type,
          points_reward
        )
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })

    if (error) throw error

    return { success: true, badges: data }
  } catch (error: any) {
    logger.error('Get user badges error', { error })
    return handleServerActionError(error)
  }
}

// ============================================
// ACHIEVEMENTS
// ============================================

export async function createAchievement(formData: FormData) {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)
    await rateLimit('create-achievement', user.id, RATE_LIMITS.ADMIN_APPROVE)

    const title = sanitizeText(formData.get('title') as string)
    const description = sanitizeText(formData.get('description') as string)
    const iconUrl = sanitizeText(formData.get('icon_url') as string)
    const category = sanitizeText(formData.get('category') as string)
    const targetValue = parseInt(formData.get('target_value') as string)
    const points = parseInt(formData.get('points') as string)

    if (!title || !description || isNaN(targetValue) || isNaN(points)) {
      return { error: 'Invalid input data' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('achievements')
      .insert({
        title,
        description,
        icon_url: iconUrl,
        category,
        target_value: targetValue,
        points_reward: points
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/gamification')
    logger.info('Achievement created', { adminId: user.id, achievementTitle: title })
    return { success: true, achievement: data }
  } catch (error: any) {
    logger.error('Create achievement error', { error })
    return handleServerActionError(error)
  }
}

export async function updateUserAchievementProgress(userId: string, achievementId: string, currentValue: number) {
  try {
    // Internal function - typically called by system
    const supabase = await createClient()

    // Get achievement details
    const { data: achievement } = await supabase
      .from('achievements')
      .select('target_value, points_reward, title')
      .eq('id', achievementId)
      .single()

    if (!achievement) {
      return { error: 'Achievement not found' }
    }

    // Check if user achievement record exists
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .maybeSingle()

    const progressPercent = Math.min((currentValue / achievement.target_value) * 100, 100)
    const isCompleted = currentValue >= achievement.target_value

    if (existing) {
      // Don't update if already completed
      if (existing.is_completed) {
        return { success: true, userAchievement: existing }
      }

      // Update progress
      const { data: updated, error } = await supabase
        .from('user_achievements')
        .update({
          current_value: currentValue,
          progress_percent: progressPercent,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error

      // Award points if completed
      if (isCompleted && !existing.is_completed) {
        await addLoyaltyPoints(userId, achievement.points_reward, 'achievement_completed', `Completed ${achievement.title}`)
        logger.info('Achievement completed', { userId, achievementId, title: achievement.title })
      }

      revalidatePath(`/customer/achievements`)
      revalidatePath(`/helper/achievements`)
      return { success: true, userAchievement: updated }
    } else {
      // Create new progress record
      const { data: newRecord, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievementId,
          current_value: currentValue,
          progress_percent: progressPercent,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .select()
        .single()

      if (error) throw error

      // Award points if completed
      if (isCompleted) {
        await addLoyaltyPoints(userId, achievement.points_reward, 'achievement_completed', `Completed ${achievement.title}`)
        logger.info('Achievement completed', { userId, achievementId, title: achievement.title })
      }

      revalidatePath(`/customer/achievements`)
      revalidatePath(`/helper/achievements`)
      return { success: true, userAchievement: newRecord }
    }
  } catch (error: any) {
    logger.error('Update user achievement progress error', { error })
    return handleServerActionError(error)
  }
}

export async function getUserAchievements(userId: string) {
  const supabase = await createClient()

  try {
    await rateLimit('get-user-achievements', userId, RATE_LIMITS.API_MODERATE)

    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(
          title,
          description,
          icon_url,
          category,
          target_value,
          points_reward
        )
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false, nullsFirst: false })

    if (error) throw error

    return { success: true, achievements: data }
  } catch (error: any) {
    logger.error('Get user achievements error', { error })
    return handleServerActionError(error)
  }
}

// ============================================
// LOYALTY POINTS
// ============================================

export async function addLoyaltyPoints(userId: string, points: number, transactionType: string, description: string) {
  try {
    // Internal function - typically called by system
    const supabase = await createClient()

    // Sanitize description
    const safeDescription = sanitizeText(description)

    // Get or create loyalty account
    let { data: account } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (!account) {
      const { data: newAccount, error: createError } = await supabase
        .from('loyalty_points')
        .insert({
          user_id: userId,
          current_balance: 0,
          lifetime_earned: 0,
          lifetime_spent: 0
        })
        .select()
        .single()

      if (createError) throw createError
      account = newAccount
    }

    // Update balance
    const { error: updateError } = await supabase
      .from('loyalty_points')
      .update({
        current_balance: account.current_balance + points,
        lifetime_earned: account.lifetime_earned + points
      })
      .eq('user_id', userId)

    if (updateError) throw updateError

    // Record transaction
    const { data: transaction, error: txError } = await supabase
      .from('loyalty_transactions')
      .insert({
        user_id: userId,
        points_change: points,
        transaction_type: transactionType,
        description: safeDescription,
        balance_after: account.current_balance + points
      })
      .select()
      .single()

    if (txError) throw txError

    revalidatePath(`/customer/loyalty`)
    revalidatePath(`/helper/loyalty`)
    logger.info('Loyalty points added', { userId, points, type: transactionType })
    return { success: true, transaction }
  } catch (error: any) {
    logger.error('Add loyalty points error', { error })
    return handleServerActionError(error)
  }
}

export async function redeemLoyaltyPoints(formData: FormData) {
  try {
    const { user } = await requireAuth()
    await rateLimit('redeem-loyalty-points', user.id, RATE_LIMITS.PAYMENT_ACTION)

    const points = parseInt(formData.get('points') as string)
    const redemptionType = sanitizeText(formData.get('redemption_type') as string)
    const description = sanitizeText(formData.get('description') as string)

    if (isNaN(points) || points <= 0) {
      return { error: 'Invalid points amount' }
    }

    const supabase = await createClient()

    // Get loyalty account
    const { data: account } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!account || account.current_balance < points) {
      return { error: 'Insufficient loyalty points' }
    }

    // Deduct points
    const { error: updateError } = await supabase
      .from('loyalty_points')
      .update({
        current_balance: account.current_balance - points,
        lifetime_spent: account.lifetime_spent + points
      })
      .eq('user_id', user.id)

    if (updateError) throw updateError

    // Record transaction
    const { data: transaction, error: txError } = await supabase
      .from('loyalty_transactions')
      .insert({
        user_id: user.id,
        points_change: -points,
        transaction_type: redemptionType,
        description,
        balance_after: account.current_balance - points
      })
      .select()
      .single()

    if (txError) throw txError

    revalidatePath(`/customer/loyalty`)
    revalidatePath(`/helper/loyalty`)
    logger.info('Loyalty points redeemed', { userId: user.id, points, type: redemptionType })
    return { success: true, transaction }
  } catch (error: any) {
    logger.error('Redeem loyalty points error', { error })
    return handleServerActionError(error)
  }
}

export async function getLoyaltyBalance(userId: string) {
  const supabase = await createClient()

  try {
    await rateLimit('get-loyalty-balance', userId, RATE_LIMITS.API_MODERATE)

    const { data, error } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error

    return { success: true, balance: data }
  } catch (error: any) {
    logger.error('Get loyalty balance error', { error })
    return handleServerActionError(error)
  }
}

export async function getLoyaltyTransactions(userId: string, limit = 50) {
  const supabase = await createClient()

  try {
    await rateLimit('get-loyalty-transactions', userId, RATE_LIMITS.API_MODERATE)

    const { data, error } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, transactions: data }
  } catch (error: any) {
    logger.error('Get loyalty transactions error', { error })
    return handleServerActionError(error)
  }
}

// ============================================
// AUTO-AWARD HELPERS
// ============================================

export async function checkAndAwardJobMilestones(helperId: string) {
  try {
    // Internal function - typically called by system after job completion
    const supabase = await createClient()

    // Get completed jobs count
    const { count: completedJobs } = await supabase
      .from('service_requests')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_helper_id', helperId)
      .eq('status', 'completed')

    // Check for milestone badges
    const milestones = [
      { jobs: 1, badgeName: 'First Job', points: 50 },
      { jobs: 10, badgeName: '10 Jobs', points: 100 },
      { jobs: 50, badgeName: '50 Jobs', points: 500 },
      { jobs: 100, badgeName: '100 Jobs', points: 1000 },
      { jobs: 500, badgeName: '500 Jobs', points: 5000 },
    ]

    for (const milestone of milestones) {
      if (completedJobs && completedJobs >= milestone.jobs) {
        // Check if badge exists
        const { data: badge } = await supabase
          .from('badge_definitions')
          .select('id')
          .eq('name', milestone.badgeName)
          .maybeSingle()

        if (badge) {
          await awardBadgeToUser(helperId, badge.id)
        }
      }
    }

    logger.info('Job milestones checked', { helperId, completedJobs })
    return { success: true }
  } catch (error: any) {
    logger.error('Check and award job milestones error', { error })
    return handleServerActionError(error)
  }
}
