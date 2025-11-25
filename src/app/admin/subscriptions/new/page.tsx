'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createSubscriptionPlan } from '@/app/actions/subscriptions'

export default function NewSubscriptionPlanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    interval: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    price_rupees: '',
    commission_discount_percent: '',
    extra_radius_km: '',
    priority_level: '0',
    trial_days: '0',
    features: {
      priority_bidding: false,
      reduced_commission: false,
      highlight_profile: false,
      larger_radius: false,
      instant_payout: false,
      premium_support: false,
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const selectedFeatures = Object.entries(formData.features)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => key)

      const result = await createSubscriptionPlan({
        code: formData.code,
        name: formData.name,
        description: formData.description,
        interval: formData.interval,
        price_rupees: parseFloat(formData.price_rupees),
        commission_discount_percent: formData.commission_discount_percent ? parseFloat(formData.commission_discount_percent) : undefined,
        extra_radius_km: formData.extra_radius_km ? parseInt(formData.extra_radius_km) : undefined,
        priority_level: parseInt(formData.priority_level),
        features: selectedFeatures,
        trial_days: parseInt(formData.trial_days),
      })

      if ('error' in result) {
        setError(result.error)
      } else {
        router.push('/admin/subscriptions')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 py-10 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create Subscription Plan</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure a new helper subscription tier</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Plan Code *</label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="HELPER_PRO_M"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Unique identifier (e.g., HELPER_PRO_M)</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Plan Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Helper Pro - Monthly"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enhanced features for professional helpers..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Billing Interval *</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.interval}
                    onChange={(e) => setFormData({ ...formData, interval: e.target.value as any })}
                    required
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Price (₹) *</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_rupees}
                    onChange={(e) => setFormData({ ...formData, price_rupees: e.target.value })}
                    placeholder="299.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Trial Days</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.trial_days}
                    onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Commission Discount (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.commission_discount_percent}
                    onChange={(e) => setFormData({ ...formData, commission_discount_percent: e.target.value })}
                    placeholder="5.0"
                  />
                  <p className="text-xs text-muted-foreground">Reduce platform commission</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Extra Radius (km)</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.extra_radius_km}
                    onChange={(e) => setFormData({ ...formData, extra_radius_km: e.target.value })}
                    placeholder="10"
                  />
                  <p className="text-xs text-muted-foreground">Additional service area</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority Level</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.priority_level}
                    onChange={(e) => setFormData({ ...formData, priority_level: e.target.value })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">Higher = better ranking</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries({
                  priority_bidding: 'Priority Bidding - Earlier visibility in requests',
                  reduced_commission: 'Reduced Commission - Lower platform fees',
                  highlight_profile: 'Highlight Profile - Visual badge on profile',
                  larger_radius: 'Larger Radius - Extended service area',
                  instant_payout: 'Instant Payout - Faster withdrawals',
                  premium_support: 'Premium Support - Priority customer service',
                }).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.features[key as keyof typeof formData.features]}
                      onChange={(e) => setFormData({
                        ...formData,
                        features: { ...formData.features, [key]: e.target.checked }
                      })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Plan
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
