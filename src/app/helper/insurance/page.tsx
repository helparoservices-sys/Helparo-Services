'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getHelperInsurance } from '@/app/actions/trust-safety'

interface InsurancePolicy {
  id: string
  policy_type: string
  provider: string
  policy_number: string
  coverage_amount: number
  start_date: string
  end_date: string
  status: string
  is_verified: boolean
  created_at: string
}

export default function HelperInsurancePage() {
  const [loading, setLoading] = useState(true)
  const [policies, setPolicies] = useState<InsurancePolicy[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')

    const { supabase } = await import('@/lib/supabase/client')
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const result = await getHelperInsurance(user.id)

    if (result.error) {
      setError(result.error)
    } else {
      setPolicies(result.policies || [])
    }

    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700 border-green-300',
      expired: 'bg-red-100 text-red-700 border-red-300',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      cancelled: 'bg-gray-100 text-gray-700 border-gray-300'
    }
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-300'
  }

  const getPolicyTypeInfo = (type: string) => {
    const info: Record<string, { name: string; icon: string; description: string }> = {
      professional_liability: {
        name: 'Professional Liability',
        icon: '🛡️',
        description: 'Covers professional errors, omissions, and negligence'
      },
      general_liability: {
        name: 'General Liability',
        icon: '🏥',
        description: 'Covers bodily injury and property damage claims'
      },
      equipment_insurance: {
        name: 'Equipment Insurance',
        icon: '🔧',
        description: 'Covers damage to tools and equipment'
      },
      accident_insurance: {
        name: 'Accident Insurance',
        icon: '⚕️',
        description: 'Covers personal injury while working'
      }
    }
    return info[type] || { name: type, icon: '📋', description: 'Insurance coverage' }
  }

  const isExpiringSoon = (endDate: string) => {
    const daysUntilExpiry = Math.floor((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const getDaysUntilExpiry = (endDate: string) => {
    return Math.floor((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  const activePolicies = policies.filter(p => p.status === 'active')
  const totalCoverage = activePolicies.reduce((sum, p) => sum + p.coverage_amount, 0)

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Insurance Coverage</h1>
            <p className="text-muted-foreground">Protect yourself and your customers with insurance</p>
          </div>
          <Button>
            + Add Policy
          </Button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Coverage Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-primary">{policies.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Policies</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600">{activePolicies.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Active Now</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-blue-600">₹{(totalCoverage / 100000).toFixed(1)}L</div>
              <p className="text-sm text-muted-foreground mt-1">Total Coverage</p>
            </CardContent>
          </Card>
        </div>

        {/* Policies List */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : policies.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🛡️</div>
                <h3 className="font-semibold mb-2">No Insurance Coverage Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Protect yourself and gain customer trust with professional insurance
                </p>
                <Button>
                  Get Insurance
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {policies.map(policy => {
              const policyInfo = getPolicyTypeInfo(policy.policy_type)
              const isExpiring = isExpiringSoon(policy.end_date)
              const daysLeft = getDaysUntilExpiry(policy.end_date)
              const isActive = policy.status === 'active'

              return (
                <Card key={policy.id} className={`border-2 ${getStatusColor(policy.status)}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{policyInfo.icon}</div>
                      
                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{policyInfo.name}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(policy.status)}`}>
                              {policy.status}
                            </span>
                            {policy.is_verified && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{policyInfo.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Provider:</span>
                            <span className="ml-2 font-medium">{policy.provider}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Policy Number:</span>
                            <span className="ml-2 font-medium font-mono text-xs">{policy.policy_number}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Coverage:</span>
                            <span className="ml-2 font-medium text-primary">₹{(policy.coverage_amount / 100000).toFixed(1)}L</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Period:</span>
                            <span className="ml-2 font-medium text-xs">
                              {new Date(policy.start_date).toLocaleDateString()} - {new Date(policy.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {isActive && (
                          <div className="p-3 bg-white rounded border">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">Valid Until</div>
                                <div className={`text-sm ${isExpiring ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                  {isExpiring && '⚠️ '}
                                  {new Date(policy.end_date).toLocaleDateString()}
                                  {daysLeft > 0 && ` (${daysLeft} days left)`}
                                </div>
                              </div>
                              {isExpiring && (
                                <Button size="sm" variant="outline">
                                  Renew Now
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        {isExpiring && isActive && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm text-red-800">
                              <strong>Renewal Required:</strong> This policy expires in {daysLeft} days. Renew to maintain coverage and trust score.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Insurance Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-primary">✓</span>
                  <div className="text-sm">
                    <div className="font-medium">Customer Confidence</div>
                    <div className="text-muted-foreground">Insured helpers get 4x more bookings</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary">✓</span>
                  <div className="text-sm">
                    <div className="font-medium">Financial Protection</div>
                    <div className="text-muted-foreground">Cover yourself against liability claims</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary">✓</span>
                  <div className="text-sm">
                    <div className="font-medium">Higher Trust Score</div>
                    <div className="text-muted-foreground">Insurance significantly boosts your trust rating</div>
                  </div>
                </li>
              </ul>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-primary">✓</span>
                  <div className="text-sm">
                    <div className="font-medium">Premium Badge</div>
                    <div className="text-muted-foreground">Display "Insured" badge on your profile</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary">✓</span>
                  <div className="text-sm">
                    <div className="font-medium">Priority Listings</div>
                    <div className="text-muted-foreground">Appear higher in search results</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary">✓</span>
                  <div className="text-sm">
                    <div className="font-medium">Peace of Mind</div>
                    <div className="text-muted-foreground">Work confidently knowing you're covered</div>
                  </div>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
