'use client'

import { useEffect, useState } from 'react'
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

export default function CustomerLoyaltyPage() {
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState<number>(0)
  const [tier, setTier] = useState<string>('bronze')
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([])
  const [error, setError] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [redeemAmount, setRedeemAmount] = useState('')
  const [redeemDescription, setRedeemDescription] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')

    // Get user ID first
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
      setBalance(balanceRes.balance || 0)
      // Calculate tier based on balance
      const points = balanceRes.balance || 0
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

    if (!redeemDescription.trim()) {
      setError('Please provide a description')
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
      setRedeemDescription('')
      await loadData()
    }

    setRedeeming(false)
  }

  const getTierInfo = (tierName: string) => {
    const tiers: Record<string, { name: string; color: string; icon: string; min: number; max: number; benefits: string[] }> = {
      bronze: {
        name: 'Bronze',
        color: 'from-amber-700 to-amber-500',
        icon: '🥉',
        min: 0,
        max: 1000,
        benefits: ['Earn 1x points', 'Basic support']
      },
      silver: {
        name: 'Silver',
        color: 'from-gray-400 to-gray-200',
        icon: '🥈',
        min: 1000,
        max: 5000,
        benefits: ['Earn 1.5x points', 'Priority support', '5% extra discount']
      },
      gold: {
        name: 'Gold',
        color: 'from-yellow-500 to-yellow-300',
        icon: '🥇',
        min: 5000,
        max: 10000,
        benefits: ['Earn 2x points', 'Premium support', '10% extra discount', 'Free service upgrade']
      },
      platinum: {
        name: 'Platinum',
        color: 'from-purple-500 to-pink-500',
        icon: '💎',
        min: 10000,
        max: Infinity,
        benefits: ['Earn 3x points', '24/7 VIP support', '15% extra discount', 'Free service upgrades', 'Exclusive bundles']
      }
    }
    return tiers[tierName.toLowerCase()] || tiers.bronze
  }

  const currentTier = getTierInfo(tier)
  const nextTier = ['bronze', 'silver', 'gold', 'platinum'][['bronze', 'silver', 'gold', 'platinum'].indexOf(tier.toLowerCase()) + 1]
  const nextTierInfo = nextTier ? getTierInfo(nextTier) : null
  const progressToNextTier = nextTierInfo ? ((balance - currentTier.min) / (nextTierInfo.min - currentTier.min)) * 100 : 100

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Loyalty Points</h1>
          <p className="text-muted-foreground">Earn points with every service and unlock rewards</p>
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
                      <span className="font-medium">{nextTierInfo.min - balance} points needed</span>
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
                        min="1"
                        max={balance}
                        value={redeemAmount}
                        onChange={(e) => setRedeemAmount(e.target.value)}
                        placeholder="100"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Redeem For</label>
                      <Input
                        type="text"
                        value={redeemDescription}
                        onChange={(e) => setRedeemDescription(e.target.value)}
                        placeholder="Wallet credit"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>💡</span>
                    <span>100 points = ₹1 wallet credit</span>
                  </div>

                  <Button type="submit" disabled={redeeming || !redeemAmount || !redeemDescription}>
                    {redeeming ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      'Redeem Points'
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
