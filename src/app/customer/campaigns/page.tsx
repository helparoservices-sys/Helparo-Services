'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getActiveCampaigns, getMyCampaignRedemptions } from '@/app/actions/bundles'

interface Campaign {
  id: string
  title: string
  description: string
  campaign_type: string
  discount_type: string
  discount_value: number
  max_discount_amount: number | null
  min_order_value: number | null
  start_date: string
  end_date: string
  banner_url: string | null
  max_redemptions_per_user: number
  is_active: boolean
}

interface Redemption {
  id: string
  campaign_id: string
  discount_applied: number
  created_at: string
  campaign: {
    title: string
    campaign_type: string
    banner_url: string | null
  }
  service_request: {
    title: string
    status: string
  }
}

export default function CustomerCampaignsPage() {
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')

    const [campaignsRes, redemptionsRes] = await Promise.all([
      getActiveCampaigns(),
      getMyCampaignRedemptions()
    ])

    if ('error' in campaignsRes && campaignsRes.error) {
      setError(campaignsRes.error)
    } else if ('campaigns' in campaignsRes) {
      setCampaigns(campaignsRes.campaigns || [])
    }

    if ('error' in redemptionsRes && redemptionsRes.error) {
      setError(redemptionsRes.error)
    } else if ('redemptions' in redemptionsRes) {
      setRedemptions(redemptionsRes.redemptions || [])
    }

    setLoading(false)
  }

  const getCampaignIcon = (type: string) => {
    const icons: Record<string, string> = {
      diwali: '🪔',
      holi: '🎨',
      monsoon: '🌧️',
      summer: '☀️',
      christmas: '🎄',
      newyear: '🎉',
      flash_sale: '⚡'
    }
    return icons[type.toLowerCase()] || '🎁'
  }

  const formatDiscount = (campaign: Campaign) => {
    if (campaign.discount_type === 'percentage') {
      return `${campaign.discount_value}% OFF`
    }
    return `₹${campaign.discount_value} OFF`
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Campaigns & Offers</h1>
          <p className="text-muted-foreground">Save more with our special campaigns</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Active Campaigns
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            My Redemptions ({redemptions.length})
          </button>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : activeTab === 'active' ? (
          <>
            {/* Active Campaigns */}
            {campaigns.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center">No active campaigns at the moment</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {campaigns.map(campaign => {
                  const daysRemaining = getDaysRemaining(campaign.end_date)
                  const isEndingSoon = daysRemaining <= 3

                  return (
                    <Card key={campaign.id} className={`overflow-hidden ${isEndingSoon ? 'border-orange-300' : ''}`}>
                      <div className="h-32 bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="text-5xl mb-2">{getCampaignIcon(campaign.campaign_type)}</div>
                          <div className="text-2xl font-bold">{formatDiscount(campaign)}</div>
                        </div>
                      </div>
                      
                      <CardHeader>
                        <CardTitle className="text-lg">{campaign.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{campaign.description}</p>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          {campaign.min_order_value && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span>💰</span>
                              <span>Min order: ₹{campaign.min_order_value}</span>
                            </div>
                          )}
                          
                          {campaign.max_discount_amount && campaign.discount_type === 'percentage' && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span>🎯</span>
                              <span>Max discount: ₹{campaign.max_discount_amount}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>🔄</span>
                            <span>Max uses: {campaign.max_redemptions_per_user} per user</span>
                          </div>
                          
                          <div className={`flex items-center gap-2 font-medium ${isEndingSoon ? 'text-orange-600' : 'text-muted-foreground'}`}>
                            <span>⏰</span>
                            <span>
                              {isEndingSoon ? 'Ending soon!' : `${daysRemaining} days remaining`}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            Valid from {new Date(campaign.start_date).toLocaleDateString()} to {new Date(campaign.end_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-primary font-medium mt-1">
                            ✨ Automatically applied on eligible orders
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Redemption History */}
            {redemptions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center">You haven't used any campaigns yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {redemptions.map(redemption => (
                  <Card key={redemption.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getCampaignIcon(redemption.campaign.campaign_type)}</span>
                            <div>
                              <h3 className="font-semibold">{redemption.campaign.title}</h3>
                              <p className="text-sm text-muted-foreground">{redemption.service_request.title}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Saved: <span className="font-medium text-green-600">₹{redemption.discount_applied}</span></span>
                            <span>•</span>
                            <span>{new Date(redemption.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="capitalize">{redemption.service_request.status}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
