'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Server Actions for Gamification (Migration 022)
 * Tables: badge_definitions, user_badges, achievements, user_achievements, loyalty_points, loyalty_transactions
 */

// ============================================
// BADGES
// ============================================

export async function createBadgeDefinition(formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const iconUrl = formData.get('icon_url') as string
  const badgeType = formData.get('badge_type') as string
  const requirement = parseInt(formData.get('requirement') as string)
  const points = parseInt(formData.get('points') as string)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

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
    return { success: true, badge: data }
  } catch (error: any) {
    console.error('Create badge definition error:', error)
    return { error: error.message }
  }
}

export async function awardBadgeToUser(userId: string, badgeId: string) {
  const supabase = await createClient()

  try {
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
    return { success: true, userBadge }
  } catch (error: any) {
    console.error('Award badge error:', error)
    return { error: error.message }
  }
}

export async function getUserBadges(userId: string) {
  const supabase = await createClient()

  try {
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
    console.error('Get user badges error:', error)
    return { error: error.message }
  }
}

// ============================================
// ACHIEVEMENTS
// ============================================

export async function createAchievement(formData: FormData) {
  const supabase = await createClient()
  
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const iconUrl = formData.get('icon_url') as string
  const category = formData.get('category') as string
  const targetValue = parseInt(formData.get('target_value') as string)
  const points = parseInt(formData.get('points') as string)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

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
    return { success: true, achievement: data }
  } catch (error: any) {
    console.error('Create achievement error:', error)
    return { error: error.message }
  }
}

export async function updateUserAchievementProgress(userId: string, achievementId: string, currentValue: number) {
  const supabase = await createClient()

  try {
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
      }

      revalidatePath(`/customer/achievements`)
      revalidatePath(`/helper/achievements`)
      return { success: true, userAchievement: newRecord }
    }
  } catch (error: any) {
    console.error('Update user achievement progress error:', error)
    return { error: error.message }
  }
}

export async function getUserAchievements(userId: string) {
  const supabase = await createClient()

  try {
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
    console.error('Get user achievements error:', error)
    return { error: error.message }
  }
}

// ============================================
// LOYALTY POINTS
// ============================================

export async function addLoyaltyPoints(userId: string, points: number, transactionType: string, description: string) {
  const supabase = await createClient()

  try {
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
        description,
        balance_after: account.current_balance + points
      })
      .select()
      .single()

    if (txError) throw txError

    revalidatePath(`/customer/loyalty`)
    revalidatePath(`/helper/loyalty`)
    return { success: true, transaction }
  } catch (error: any) {
    console.error('Add loyalty points error:', error)
    return { error: error.message }
  }
}

export async function redeemLoyaltyPoints(formData: FormData) {
  const supabase = await createClient()
  
  const points = parseInt(formData.get('points') as string)
  const redemptionType = formData.get('redemption_type') as string
  const description = formData.get('description') as string

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

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
    return { success: true, transaction }
  } catch (error: any) {
    console.error('Redeem loyalty points error:', error)
    return { error: error.message }
  }
}

export async function getLoyaltyBalance(userId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error

    return { success: true, balance: data }
  } catch (error: any) {
    console.error('Get loyalty balance error:', error)
    return { error: error.message }
  }
}

export async function getLoyaltyTransactions(userId: string, limit = 50) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, transactions: data }
  } catch (error: any) {
    console.error('Get loyalty transactions error:', error)
    return { error: error.message }
  }
}

// ============================================
// AUTO-AWARD HELPERS
// ============================================

export async function checkAndAwardJobMilestones(helperId: string) {
  const supabase = await createClient()

  try {
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

    return { success: true }
  } catch (error: any) {
    console.error('Check and award job milestones error:', error)
    return { error: error.message }
  }
}
