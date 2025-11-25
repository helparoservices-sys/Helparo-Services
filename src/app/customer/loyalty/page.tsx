'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, Trophy, Gift, TrendingUp, Zap, Crown, Award } from 'lucide-react'

interface LoyaltyTransaction {
  id: string
  points: number
  transaction_type: string
  description: string
  created_at: string
}

export default function CustomerLoyaltyPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState<number>(0)
  const [tier, setTier] = useState<string>('bronze')
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([])
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [redeemAmount, setRedeemAmount] = useState('')
  const [isRedeeming, setIsRedeeming] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Load loyalty data
    const { data: loyaltyData } = await supabase
      .from('loyalty_points')
      .select('points_balance, tier_level')
      .eq('user_id', user.id)
      .single()

    if (loyaltyData) {
      setBalance(loyaltyData.points_balance || 0)
      setTier(loyaltyData.tier_level || 'bronze')
    }

    // Load transactions
    const { data: txData } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    setTransactions(txData || [])
    setLoading(false)
  }

  const handleRedeem = async () => {
    const points = parseInt(redeemAmount)
    if (!points || points < 100 || points > balance) {
      return
    }

    setIsRedeeming(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsRedeeming(false)
      return
    }

    // Create redemption transaction
    const { error } = await supabase
      .from('loyalty_transactions')
      .insert({
        user_id: user.id,
        points: -points,
        transaction_type: 'redemption',
        description: `Redeemed ${points} points for ₹${(points / 100).toFixed(2)} wallet credit`
      })

    if (!error) {
      // Update wallet balance
      await supabase.rpc('increment_wallet_balance', {
        p_user_id: user.id,
        p_amount: points / 100
      })

      setShowRedeemModal(false)
      setRedeemAmount('')
      loadData()
    }

    setIsRedeeming(false)
  }

  const getTierInfo = (tierName: string) => {
    const tiers: Record<string, { name: string; color: string; bgGradient: string; icon: any; min: number; max: number; benefits: string[] }> = {
      bronze: {
        name: 'Bronze',
        color: 'text-amber-700',
        bgGradient: 'from-amber-600 to-amber-500',
        icon: Award,
        min: 0,
        max: 1000,
        benefits: ['Earn 1x points', 'Basic support', 'Standard booking']
      },
      silver: {
        name: 'Silver',
        color: 'text-slate-600',
        bgGradient: 'from-slate-500 to-slate-400',
        icon: Star,
        min: 1000,
        max: 5000,
        benefits: ['Earn 1.5x points', 'Priority support', '5% discount', 'Fast booking']
      },
      gold: {
        name: 'Gold',
        color: 'text-yellow-600',
        bgGradient: 'from-yellow-500 to-yellow-400',
        icon: Trophy,
        min: 5000,
        max: 10000,
        benefits: ['Earn 2x points', 'Premium support', '10% discount', 'Free upgrades', 'Priority matching']
      },
      platinum: {
        name: 'Platinum',
        color: 'text-purple-600',
        bgGradient: 'from-purple-600 to-pink-500',
        icon: Crown,
        min: 10000,
        max: Infinity,
        benefits: ['Earn 3x points', '24/7 VIP support', '15% discount', 'All upgrades free', 'Exclusive deals', 'Dedicated manager']
      }
    }
    return tiers[tierName.toLowerCase()] || tiers.bronze
  }

  const currentTier = getTierInfo(tier)
  const tiers = ['bronze', 'silver', 'gold', 'platinum']
  const currentIndex = tiers.indexOf(tier.toLowerCase())
  const nextTier = currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null
  const nextTierInfo = nextTier ? getTierInfo(nextTier) : null
  const progressToNextTier = nextTierInfo ? Math.min(((balance - currentTier.min) / (nextTierInfo.min - currentTier.min)) * 100, 100) : 100

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading loyalty data...</p>
        </div>
      </div>
    )
  }

  const TierIcon = currentTier.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Loyalty Rewards</h1>
          <p className="text-slate-600 dark:text-slate-400">Earn points and unlock exclusive benefits</p>
        </div>
        <button
          onClick={() => setShowRedeemModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Gift className="h-5 w-5" />
          Redeem Points
        </button>
      </div>

      {/* Tier Status Card */}
      <div className={`bg-gradient-to-r ${currentTier.bgGradient} rounded-xl p-8 text-white shadow-lg`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <TierIcon className="h-10 w-10" />
            </div>
            <div>
              <p className="text-sm opacity-90">Current Tier</p>
              <h2 className="text-3xl font-bold">{currentTier.name}</h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Available Points</p>
            <p className="text-4xl font-bold">{balance.toLocaleString()}</p>
          </div>
        </div>

        {nextTierInfo && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="opacity-90">Progress to {nextTierInfo.name}</span>
              <span className="font-semibold">{(nextTierInfo.min - balance).toLocaleString()} points needed</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white/40 backdrop-blur-sm transition-all duration-500"
                style={{ width: `${progressToNextTier}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* All Tiers Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((tierKey) => {
          const tierData = getTierInfo(tierKey)
          const TierIconComp = tierData.icon
          const isActive = tierKey === tier.toLowerCase()
          const isLocked = tiers.indexOf(tierKey) > currentIndex

          return (
            <div
              key={tierKey}
              className={`bg-white dark:bg-slate-800 rounded-xl p-6 border-2 transition-all ${
                isActive 
                  ? 'border-blue-500 shadow-lg scale-105' 
                  : isLocked
                  ? 'border-slate-200 dark:border-slate-700 opacity-60'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <TierIconComp className={`h-8 w-8 ${tierData.color}`} />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{tierData.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {tierData.min.toLocaleString()}+ points
                  </p>
                </div>
              </div>

              <ul className="space-y-2">
                {tierData.benefits.slice(0, 3).map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              {isActive && (
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Active Tier</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Earn More Points */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3 mb-4">
          <Zap className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Earn More Points</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-600">+50</span>
                <span className="text-slate-600 dark:text-slate-400">Complete a booking</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-600">+100</span>
                <span className="text-slate-600 dark:text-slate-400">Leave a review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-600">+200</span>
                <span className="text-slate-600 dark:text-slate-400">Refer a friend</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h2>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No transactions yet</p>
            <p className="text-sm mt-1">Start earning points by completing services!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">{txn.description}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(txn.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${txn.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {txn.points > 0 ? '+' : ''}{txn.points}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{txn.transaction_type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Redeem Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Redeem Points</h2>
              <button
                onClick={() => setShowRedeemModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                  <strong>Exchange Rate:</strong> 100 points = ₹1.00
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Minimum redemption: 100 points (₹1.00)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Points to Redeem
                </label>
                <input
                  type="number"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  placeholder="100"
                  min="100"
                  max={balance}
                  step="100"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
                {redeemAmount && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    = ₹{(parseInt(redeemAmount) / 100).toFixed(2)} wallet credit
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRedeemModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  disabled={isRedeeming}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRedeem}
                  disabled={isRedeeming || !redeemAmount || parseInt(redeemAmount) < 100 || parseInt(redeemAmount) > balance}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRedeeming ? 'Processing...' : 'Redeem Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
