'use server'

import { requireAuth } from '@/lib/auth-middleware'
import { UserRole } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

export async function getHelperReferrals() {
  try {
    const user = await requireAuth(UserRole.HELPER)
    const supabase = await createClient()

    // Get referral stats
    const { data: referrals, error: refError } = await supabase
      .from('referrals')
      .select('id, referred_email, status, bonus_amount, created_at')
      .eq('referrer_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (refError) {
      logger.error('Failed to fetch referrals', { error: refError, userId: user.id })
      return { error: 'Failed to load referrals' }
    }

    // Calculate stats
    const totalReferrals = referrals?.length || 0
    const successfulReferrals = referrals?.filter(r => r.status === 'completed').length || 0
    const pendingEarnings = referrals
      ?.filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + (r.bonus_amount || 0), 0) || 0
    const totalEarned = referrals
      ?.filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.bonus_amount || 0), 0) || 0

    // Get or generate referral code
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single()

    let referralCode = (profile as any)?.referral_code

    if (!referralCode) {
      // Generate referral code
      referralCode = `HELPER${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      await supabase
        .from('profiles')
        .update({ referral_code: referralCode })
        .eq('id', user.id)
    }

    return {
      data: {
        stats: {
          total_referrals: totalReferrals,
          successful_referrals: successfulReferrals,
          pending_earnings: pendingEarnings,
          total_earned: totalEarned,
          referral_code: referralCode,
        },
        referrals: referrals || [],
      },
    }
  } catch (error) {
    logger.error('Error in getHelperReferrals', { error })
    return { error: 'An unexpected error occurred' }
  }
}

export async function generateReferralLink() {
  try {
    const user = await requireAuth(UserRole.HELPER)
    const supabase = await createClient()

    // Get referral code
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single()

    let referralCode = (profile as any)?.referral_code

    if (!referralCode) {
      referralCode = `HELPER${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      await supabase
        .from('profiles')
        .update({ referral_code: referralCode })
        .eq('id', user.id)
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://helparo.com'
    const referralLink = `${baseUrl}/signup?ref=${referralCode}`

    return {
      data: {
        link: referralLink,
      },
    }
  } catch (error) {
    logger.error('Error in generateReferralLink', { error })
    return { error: 'Failed to generate referral link' }
  }
}
