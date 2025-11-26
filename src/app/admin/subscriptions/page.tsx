'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getAllSubscriptionPlans, deleteSubscriptionPlan, updateSubscriptionPlan } from '@/app/actions/subscriptions'
import { LoadingSpinner } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast-notification'

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
  created_at: string
}

export default function AdminSubscriptionsPage() {
  const { showSuccess, showError } = useToast()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    setLoading(true)
    setError('')
    
    const result = await getAllSubscriptionPlans()
    
    if ('error' in result) {
      setError(result.error)
    } else if ('plans' in result) {
      setPlans(result.plans || [])
    }
    
    setLoading(false)
  }

  const handleDelete = async (planId: string, planName: string) => {
    if (!confirm(`Are you sure you want to delete "${planName}"? This cannot be undone.`)) {
      return
    }

    setDeletingId(planId)
    const result = await deleteSubscriptionPlan(planId)
    
    if ('error' in result) {
      showError('Delete Failed', result.error)
    } else {
      showSuccess('Plan Deleted', 'Subscription plan deleted successfully')
      await loadPlans()
    }
    
    setDeletingId(null)
  }

  const handleToggleActive = async (planId: string, currentStatus: boolean) => {
    setTogglingId(planId)
    
    const result = await updateSubscriptionPlan(planId, { is_active: !currentStatus })
    
    if ('error' in result) {
      showError('Update Failed', result.error)
    } else {
      showSuccess('Status Updated', `Plan ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      await loadPlans()
    }
    
    setTogglingId(null)
  }

  const intervalLabels: Record<string, string> = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Subscription Plans</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage helper subscription tiers and benefits</p>
          </div>
          <Link href="/admin/subscriptions/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Plan
            </Button>
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : plans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No subscription plans configured yet.</p>
              <Link href="/admin/subscriptions/new">
                <Button className="mt-4">Create First Plan</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className={!plan.is_active ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {plan.name}
                        {plan.is_active ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{plan.code}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {plan.description && (
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-bold text-primary">₹{plan.price_rupees.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Billing</span>
                      <span className="font-medium">{intervalLabels[plan.interval] || plan.interval}</span>
                    </div>

                    {plan.commission_discount_percent && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Commission Discount</span>
                        <span className="font-medium text-green-600">{plan.commission_discount_percent}%</span>
                      </div>
                    )}

                    {plan.extra_radius_km && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Extra Radius</span>
                        <span className="font-medium">+{plan.extra_radius_km} km</span>
                      </div>
                    )}

                    {plan.trial_days > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Trial Period</span>
                        <span className="font-medium">{plan.trial_days} days</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Priority</span>
                      <span className="font-medium">Level {plan.priority_level}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Link href={`/admin/subscriptions/${plan.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full gap-1">
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                    </Link>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(plan.id, plan.is_active)}
                      disabled={togglingId === plan.id}
                      className="flex-1"
                    >
                      {togglingId === plan.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : plan.is_active ? (
                        'Deactivate'
                      ) : (
                        'Activate'
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(plan.id, plan.name)}
                      disabled={deletingId === plan.id}
                    >
                      {deletingId === plan.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
