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
  const rawReferrals = Array.isArray(referralsData) ? referralsData : []
  
  // Transform referrals to flatten user profiles from array to object
  const referrals = rawReferrals.map(ref => ({
    id: ref.id,
    referrer_id: ref.referrer_id,
    referred_user_id: ref.referred_user_id,
    referral_code: ref.referral_code,
    status: ref.status,
    created_at: ref.created_at,
    converted_at: ref.converted_at,
    rewarded_at: ref.rewarded_at,
    referrer: Array.isArray(ref.referrer) && ref.referrer.length > 0
      ? ref.referrer[0]
      : { id: ref.referrer_id, full_name: 'Unknown', email: '', avatar_url: null },
    referred_user: Array.isArray(ref.referred_user) && ref.referred_user.length > 0
      ? ref.referred_user[0]
      : { id: ref.referred_user_id, full_name: 'Unknown', email: '', avatar_url: null }
  }))
  
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
