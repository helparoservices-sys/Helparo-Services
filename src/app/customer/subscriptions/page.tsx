'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { COMMISSION } from '@/lib/constants'
import { 
  Crown, Check, Zap, Star, Award, Loader2, 
  TrendingUp, Shield, MapPin 
} from 'lucide-react'

interface SubscriptionPlan {
  id: string
  code: string
  name: string
  description: string | null
  price_rupees: number
  interval: string
  included_features: string[] | null
  commission_discount_percent: number | null
  extra_radius_km: number | null
  priority_level: number | null
  trial_days: number | null
  is_active: boolean
}

interface SubscriptionStatus {
  plan_name: string | null
  status: string | null
  current_period_end: string | null
}

export default function CustomerSubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentStatus, setCurrentStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    
    // Load subscription status
    const { data: status } = await supabase.rpc('get_helper_subscription_status')
    setCurrentStatus(status as any)

    // Load available plans
    const { data: plansData } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_rupees')

    if (plansData) {
      setPlans(plansData as SubscriptionPlan[])
    }

    setLoading(false)
  }

  async function subscribe(planCode: string) {
    const supabase = createClient()
    setSubscribing(planCode)

    const { error } = await supabase.rpc('subscribe_helper', { 
      p_plan_code: planCode 
    })

    if (error) {
      alert('Failed to subscribe: ' + error.message)
    } else {
      alert('Successfully subscribed!')
      loadData()
    }

    setSubscribing(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Helper Subscription Plans
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Upgrade your helper account with premium features to get more service requests and earn more
          </p>
        </div>

        {/* Current Status */}
        {currentStatus?.plan_name && (
          <Card className="mb-8 border-2 border-blue-500 dark:border-blue-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Your Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {currentStatus.plan_name}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Status: {currentStatus.status}
                    {currentStatus.current_period_end && (
                      <span className="ml-2">
                        • Renews on {new Date(currentStatus.current_period_end).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Commission Info */}
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-300">
              <strong>Platform Commission:</strong> Base rate is {COMMISSION.PLATFORM_PERCENTAGE}% of earnings. 
              Premium plans offer commission discounts. For example, a {COMMISSION.PLATFORM_PERCENTAGE}% base with a 5% discount means you pay only {(COMMISSION.PLATFORM_PERCENTAGE - 5)}% commission.
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => {
            const isPopular = plan.priority_level === 2
            const isPremium = plan.priority_level === 3
            
            return (
              <Card
                key={plan.id}
                className={`relative ${
                  isPremium
                    ? 'border-2 border-purple-500 dark:border-purple-600 shadow-lg'
                    : isPopular
                    ? 'border-2 border-blue-500 dark:border-blue-600'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {(isPopular || isPremium) && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white ${
                    isPremium ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-blue-600 to-cyan-600'
                  }`}>
                    {isPremium ? '⭐ PREMIUM' : '🔥 POPULAR'}
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`h-16 w-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                    isPremium
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                      : isPopular
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                      : 'bg-gradient-to-br from-slate-400 to-slate-500'
                  }`}>
                    {isPremium ? <Crown className="h-8 w-8 text-white" /> :
                     isPopular ? <Zap className="h-8 w-8 text-white" /> :
                     <Star className="h-8 w-8 text-white" />}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  {plan.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      {plan.description}
                    </p>
                  )}
                </CardHeader>

                <CardContent>
                  {/* Pricing */}
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-slate-900 dark:text-white">
                      ₹{Number(plan.price_rupees).toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      per {plan.interval}
                    </div>
                    {plan.trial_days && plan.trial_days > 0 && (
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
                        🎁 {plan.trial_days} days free trial
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {plan.commission_discount_percent && plan.commission_discount_percent > 0 && (
                      <div className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {plan.commission_discount_percent}% commission discount
                        </span>
                      </div>
                    )}
                    {plan.extra_radius_km && plan.extra_radius_km > 0 && (
                      <div className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          +{plan.extra_radius_km}km service radius
                        </span>
                      </div>
                    )}
                    {plan.priority_level && plan.priority_level > 1 && (
                      <div className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          Priority Level {plan.priority_level} matching
                        </span>
                      </div>
                    )}
                    {plan.included_features && plan.included_features.length > 0 && (
                      <>
                        {plan.included_features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Subscribe Button */}
                  <Button
                    onClick={() => subscribe(plan.code)}
                    disabled={subscribing === plan.code}
                    className={`w-full ${
                      isPremium
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                        : isPopular
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                        : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800'
                    }`}
                  >
                    {subscribing === plan.code ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      <>
                        Subscribe Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {plans.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Award className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No plans available
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Check back later for subscription options
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
