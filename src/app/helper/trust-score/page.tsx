'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getHelperTrustScore, getHelperBackgroundChecks } from '@/app/actions/trust-safety'

interface TrustScoreData {
  score: number
  status: string
  verification_level: string
  last_updated: string
  factors: {
    identity_verified: boolean
    background_check_passed: boolean
    insurance_active: boolean
    rating_average: number
    total_bookings: number
    completion_rate: number
  }
}

interface BackgroundCheck {
  id: string
  check_type: string
  status: string
  result: string
  verified_at: string | null
  expires_at: string | null
}

export default function HelperTrustScorePage() {
  const [loading, setLoading] = useState(true)
  const [trustScore, setTrustScore] = useState<TrustScoreData | null>(null)
  const [backgroundChecks, setBackgroundChecks] = useState<BackgroundCheck[]>([])
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

    const [scoreRes, checksRes] = await Promise.all([
      getHelperTrustScore(user.id),
      getHelperBackgroundChecks(user.id)
    ])

    if (scoreRes.error) {
      setError(scoreRes.error)
    } else {
      setTrustScore(scoreRes.trustScore || null)
    }

    if (!checksRes.error) {
      setBackgroundChecks(checksRes.checks || [])
    }

    setLoading(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300', gradient: 'from-green-500 to-green-300' }
    if (score >= 60) return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-300', gradient: 'from-yellow-500 to-yellow-300' }
    return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300', gradient: 'from-red-500 to-red-300' }
  }

  const getVerificationBadge = (level: string) => {
    const badges: Record<string, { text: string; color: string; icon: string }> = {
      basic: { text: 'Basic', color: 'bg-gray-100 text-gray-700', icon: '✓' },
      standard: { text: 'Standard', color: 'bg-blue-100 text-blue-700', icon: '✓✓' },
      premium: { text: 'Premium', color: 'bg-purple-100 text-purple-700', icon: '✓✓✓' },
      elite: { text: 'Elite', color: 'bg-yellow-100 text-yellow-700', icon: '⭐' }
    }
    return badges[level.toLowerCase()] || badges.basic
  }

  const getCheckStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      verified: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
      expired: 'bg-gray-100 text-gray-700'
    }
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-700'
  }

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false
    const daysUntilExpiry = Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 py-10 px-4">
        <div className="mx-auto max-w-5xl space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (error || !trustScore) {
    return (
      <div className="min-h-screen bg-primary-50 py-10 px-4">
        <div className="mx-auto max-w-5xl">
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-600">{error || 'Failed to load trust score'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const scoreStyle = getScoreColor(trustScore.score)
  const verificationBadge = getVerificationBadge(trustScore.verification_level)

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Trust & Safety Score</h1>
          <p className="text-muted-foreground">Build trust with customers through verification and quality service</p>
        </div>

        {/* Trust Score Card */}
        <Card className={`overflow-hidden ${scoreStyle.border} border-2`}>
          <div className={`h-40 bg-gradient-to-r ${scoreStyle.gradient} flex items-center justify-center`}>
            <div className="text-center text-white">
              <div className="text-6xl font-bold mb-2">{trustScore.score}</div>
              <div className="text-xl font-semibold">Trust Score</div>
            </div>
          </div>
          
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Verification Level</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${verificationBadge.color}`}>
                {verificationBadge.icon} {verificationBadge.text}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCheckStatusColor(trustScore.status)}`}>
                {trustScore.status}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="text-sm font-medium">{new Date(trustScore.last_updated).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Trust Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded border">
                <div className="flex items-center gap-3">
                  <div className={`text-2xl ${trustScore.factors.identity_verified ? '' : 'opacity-40 grayscale'}`}>
                    {trustScore.factors.identity_verified ? '✅' : '❌'}
                  </div>
                  <div>
                    <div className="font-medium text-sm">Identity Verified</div>
                    <div className="text-xs text-muted-foreground">Government ID verification</div>
                  </div>
                </div>
                {!trustScore.factors.identity_verified && (
                  <Link href="/helper/profile">
                    <Button size="sm" variant="outline">Verify Now</Button>
                  </Link>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded border">
                <div className="flex items-center gap-3">
                  <div className={`text-2xl ${trustScore.factors.background_check_passed ? '' : 'opacity-40 grayscale'}`}>
                    {trustScore.factors.background_check_passed ? '✅' : '❌'}
                  </div>
                  <div>
                    <div className="font-medium text-sm">Background Check</div>
                    <div className="text-xs text-muted-foreground">Police verification completed</div>
                  </div>
                </div>
                {!trustScore.factors.background_check_passed && (
                  <Link href="/helper/background-check">
                    <Button size="sm" variant="outline">Start Check</Button>
                  </Link>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded border">
                <div className="flex items-center gap-3">
                  <div className={`text-2xl ${trustScore.factors.insurance_active ? '' : 'opacity-40 grayscale'}`}>
                    {trustScore.factors.insurance_active ? '✅' : '❌'}
                  </div>
                  <div>
                    <div className="font-medium text-sm">Insurance Coverage</div>
                    <div className="text-xs text-muted-foreground">Professional liability protection</div>
                  </div>
                </div>
                {!trustScore.factors.insurance_active && (
                  <Link href="/helper/insurance">
                    <Button size="sm" variant="outline">Get Insured</Button>
                  </Link>
                )}
              </div>

              <div className="p-3 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm">Average Rating</div>
                    <div className="text-xs text-muted-foreground">Customer satisfaction</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-yellow-500">⭐</div>
                    <span className="font-semibold">{trustScore.factors.rating_average.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm">Completion Rate</div>
                    <div className="text-xs text-muted-foreground">{trustScore.factors.total_bookings} bookings completed</div>
                  </div>
                  <span className="font-semibold text-green-600">{trustScore.factors.completion_rate.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Background Checks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Background Checks</CardTitle>
              <Link href="/helper/background-check">
                <Button size="sm">Request New Check</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {backgroundChecks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🔒</div>
                <p className="text-sm text-muted-foreground mb-4">No background checks yet</p>
                <Link href="/helper/background-check">
                  <Button>Start Verification</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {backgroundChecks.map(check => (
                  <div key={check.id} className="flex items-center justify-between p-3 rounded border">
                    <div className="flex-1">
                      <div className="font-medium text-sm capitalize">{check.check_type.replace('_', ' ')}</div>
                      <div className="text-xs text-muted-foreground">
                        {check.verified_at ? `Verified ${new Date(check.verified_at).toLocaleDateString()}` : 'Not yet verified'}
                      </div>
                      {check.expires_at && (
                        <div className={`text-xs mt-1 ${isExpiringSoon(check.expires_at) ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                          {isExpiringSoon(check.expires_at) ? '⚠️ ' : ''}
                          Expires {new Date(check.expires_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCheckStatusColor(check.status)}`}>
                      {check.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Improvement Tips */}
        <Card>
          <CardHeader>
            <CardTitle>How to Improve Your Score</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary">💡</span>
                <div className="text-sm">
                  <div className="font-medium">Complete all verifications</div>
                  <div className="text-muted-foreground">Identity, background check, and insurance boost your score significantly</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">💡</span>
                <div className="text-sm">
                  <div className="font-medium">Maintain high ratings</div>
                  <div className="text-muted-foreground">Deliver quality service to earn 5-star reviews from customers</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">💡</span>
                <div className="text-sm">
                  <div className="font-medium">Complete more bookings</div>
                  <div className="text-muted-foreground">A consistent track record builds trust with new customers</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">💡</span>
                <div className="text-sm">
                  <div className="font-medium">Keep certifications current</div>
                  <div className="text-muted-foreground">Renew background checks and insurance before they expire</div>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
