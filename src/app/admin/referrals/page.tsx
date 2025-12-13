'use server'
import { createClient } from '@/lib/supabase/server'
import { ReferralsPageClient } from '@/components/admin/referrals-page-client'

export default async function AdminReferralsPage() {
  const supabase = await createClient()

  // Fetch referrals
  const { data: referralsData } = await supabase
    .from('referrals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const rawReferrals = Array.isArray(referralsData) ? referralsData : []
  
  // Get unique user IDs to fetch profiles
  const userIds = new Set<string>()
  rawReferrals.forEach(ref => {
    if (ref.referrer_id) userIds.add(ref.referrer_id)
    if (ref.referred_user_id) userIds.add(ref.referred_user_id)
  })

  // Fetch all relevant profiles
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .in('id', Array.from(userIds))

  // Create a map for quick lookup
  const profilesMap = new Map<string, { id: string; full_name: string; email: string; avatar_url: string | null }>()
  if (profilesData) {
    profilesData.forEach(p => profilesMap.set(p.id, p))
  }

  // Transform referrals with profile data
  const referrals = rawReferrals.map(ref => ({
    id: ref.id,
    referrer_id: ref.referrer_id,
    referred_user_id: ref.referred_user_id,
    referral_code: ref.referral_code,
    status: ref.status,
    created_at: ref.created_at,
    converted_at: ref.converted_at,
    rewarded_at: ref.rewarded_at,
    referrer: profilesMap.get(ref.referrer_id) || { id: ref.referrer_id, full_name: 'Unknown', email: '', avatar_url: null },
    referred_user: ref.referred_user_id 
      ? (profilesMap.get(ref.referred_user_id) || { id: ref.referred_user_id, full_name: 'Unknown', email: '', avatar_url: null })
      : { id: '', full_name: 'Not yet', email: '', avatar_url: null }
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
