'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getHelperSubscription, subscribeToPllan } from '@/app/actions/helper-subscriptions'
import { Check, Crown, Zap, TrendingUp, Calendar, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
  id: string
  code: string
  name: string
  description: string
  price_rupees: number
  interval: string
  included_features: string[] | null
  commission_discount_percent: number | null
  extra_radius_km: number | null
  trial_days: number | null
}

interface Subscription {
  plan_name: string
  status: string
  current_period_end: string | null
  price_rupees: number
}

export default function HelperSubscriptionsPage() {
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [subscribing, setSubscribing] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const result = await getHelperSubscription()

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else if ('data' in result && result.data) {
      setPlans(result.data.plans)
      setSubscription(result.data.subscription)
    }

    setLoading(false)
  }

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId)

    const result = await subscribeToPllan(planId)

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else {
      toast.success('Subscription updated successfully')
      loadData()
    }

    setSubscribing(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 py-8 px-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Helparo Subscription Plans
          </h1>
          <p className="text-gray-600 mt-1">Choose the perfect plan to grow your helper business</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            {/* Current Subscription */}
            {subscription && (
              <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Crown className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Current Plan</p>
                        <p className="text-2xl font-bold text-gray-900">{subscription.plan_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                        <Check className="h-4 w-4" />
                        {subscription.status}
                      </div>
                      {subscription.current_period_end && (
                        <p className="text-xs text-gray-500 mt-2">
                          Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map(plan => {
                const isCurrentPlan = subscription?.plan_name === plan.name
                const pricePerMonth = plan.price_rupees

                return (
                  <Card
                    key={plan.id}
                    className={`relative overflow-hidden transition-all hover:shadow-xl ${
                      isCurrentPlan
                        ? 'border-2 border-purple-500 shadow-lg'
                        : 'bg-white/80 backdrop-blur-sm border-white/50'
                    }`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute top-0 right-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white px-3 py-1 rounded-bl-lg text-xs font-medium">
                        Current Plan
                      </div>
                    )}

                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                        {plan.code.includes('FREE') ? (
                          <Zap className="h-8 w-8 text-white" />
                        ) : plan.code.includes('PREMIUM') ? (
                          <Crown className="h-8 w-8 text-white" />
                        ) : (
                          <TrendingUp className="h-8 w-8 text-white" />
                        )}
                      </div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <div className="text-center">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-bold text-gray-900">
                            ₹{pricePerMonth.toFixed(0)}
                          </span>
                          <span className="text-gray-600">/{plan.interval}</span>
                        </div>
                      </div>

                      <ul className="space-y-3">
                        {(plan.included_features || ['Standard features', 'Email support', '24/7 availability']).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={isCurrentPlan || subscribing === plan.id}
                        className="w-full gap-2"
                        variant={isCurrentPlan ? 'outline' : 'default'}
                      >
                        {subscribing === plan.id ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Processing...
                          </>
                        ) : isCurrentPlan ? (
                          'Active Plan'
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4" />
                            Subscribe
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
