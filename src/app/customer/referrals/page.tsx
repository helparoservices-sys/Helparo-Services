'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Gift, Users, Copy, Check, TrendingUp, Award } from 'lucide-react'

interface Referral {
  id: string
  referred_user_id: string | null
  referral_code: string
  status: string
  created_at: string
  converted_at: string | null
}

interface Reward {
  id: string
  reward_type: string
  amount_paise: number | null
  status: string
  granted_at: string | null
}

export default function CustomerReferralsPage() {
  const supabase = createClient()
  const [referralCode, setReferralCode] = useState('')
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadReferralData()
  }, [])

  const loadReferralData = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Generate referral code from user ID (first 8 chars)
    const code = `HELP${user.id.substring(0, 8).toUpperCase()}`
    setReferralCode(code)

    // Load referrals
    const { data: refData } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    setReferrals(refData || [])

    // Load rewards
    const { data: rewardData } = await supabase
      .from('referral_rewards')
      .select('*')
      .eq('referrer_id', user.id)
      .order('granted_at', { ascending: false })

    setRewards(rewardData || [])

    setLoading(false)
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth/signup?ref=${referralCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatAmount = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(paise / 100)
  }

  const convertedCount = referrals.filter(r => r.status === 'converted' || r.status === 'rewarded').length
  const totalEarned = rewards
    .filter(r => r.status === 'granted' && r.amount_paise)
    .reduce((sum, r) => sum + (r.amount_paise || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading referrals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Refer & Earn</h1>
        <p className="text-slate-600 dark:text-slate-400">Share Helparo with friends and earn rewards</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium opacity-90">Total Referrals</span>
          </div>
          <p className="text-4xl font-bold">{referrals.length}</p>
          <p className="text-sm opacity-75 mt-2">Friends invited</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium opacity-90">Successful</span>
          </div>
          <p className="text-4xl font-bold">{convertedCount}</p>
          <p className="text-sm opacity-75 mt-2">Conversions</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Award className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium opacity-90">Total Earned</span>
          </div>
          <p className="text-4xl font-bold">{formatAmount(totalEarned)}</p>
          <p className="text-sm opacity-75 mt-2">In rewards</p>
        </div>
      </div>

      {/* Referral Code Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white shadow-lg">
        <div className="text-center max-w-2xl mx-auto">
          <Gift className="h-16 w-16 mx-auto mb-4 opacity-90" />
          <h2 className="text-2xl font-bold mb-2">Your Referral Code</h2>
          <p className="text-blue-100 mb-6">Share this code with friends to earn rewards</p>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center gap-4">
              <span className="text-3xl font-mono font-bold tracking-wider">{referralCode}</span>
              <button
                onClick={copyReferralCode}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Copy code"
              >
                {copied ? (
                  <Check className="h-6 w-6 text-green-300" />
                ) : (
                  <Copy className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={copyReferralLink}
            className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all"
          >
            Copy Referral Link
          </button>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Share Your Code</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Send your unique referral code to friends</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-blue-600">2</span>
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">They Sign Up</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Friends register using your code</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-blue-600">3</span>
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Earn Rewards</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Get wallet credits when they book services</p>
          </div>
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Referral History</h2>

        {referrals.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No referrals yet</p>
            <p className="text-sm mt-1">Start sharing your code to earn rewards!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((ref) => (
              <div
                key={ref.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {ref.referred_user_id ? 'User Joined' : 'Pending'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(ref.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  ref.status === 'rewarded' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  ref.status === 'converted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {ref.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rewards History */}
      {rewards.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Rewards Earned</h2>
          <div className="space-y-3">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white capitalize">
                    {reward.reward_type.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {reward.granted_at 
                      ? new Date(reward.granted_at).toLocaleDateString('en-IN')
                      : 'Pending'}
                  </p>
                </div>
                <div className="text-right">
                  {reward.amount_paise && (
                    <p className="font-bold text-green-600">{formatAmount(reward.amount_paise)}</p>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    reward.status === 'granted' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {reward.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
