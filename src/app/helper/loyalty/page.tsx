'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getLoyaltyBalance, getLoyaltyTransactions, redeemLoyaltyPoints } from '@/app/actions/gamification'

interface LoyaltyTransaction {
  id: string
  points: number
  transaction_type: string
  description: string
  created_at: string
}

export default function HelperLoyaltyPage() {
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState<number>(0)
  const [tier, setTier] = useState<string>('bronze')
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([])
  const [error, setError] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [redeemAmount, setRedeemAmount] = useState('')
  const [redeemDescription, setRedeemDescription] = useState('Withdraw to wallet')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')

    const { supabase } = await import('@/lib/supabase/client')
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const [balanceRes, transactionsRes] = await Promise.all([
      getLoyaltyBalance(user.id),
      getLoyaltyTransactions(user.id, 50)
    ])

    if ('error' in balanceRes && balanceRes.error) {
      setError(balanceRes.error)
    } else if ('balance' in balanceRes) {
      const points = balanceRes.balance || 0
      setBalance(points)
      // Calculate tier based on balance
      if (points >= 10000) setTier('platinum')
      else if (points >= 5000) setTier('gold')
      else if (points >= 1000) setTier('silver')
      else setTier('bronze')
    }

    if ('error' in transactionsRes && transactionsRes.error) {
      setError(transactionsRes.error)
      } else if ('transactions' in transactionsRes) {
      setTransactions(transactionsRes.transactions || [])
    }

    setLoading(false)
  }

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()
    const points = parseInt(redeemAmount)
    
    if (!points || points <= 0) {
      setError('Invalid points amount')
      return
    }

    if (points > balance) {
      setError('Insufficient points')
      return
    }

    setRedeeming(true)
    setError('')

    const formData = new FormData()
    formData.append('points', points.toString())
    formData.append('description', redeemDescription)

    const result = await redeemLoyaltyPoints(formData)

    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      setRedeemAmount('')
      await loadData()
    }

    setRedeeming(false)
  }

  const getTierInfo = (tierName: string) => {
    const tiers: Record<string, { name: string; color: string; icon: string; multiplier: number; benefits: string[] }> = {
      bronze: {
        name: 'Bronze',
        color: 'from-amber-700 to-amber-500',
        icon: '🥉',
        multiplier: 1,
        benefits: ['Earn 1x points', 'Basic support']
      },
      silver: {
        name: 'Silver',
        color: 'from-gray-400 to-gray-200',
        icon: '🥈',
        multiplier: 1.5,
        benefits: ['Earn 1.5x points', 'Priority support', '5% bonus on jobs']
      },
      gold: {
        name: 'Gold',
        color: 'from-yellow-500 to-yellow-300',
        icon: '🥇',
        multiplier: 2,
        benefits: ['Earn 2x points', 'Premium support', '10% bonus on jobs', 'Featured profile']
      },
      platinum: {
        name: 'Platinum',
        color: 'from-purple-500 to-pink-500',
        icon: '💎',
        multiplier: 3,
        benefits: ['Earn 3x points', '24/7 VIP support', '15% bonus on jobs', 'Top priority in search', 'Exclusive perks']
      }
    }
    return tiers[tierName.toLowerCase()] || tiers.bronze
  }

  const currentTier = getTierInfo(tier)
  const tierOrder = ['bronze', 'silver', 'gold', 'platinum']
  const currentIndex = tierOrder.indexOf(tier.toLowerCase())
  const nextTier = currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null
  const nextTierInfo = nextTier ? getTierInfo(nextTier) : null
  
  const tierThresholds: Record<string, number> = { bronze: 0, silver: 1000, gold: 5000, platinum: 10000 }
  const nextThreshold = nextTierInfo && nextTier ? tierThresholds[nextTier] : null
  const progressToNextTier = nextThreshold ? ((balance - tierThresholds[tier.toLowerCase()]) / (nextThreshold - tierThresholds[tier.toLowerCase()])) * 100 : 100

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Loyalty Program</h1>
          <p className="text-muted-foreground">Earn points with every job and unlock exclusive benefits</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Balance & Tier Card */}
            <Card className="overflow-hidden">
              <div className={`h-32 bg-gradient-to-r ${currentTier.color} flex items-center justify-center`}>
                <div className="text-center text-white">
                  <div className="text-5xl mb-2">{currentTier.icon}</div>
                  <div className="text-lg font-semibold">{currentTier.name} Tier</div>
                  <div className="text-sm opacity-90">{currentTier.multiplier}x Points Multiplier</div>
                </div>
              </div>
              
              <CardContent className="pt-6 space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">{balance.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Available Points</div>
                </div>

                {nextTierInfo && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress to {nextTierInfo.name}</span>
                      <span className="font-medium">{nextThreshold! - balance} points needed</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${nextTierInfo.color} transition-all`}
                        style={{ width: `${Math.min(progressToNextTier, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Your Benefits</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {currentTier.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {nextTierInfo && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Unlock at {nextTierInfo.name}</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {nextTierInfo.benefits.slice(0, 3).map((benefit, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="text-gray-400">○</span>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Link href="/helper/badges">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl mb-2">🏆</div>
                    <div className="font-semibold">View Badges</div>
                    <div className="text-sm text-muted-foreground">Check achievements</div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/helper/rewards">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl mb-2">🎁</div>
                    <div className="font-semibold">Redeem Rewards</div>
                    <div className="text-sm text-muted-foreground">Browse catalog</div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Redeem Points */}
            <Card>
              <CardHeader>
                <CardTitle>Redeem Points</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRedeem} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Points Amount</label>
                      <Input
                        type="number"
                        min="100"
                        max={balance}
                        step="100"
                        value={redeemAmount}
                        onChange={(e) => setRedeemAmount(e.target.value)}
                        placeholder="1000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Estimated Value</label>
                      <div className="h-10 flex items-center px-3 border rounded-md bg-gray-50">
                        <span className="font-medium text-primary">
                          ₹{redeemAmount ? (parseInt(redeemAmount) / 100).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>💡</span>
                    <span>100 points = ₹1 wallet credit</span>
                  </div>

                  <Button type="submit" disabled={redeeming || !redeemAmount || parseInt(redeemAmount) > balance} className="w-full">
                    {redeeming ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      'Redeem to Wallet'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.map(txn => (
                      <div key={txn.id} className="flex items-center justify-between p-3 rounded border">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{txn.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(txn.created_at).toLocaleString()} • {txn.transaction_type}
                          </div>
                        </div>
                        <div className={`font-semibold ${txn.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {txn.points > 0 ? '+' : ''}{txn.points}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
