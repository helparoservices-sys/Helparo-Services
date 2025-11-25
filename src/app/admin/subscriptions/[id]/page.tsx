'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { getAllSubscriptionPlans, updateSubscriptionPlan } from '@/app/actions/subscriptions'
import { LoadingSpinner } from '@/components/ui/loading'

const FEATURE_KEYS = [
  { value: 'priority_bidding', label: 'Priority Bidding' },
  { value: 'reduced_commission', label: 'Reduced Commission' },
  { value: 'highlight_profile', label: 'Highlighted Profile' },
  { value: 'larger_radius', label: 'Larger Service Radius' },
  { value: 'instant_payout', label: 'Instant Payouts' },
  { value: 'premium_support', label: 'Premium Support' },
]

interface SubscriptionPlan {
  id: string
  code: string
  name: string
  description: string
  interval: string
  price_rupees: number
  commission_discount_percent: number | null
  extra_radius_km: number | null
  priority_level: number
  is_active: boolean
  trial_days: number
  included_features: string[]
}

export default function EditSubscriptionPlanPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    interval: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    price_rupees: '',
    commission_discount_percent: '',
    extra_radius_km: '',
    priority_level: '1',
    trial_days: '0',
    included_features: [] as string[],
  })

  useEffect(() => {
    loadPlan()
  }, [params.id])

  const loadPlan = async () => {
    setLoading(true)
    setError('')

    const result = await getAllSubscriptionPlans()

    if ('error' in result) {
      setError(result.error)
      setLoading(false)
      return
    }

    const plan = result.plans?.find((p) => p.id === params.id)

    if (!plan) {
      setError('Subscription plan not found')
      setLoading(false)
      return
    }

    setFormData({
      code: plan.code,
      name: plan.name,
      description: plan.description || '',
      interval: plan.interval as 'monthly' | 'quarterly' | 'yearly',
      price_rupees: plan.price_rupees.toString(),
      commission_discount_percent: plan.commission_discount_percent?.toString() || '',
      extra_radius_km: plan.extra_radius_km?.toString() || '',
      priority_level: plan.priority_level.toString(),
      trial_days: plan.trial_days.toString(),
      included_features: plan.included_features || [],
    })

    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const updateData: any = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        interval: formData.interval,
        price_rupees: parseFloat(formData.price_rupees),
        priority_level: parseInt(formData.priority_level),
        trial_days: parseInt(formData.trial_days),
        included_features: formData.included_features,
      }

      if (formData.commission_discount_percent) {
        updateData.commission_discount_percent = parseFloat(formData.commission_discount_percent)
      }

      if (formData.extra_radius_km) {
        updateData.extra_radius_km = parseFloat(formData.extra_radius_km)
      }

      const result = await updateSubscriptionPlan(params.id, updateData)

      if ('error' in result) {
        setError(result.error)
      } else {
        setSuccess('Subscription plan updated successfully!')
        setTimeout(() => router.push('/admin/subscriptions'), 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription plan')
    } finally {
      setSaving(false)
    }
  }

  const toggleFeature = (featureKey: string) => {
    setFormData((prev) => ({
      ...prev,
      included_features: prev.included_features.includes(featureKey)
        ? prev.included_features.filter((f) => f !== featureKey)
        : [...prev.included_features, featureKey],
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error && !formData.name) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 py-10 px-4">
        <div className="mx-auto max-w-2xl">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Link href="/admin/subscriptions">
              <Button className="mt-4" variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Plans
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 py-10 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/subscriptions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Edit Subscription Plan</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update subscription tier details and benefits</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Plan Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., PREMIUM"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Premium Plan"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the plan benefits..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="interval">Billing Interval *</Label>
                  <Select value={formData.interval} onValueChange={(value: any) => setFormData({ ...formData, interval: value })}>
                    <SelectTrigger id="interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_rupees">Price (₹) *</Label>
                  <Input
                    id="price_rupees"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_rupees}
                    onChange={(e) => setFormData({ ...formData, price_rupees: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trial_days">Trial Days</Label>
                  <Input
                    id="trial_days"
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

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="commission_discount">Commission Discount (%)</Label>
                  <Input
                    id="commission_discount"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.commission_discount_percent}
                    onChange={(e) => setFormData({ ...formData, commission_discount_percent: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extra_radius">Extra Radius (km)</Label>
                  <Input
                    id="extra_radius"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.extra_radius_km}
                    onChange={(e) => setFormData({ ...formData, extra_radius_km: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority_level">Priority Level *</Label>
                  <Input
                    id="priority_level"
                    type="number"
                    min="0"
                    value={formData.priority_level}
                    onChange={(e) => setFormData({ ...formData, priority_level: e.target.value })}
                    placeholder="1"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Included Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {FEATURE_KEYS.map((feature) => (
                  <div key={feature.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature.value}
                      checked={formData.included_features.includes(feature.value)}
                      onCheckedChange={() => toggleFeature(feature.value)}
                    />
                    <label
                      htmlFor={feature.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {feature.label}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Link href="/admin/subscriptions">
              <Button type="button" variant="outline" disabled={saving}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Update Plan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
