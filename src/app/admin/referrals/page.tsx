'use server'
import { createClient } from '@/lib/supabase/server'
import { ReferralsPageClient } from '@/components/admin/referrals-page-client'

export default async function AdminReferralsPage() {
  const supabase = await createClient()

  // Fetch referrals with user profile information
  const { data: referralsData } = await supabase
    .from('referrals')
    .select(`
      id,
      referrer_id,
      referred_user_id,
      referral_code,
      status,
      created_at,
      converted_at,
      rewarded_at,
      referrer:referrer_id (
        id,
        full_name,
        email,
        avatar_url
      ),
      referred_user:referred_user_id (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  // Calculate statistics
  const referrals = Array.isArray(referralsData) ? referralsData : []
  
  const stats = {
    totalReferrals: referrals.length,
    convertedReferrals: referrals.filter(r => r.status === 'converted' || r.status === 'rewarded').length,
    rewardedReferrals: referrals.filter(r => r.status === 'rewarded').length,
    conversionRate: referrals.length > 0 
      ? Math.round((referrals.filter(r => r.status === 'converted' || r.status === 'rewarded').length / referrals.length) * 100) 
      : 0
  }

  return <ReferralsPageClient referrals={referrals} stats={stats} />
}
