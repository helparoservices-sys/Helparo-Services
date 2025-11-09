'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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
  verified_at: string | null
  expires_at: string | null
}

export default function CustomerHelperTrustPage() {
  const params = useParams()
  const helperId = params.id as string

  const [loading, setLoading] = useState(true)
  const [trustScore, setTrustScore] = useState<TrustScoreData | null>(null)
  const [backgroundChecks, setBackgroundChecks] = useState<BackgroundCheck[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (helperId) {
      loadData()
    }
  }, [helperId])

  const loadData = async () => {
    setLoading(true)
    setError('')

    const [scoreRes, checksRes] = await Promise.all([
      getHelperTrustScore(helperId),
      getHelperBackgroundChecks(helperId)
    ])

    if ('error' in scoreRes && scoreRes.error) {
      setError(scoreRes.error)
    } else if ('trustScore' in scoreRes) {
      setTrustScore(scoreRes.trustScore || null)
    }

    if ('error' in checksRes && checksRes.error) {
      setError(checksRes.error)
    } else if ('checks' in checksRes) {
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
      basic: { text: 'Basic Verified', color: 'bg-gray-100 text-gray-700', icon: '✓' },
      standard: { text: 'Standard Verified', color: 'bg-blue-100 text-blue-700', icon: '✓✓' },
      premium: { text: 'Premium Verified', color: 'bg-purple-100 text-purple-700', icon: '✓✓✓' },
      elite: { text: 'Elite Verified', color: 'bg-yellow-100 text-yellow-700', icon: '⭐' }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 py-10 px-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (error || !trustScore) {
    return (
      <div className="min-h-screen bg-primary-50 py-10 px-4">
        <div className="mx-auto max-w-4xl">
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-600">{error || 'Failed to load trust information'}</p>
              <Link href="/customer/bookings">
                <Button className="mt-4" variant="outline">← Back to Bookings</Button>
              </Link>
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
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/customer/bookings">
            <Button variant="outline" size="sm">← Back</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Helper Trust & Safety Information</h1>
            <p className="text-sm text-muted-foreground">Verified background and safety details</p>
          </div>
        </div>

        {/* Trust Score Card */}
        <Card className={`overflow-hidden border-2 ${scoreStyle.border}`}>
          <div className={`h-32 bg-gradient-to-r ${scoreStyle.gradient} flex items-center justify-center`}>
            <div className="text-center text-white">
              <div className="text-5xl font-bold mb-1">{trustScore.score}</div>
              <div className="text-lg font-semibold">Trust Score</div>
            </div>
          </div>
          
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Verification Level</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${verificationBadge.color}`}>
                {verificationBadge.icon} {verificationBadge.text}
              </span>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="text-sm font-medium">{new Date(trustScore.last_updated).toLocaleDateString()}</span>
            </div>

            <div className={`p-3 rounded ${scoreStyle.bg} border ${scoreStyle.border}`}>
              {trustScore.score >= 80 ? (
                <p className="text-sm text-green-800">
                  <strong>Highly Trusted:</strong> This helper has an excellent trust score with verified credentials and a strong track record.
                </p>
              ) : trustScore.score >= 60 ? (
                <p className="text-sm text-yellow-800">
                  <strong>Moderately Trusted:</strong> This helper has completed basic verifications and maintains a good reputation.
                </p>
              ) : (
                <p className="text-sm text-red-800">
                  <strong>Building Trust:</strong> This helper is in the process of completing verifications. Consider requesting additional documentation.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Verification Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded border">
              <div className="flex items-center gap-3">
                <div className={`text-2xl ${trustScore.factors.identity_verified ? '' : 'opacity-40 grayscale'}`}>
                  {trustScore.factors.identity_verified ? '✅' : '❌'}
                </div>
                <div>
                  <div className="font-medium text-sm">Identity Verified</div>
                  <div className="text-xs text-muted-foreground">Government ID verification completed</div>
                </div>
              </div>
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
            </div>

            <div className="flex items-center justify-between p-3 rounded border">
              <div className="flex items-center gap-3">
                <div className={`text-2xl ${trustScore.factors.insurance_active ? '' : 'opacity-40 grayscale'}`}>
                  {trustScore.factors.insurance_active ? '✅' : '❌'}
                </div>
                <div>
                  <div className="font-medium text-sm">Insurance Coverage</div>
                  <div className="text-xs text-muted-foreground">Professional liability protection active</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded border bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Average Rating</span>
                  <span className="text-yellow-500 text-lg">⭐</span>
                </div>
                <div className="text-2xl font-bold">{trustScore.factors.rating_average.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground mt-1">Out of 5.0</div>
              </div>

              <div className="p-4 rounded border bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Completion Rate</span>
                  <span className="text-green-500 text-lg">✓</span>
                </div>
                <div className="text-2xl font-bold">{trustScore.factors.completion_rate.toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground mt-1">Jobs completed successfully</div>
              </div>

              <div className="p-4 rounded border bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Jobs</span>
                  <span className="text-blue-500 text-lg">📋</span>
                </div>
                <div className="text-2xl font-bold">{trustScore.factors.total_bookings}</div>
                <div className="text-xs text-muted-foreground mt-1">Completed bookings</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Background Checks */}
        {backgroundChecks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Background Checks Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {backgroundChecks.filter(c => c.status === 'verified').map(check => (
                  <div key={check.id} className="flex items-center justify-between p-3 rounded border bg-white">
                    <div>
                      <div className="font-medium text-sm capitalize">{check.check_type.replace('_', ' ')}</div>
                      <div className="text-xs text-muted-foreground">
                        Verified {check.verified_at ? new Date(check.verified_at).toLocaleDateString() : 'recently'}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCheckStatusColor(check.status)}`}>
                      ✓ Verified
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Safety Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Safety Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Always communicate and make payments through the Helparo platform</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Request to see identification if you have any concerns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Report any suspicious behavior immediately to our support team</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Leave a review after service completion to help other customers</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
