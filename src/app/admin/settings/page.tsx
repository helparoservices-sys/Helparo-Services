'use server'
import { createClient } from '@/lib/supabase/server'
import { SettingsPageClient } from '@/components/admin/settings-page-client'

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  // Fetch current commission settings with all fields
  const { data: commissionData } = await supabase
    .from('commission_settings')
    .select(`
      percent,
      surge_multiplier,
      service_radius_km,
      emergency_radius_km,
      min_withdrawal_amount,
      auto_payout_threshold,
      updated_at
    `)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Fetch gamification settings
  const { data: gamificationData } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'gamification_config')
    .single()

  // Fetch subscription plans count
  const { count: helperSubscriptions } = await supabase
    .from('helper_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Note: Customers don't have subscriptions in current schema
  // Only helpers have subscription plans for reduced commission
  const customerSubscriptions = 0

  // Fetch platform stats for settings context
  const { count: totalHelpers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'helper')

  const { count: totalCustomers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer')

  // Default values if no data exists
  const defaultCommission = {
    percent: 12,
    surge_multiplier: 1.5,
    service_radius_km: 10,
    emergency_radius_km: 20,
    min_withdrawal_amount: 100,
    auto_payout_threshold: 1000
  }

  const defaultGamification = {
    enableBadges: true,
    enableLoyaltyPoints: true,
    showLeaderboard: true
  }

  const settings = {
    commission: {
      current: commissionData?.percent || defaultCommission.percent,
      lastUpdated: commissionData?.updated_at || new Date().toISOString()
    },
    subscriptions: {
      helperPro: helperSubscriptions || 0,
      customerPremium: customerSubscriptions || 0
    },
    platform: {
      totalHelpers: totalHelpers || 0,
      totalCustomers: totalCustomers || 0
    },
    // Include all settings values for the client
    allSettings: {
      commission: commissionData?.percent || defaultCommission.percent,
      surgeMultiplier: commissionData?.surge_multiplier || defaultCommission.surge_multiplier,
      serviceRadius: commissionData?.service_radius_km || defaultCommission.service_radius_km,
      emergencyRadius: commissionData?.emergency_radius_km || defaultCommission.emergency_radius_km,
      minWithdrawal: commissionData?.min_withdrawal_amount || defaultCommission.min_withdrawal_amount,
      autoPayoutThreshold: commissionData?.auto_payout_threshold || defaultCommission.auto_payout_threshold,
      gamification: gamificationData?.value || defaultGamification
    }
  }

  return <SettingsPageClient settings={settings} />
}
