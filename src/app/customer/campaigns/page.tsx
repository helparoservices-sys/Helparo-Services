'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Calendar, Tag, TrendingUp, Gift, CheckCircle, Clock, Percent, IndianRupee } from 'lucide-react'

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
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

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

    // Load active campaigns
    const { data: campaignsData } = await supabase
      .from('campaigns')
      .select('*')
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .order('start_date', { ascending: false })

    if (campaignsData) {
      setCampaigns(campaignsData)
    }

    // Load redemptions
    const { data: redemptionsData } = await supabase
      .from('campaign_redemptions')
      .select(`
        id,
        campaign_id,
        discount_applied,
        created_at,
        campaign:campaigns (
          title,
          campaign_type,
          banner_url
        ),
        service_request:service_requests (
          title,
          status
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (redemptionsData) {
      setRedemptions(redemptionsData as any)
    }

    setLoading(false)
  }

  const getCampaignIcon = (type: string): any => {
    const icons: Record<string, any> = {
      diwali: '🪔',
      holi: '🎨',
      monsoon: '🌧️',
      summer: '☀️',
      christmas: '🎄',
      newyear: '🎉',
      flash_sale: '⚡',
      seasonal: '🌸',
      special: '✨'
    }
    return icons[type.toLowerCase()] || '🎁'
  }

  const getCampaignColor = (type: string) => {
    const colors: Record<string, string> = {
      diwali: 'from-orange-500 to-yellow-500',
      holi: 'from-pink-500 to-purple-500',
      monsoon: 'from-blue-500 to-cyan-500',
      summer: 'from-yellow-500 to-orange-500',
      christmas: 'from-green-500 to-red-500',
      newyear: 'from-purple-500 to-pink-500',
      flash_sale: 'from-red-500 to-orange-500',
      seasonal: 'from-teal-500 to-green-500',
      special: 'from-indigo-500 to-purple-500'
    }
    return colors[type.toLowerCase()] || 'from-blue-500 to-purple-500'
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

  const totalSavings = redemptions.reduce((sum, r) => sum + (r.discount_applied || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading campaigns...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Campaigns & Offers</h1>
          <p className="text-slate-600 dark:text-slate-400">Save more with our special seasonal campaigns</p>
        </div>
        {totalSavings > 0 && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
            <p className="text-sm opacity-90">Total Savings</p>
            <p className="text-2xl font-bold">₹{totalSavings.toFixed(2)}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 'active'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Active Campaigns ({campaigns.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            My Redemptions ({redemptions.length})
          </div>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'active' ? (
        <>
          {campaigns.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
              <Sparkles className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Active Campaigns</h3>
              <p className="text-slate-600 dark:text-slate-400">Check back soon for exciting offers and deals!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campaigns.map(campaign => {
                const daysRemaining = getDaysRemaining(campaign.end_date)
                const isEndingSoon = daysRemaining <= 3
                const campaignGradient = getCampaignColor(campaign.campaign_type)

                return (
                  <div
                    key={campaign.id}
                    className={`bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all border-2 ${\n                      isEndingSoon\n                        ? 'border-orange-500 dark:border-orange-600'\n                        : 'border-slate-200 dark:border-slate-700'\n                    }`}
                  >
                    {/* Banner */}
                    <div className={`bg-gradient-to-r ${campaignGradient} h-44 flex items-center justify-center relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="relative z-10 text-center text-white">
                        <div className="text-6xl mb-3">{getCampaignIcon(campaign.campaign_type)}</div>
                        <div className="text-3xl font-bold drop-shadow-lg">{formatDiscount(campaign)}</div>
                      </div>
                      
                      {isEndingSoon && (
                        <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                          🔥 Ending Soon!
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{campaign.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">{campaign.description}</p>
                      </div>

                      {/* Terms */}
                      <div className="space-y-2 text-sm">
                        {campaign.min_order_value && (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <IndianRupee className="h-4 w-4 text-blue-600" />
                            <span>Minimum order: ₹{campaign.min_order_value.toLocaleString()}</span>
                          </div>
                        )}
                        
                        {campaign.max_discount_amount && campaign.discount_type === 'percentage' && (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Tag className="h-4 w-4 text-green-600" />
                            <span>Maximum discount: ₹{campaign.max_discount_amount.toLocaleString()}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Gift className="h-4 w-4 text-purple-600" />
                          <span>Maximum uses: {campaign.max_redemptions_per_user} per customer</span>
                        </div>
                        
                        <div className={`flex items-center gap-2 font-medium ${\n                          isEndingSoon\n                            ? 'text-orange-600'\n                            : 'text-slate-600 dark:text-slate-400'\n                        }`}>\n                          <Clock className="h-4 w-4" />
                          <span>\n                            {isEndingSoon\n                              ? `Only ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} left!`\n                              : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`}\n                          </span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>\n                              {new Date(campaign.start_date).toLocaleDateString('en-IN', {\n                                day: 'numeric',\n                                month: 'short'\n                              })} - {new Date(campaign.end_date).toLocaleDateString('en-IN', {\n                                day: 'numeric',\n                                month: 'short',\n                                year: 'numeric'\n                              })}\n                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2">
                          <p className="text-xs text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Automatically applied on eligible bookings
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {redemptions.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-700">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Redemptions Yet</h3>
              <p className="text-slate-600 dark:text-slate-400">Book services during active campaigns to start saving!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {redemptions.map(redemption => (
                <div
                  key={redemption.id}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-5xl">{getCampaignIcon(redemption.campaign.campaign_type)}</div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                        {redemption.campaign.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                        {redemption.service_request.title}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 font-bold text-green-600">
                          <IndianRupee className="h-4 w-4" />
                          <span>Saved ₹{redemption.discount_applied.toFixed(2)}</span>
                        </div>
                        
                        <span className="text-slate-400">•</span>
                        
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Calendar className="h-4 w-4" />
                          <span>\n                            {new Date(redemption.created_at).toLocaleDateString('en-IN', {\n                              day: 'numeric',\n                              month: 'short',\n                              year: 'numeric'\n                            })}\n                          </span>
                        </div>
                        
                        <span className="text-slate-400">•</span>
                        
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold capitalize">
                          {redemption.service_request.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
