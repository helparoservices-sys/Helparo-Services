'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getLoyaltyBalance, redeemLoyaltyPoints } from '@/app/actions/gamification'
import { useToast } from '@/components/ui/toast-notification'

interface Reward {
  id: string
  name: string
  description: string
  points_required: number
  category: 'voucher' | 'discount' | 'physical' | 'service'
  value: string
  icon: string
  available: boolean
}

const REWARDS_CATALOG: Reward[] = [
  // Vouchers
  {
    id: 'voucher-amazon-500',
    name: 'Amazon Voucher ₹500',
    description: 'Gift card code sent via email',
    points_required: 50000,
    category: 'voucher',
    value: '₹500',
    icon: '🎁',
    available: true
  },
  {
    id: 'voucher-flipkart-500',
    name: 'Flipkart Voucher ₹500',
    description: 'Gift card code sent via email',
    points_required: 50000,
    category: 'voucher',
    value: '₹500',
    icon: '🎁',
    available: true
  },
  {
    id: 'voucher-swiggy-300',
    name: 'Swiggy Voucher ₹300',
    description: 'Food delivery credit',
    points_required: 30000,
    category: 'voucher',
    value: '₹300',
    icon: '🍔',
    available: true
  },
  
  // Platform Discounts
  {
    id: 'discount-boost-7days',
    name: '7-Day Profile Boost',
    description: 'Get featured at top of search results',
    points_required: 20000,
    category: 'service',
    value: '7 days',
    icon: '🚀',
    available: true
  },
  {
    id: 'discount-subscription-50',
    name: '50% Off Premium Subscription',
    description: 'Valid for 1 month premium plan',
    points_required: 15000,
    category: 'discount',
    value: '50% OFF',
    icon: '💎',
    available: true
  },
  {
    id: 'discount-featured-listing',
    name: 'Featured Listing for 14 Days',
    description: 'Premium placement in category',
    points_required: 35000,
    category: 'service',
    value: '14 days',
    icon: '⭐',
    available: true
  },
  
  // Physical Rewards
  {
    id: 'physical-tshirt',
    name: 'Helparo Branded T-Shirt',
    description: 'Premium quality merchandise (Free shipping)',
    points_required: 25000,
    category: 'physical',
    value: 'Merchandise',
    icon: '👕',
    available: true
  },
  {
    id: 'physical-toolkit',
    name: 'Professional Toolkit',
    description: 'Essential tools for helpers (Electrician/Plumber)',
    points_required: 100000,
    category: 'physical',
    value: 'Tools',
    icon: '🧰',
    available: true
  },
  
  // Special Rewards
  {
    id: 'service-training',
    name: 'Free Skill Training Course',
    description: 'Access to premium skill development courses',
    points_required: 40000,
    category: 'service',
    value: 'Training',
    icon: '🎓',
    available: true
  },
  {
    id: 'service-insurance',
    name: '1 Month Free Service Insurance',
    description: 'Premium insurance coverage',
    points_required: 60000,
    category: 'service',
    value: '1 month',
    icon: '🛡️',
    available: true
  }
]

export default function HelperRewardsPage() {
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [error, setError] = useState('')
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    loadBalance()
  }, [])

  const loadBalance = async () => {
    setLoading(true)
    setError('')

    const { supabase } = await import('@/lib/supabase/client')
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const result = await getLoyaltyBalance(user.id)

    if ('error' in result && result.error) {
      setError(result.error)
    } else if ('balance' in result) {
      setBalance(result.balance || 0)
    }

    setLoading(false)
  }

  const handleRedeem = async (reward: Reward) => {
    if (balance < reward.points_required) {
      setError('Insufficient points')
      return
    }

    setRedeeming(reward.id)
    setError('')

    const formData = new FormData()
    formData.append('points', reward.points_required.toString())
    formData.append('description', `Redeemed: ${reward.name}`)

    const result = await redeemLoyaltyPoints(formData)

    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      // In a real implementation, you would also:
      // 1. Create a redemption record in a 'reward_redemptions' table
      // 2. Trigger email/notification with voucher code or shipment details
      // 3. Update reward availability if limited quantity
      
      alert(`🎉 Successfully redeemed ${reward.name}! Check your email for details.`)
      await loadBalance()
    }

    setRedeeming(null)
  }

  const categories = ['all', 'voucher', 'discount', 'physical', 'service']
  const filteredRewards = selectedCategory === 'all' 
    ? REWARDS_CATALOG 
    : REWARDS_CATALOG.filter(r => r.category === selectedCategory)

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Rewards Catalog</h1>
            <p className="text-muted-foreground">Redeem your loyalty points for amazing rewards</p>
          </div>
          
          {!loading && (
            <Card className="bg-gradient-to-r from-primary to-primary-600 text-white">
              <CardContent className="py-3 px-6">
                <div className="text-sm opacity-90">Your Points</div>
                <div className="text-2xl font-bold">{balance.toLocaleString()}</div>
              </CardContent>
            </Card>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="capitalize whitespace-nowrap"
            >
              {cat}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRewards.map(reward => {
              const canAfford = balance >= reward.points_required
              const isRedeeming = redeeming === reward.id

              return (
                <Card key={reward.id} className={!canAfford ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="text-4xl">{reward.icon}</div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        canAfford ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {reward.points_required.toLocaleString()} pts
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-2">{reward.name}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">{reward.description}</div>
                      <div className="font-semibold text-primary">{reward.value}</div>
                    </div>

                    <Button
                      onClick={() => handleRedeem(reward)}
                      disabled={!canAfford || !reward.available || isRedeeming}
                      className="w-full"
                      variant={canAfford ? 'default' : 'outline'}
                    >
                      {isRedeeming ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span>Processing...</span>
                        </>
                      ) : !reward.available ? (
                        'Out of Stock'
                      ) : !canAfford ? (
                        `Need ${(reward.points_required - balance).toLocaleString()} more`
                      ) : (
                        'Redeem Now'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {!loading && filteredRewards.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No rewards found in this category</p>
          </div>
        )}

        {/* Info Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How Rewards Work</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Earn loyalty points by completing jobs, maintaining high ratings, and achieving milestones</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Redeem points for vouchers, platform benefits, or physical rewards</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Voucher codes are sent to your registered email within 24 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Physical rewards are shipped to your profile address (free shipping)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>All redemptions are final and cannot be reversed</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
