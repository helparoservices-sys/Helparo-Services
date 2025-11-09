/**
 * REFERRAL & LOYALTY SYSTEM
 * Viral growth engine - Incentivize word-of-mouth marketing
 * Industry benchmark: Referral programs increase signups by 25-50%
 */

'use client'

import { useState, useEffect } from 'react'
import { Gift, Users, Share2, Trophy, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface ReferralStats {
  referral_code: string
  total_referrals: number
  successful_referrals: number
  pending_referrals: number
  total_credits_earned: number
  next_tier_threshold: number
  current_tier: 'bronze' | 'silver' | 'gold' | 'platinum'
}

export interface LoyaltyTier {
  name: string
  threshold: number
  benefits: string[]
  discount_percentage: number
  badge_color: string
}

const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    name: 'Bronze',
    threshold: 0,
    benefits: ['5% discount on all services', 'Priority customer support'],
    discount_percentage: 5,
    badge_color: 'bg-orange-600',
  },
  {
    name: 'Silver',
    threshold: 5,
    benefits: ['10% discount', 'Priority booking', 'Free cancellation'],
    discount_percentage: 10,
    badge_color: 'bg-gray-400',
  },
  {
    name: 'Gold',
    threshold: 15,
    benefits: ['15% discount', 'VIP support', 'Free rescheduling', 'Birthday bonus'],
    discount_percentage: 15,
    badge_color: 'bg-yellow-500',
  },
  {
    name: 'Platinum',
    threshold: 30,
    benefits: ['20% discount', 'Dedicated account manager', 'Early access to new features', 'Exclusive helpers'],
    discount_percentage: 20,
    badge_color: 'bg-purple-600',
  },
]

/**
 * REFERRAL DASHBOARD
 * Main referral management interface
 */
export function ReferralDashboard({ userId }: { userId: string }) {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchReferralStats()
  }, [userId])

  const fetchReferralStats = async () => {
    try {
      const response = await fetch(`/api/referrals/stats?user_id=${userId}`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch referral stats:', error)
    }
  }

  const copyReferralCode = () => {
    if (stats) {
      const referralLink = `https://helparo.com?ref=${stats.referral_code}`
      navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareReferral = async () => {
    if (!stats) return

    const referralLink = `https://helparo.com?ref=${stats.referral_code}`
    const shareText = `Join Helparo and get ₹200 credit! I've saved so much money finding reliable helpers. Use my code: ${stats.referral_code}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Helparo',
          text: shareText,
          url: referralLink,
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      // Fallback to WhatsApp
      window.open(
        `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + referralLink)}`,
        '_blank'
      )
    }
  }

  if (!stats) return <div>Loading...</div>

  const currentTier = LOYALTY_TIERS.find((t) => t.name.toLowerCase() === stats.current_tier) || LOYALTY_TIERS[0]
  const nextTier = LOYALTY_TIERS.find((t) => t.threshold > stats.successful_referrals)
  const progressToNextTier = nextTier
    ? (stats.successful_referrals / nextTier.threshold) * 100
    : 100

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-6 w-6" />
            Refer Friends, Earn Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-white/90 mb-2">Your Referral Code</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={stats.referral_code}
                  readOnly
                  className="flex-1 px-4 py-3 rounded-lg bg-white/20 text-white font-mono text-lg"
                />
                <Button
                  onClick={copyReferralCode}
                  variant="secondary"
                  className="bg-white text-purple-600 hover:bg-white/90"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              onClick={shareReferral}
              className="w-full bg-white text-purple-600 hover:bg-white/90"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share with Friends
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-3xl font-bold">{stats.total_referrals}</div>
            <div className="text-sm text-gray-600">Total Referrals</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-3xl font-bold">{stats.successful_referrals}</div>
            <div className="text-sm text-gray-600">Successful</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center">
            <Gift className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-3xl font-bold">₹{stats.total_credits_earned}</div>
            <div className="text-sm text-gray-600">Credits Earned</div>
          </CardContent>
        </Card>
      </div>

      {/* Loyalty Tier Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Loyalty Tier: {currentTier.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Current Benefits:</span>
                <span className={`px-2 py-1 rounded text-white text-xs ${currentTier.badge_color}`}>
                  {currentTier.name}
                </span>
              </div>
              <ul className="space-y-1">
                {currentTier.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-600" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {nextTier && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress to {nextTier.name}</span>
                  <span className="font-medium">
                    {stats.successful_referrals}/{nextTier.threshold} referrals
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${progressToNextTier}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {nextTier.threshold - stats.successful_referrals} more referrals to unlock {nextTier.name} benefits!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium mb-1">Share Your Code</h4>
                <p className="text-sm text-gray-600">
                  Share your unique referral code with friends and family
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium mb-1">They Sign Up</h4>
                <p className="text-sm text-gray-600">
                  Your friend gets ₹200 credit when they sign up using your code
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium mb-1">You Both Win</h4>
                <p className="text-sm text-gray-600">
                  After their first booking, you get ₹200 credit + progress toward higher loyalty tier
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Referrals */}
      {stats.pending_referrals > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-orange-600">
              <Users className="h-5 w-5" />
              <div>
                <p className="font-medium">
                  {stats.pending_referrals} referral{stats.pending_referrals > 1 ? 's' : ''} pending
                </p>
                <p className="text-sm text-gray-600">
                  Waiting for {stats.pending_referrals > 1 ? 'them' : 'them'} to complete first booking
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * REFERRAL BADGE (for profile pages)
 */
export function ReferralBadge({ referralCount }: { referralCount: number }) {
  if (referralCount < 5) return null

  return (
    <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-900 px-3 py-1 rounded-full text-sm font-medium">
      <Users className="h-4 w-4" />
      <span>Referred {referralCount}+ friends</span>
    </div>
  )
}

/**
 * LOYALTY DISCOUNT BANNER
 */
export function LoyaltyDiscountBanner({ tier }: { tier: 'bronze' | 'silver' | 'gold' | 'platinum' }) {
  const tierConfig = LOYALTY_TIERS.find((t) => t.name.toLowerCase() === tier)
  if (!tierConfig) return null

  return (
    <div className={`${tierConfig.badge_color} text-white p-4 rounded-lg mb-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6" />
          <div>
            <p className="font-semibold">{tierConfig.name} Member Discount</p>
            <p className="text-sm opacity-90">
              Save {tierConfig.discount_percentage}% on this booking
            </p>
          </div>
        </div>
        <div className="text-3xl font-bold">-{tierConfig.discount_percentage}%</div>
      </div>
    </div>
  )
}
