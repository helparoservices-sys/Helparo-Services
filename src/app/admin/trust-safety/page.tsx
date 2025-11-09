'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SkeletonCard } from '@/components/ui/loading'
import { SecurityFeatures } from '@/components/trust-badges'

interface BackgroundCheck {
  id: string
  helper_id: string
  check_type: string
  status: string
  result: string | null
  verified_at: string | null
  expires_at: string | null
  created_at: string
  helper: {
    name: string
    email: string
  }
}

interface TrustScore {
  helper_id: string
  score: number
  status: string
  verification_level: string
  last_updated: string
  helper: {
    name: string
    email: string
  }
}

export default function AdminTrustSafetyPage() {
  const [loading, setLoading] = useState(true)
  const [checks, setChecks] = useState<BackgroundCheck[]>([])
  const [trustScores, setTrustScores] = useState<TrustScore[]>([])
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'checks' | 'scores'>('checks')
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'expired'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')

    // For now, showing mock data since admin APIs would need to be created
    // In production, you would call:
    // const checksRes = await getAllBackgroundChecks()
    // const scoresRes = await getAllTrustScores()

    setChecks([])
    setTrustScores([])
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      verified: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
      expired: 'bg-gray-100 text-gray-700'
    }
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-700'
  }

  const getVerificationBadge = (level: string) => {
    const badges: Record<string, { color: string; icon: string }> = {
      basic: { color: 'bg-gray-100 text-gray-700', icon: '✓' },
      standard: { color: 'bg-blue-100 text-blue-700', icon: '✓✓' },
      premium: { color: 'bg-purple-100 text-purple-700', icon: '✓✓✓' },
      elite: { color: 'bg-yellow-100 text-yellow-700', icon: '⭐' }
    }
    return badges[level.toLowerCase()] || badges.basic
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false
    const daysUntilExpiry = Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const filteredChecks = checks.filter(check => {
    if (filter !== 'all' && check.status.toLowerCase() !== filter) return false
    if (searchTerm && !check.helper?.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !check.helper?.email.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const filteredScores = trustScores.filter(score => {
    if (searchTerm && !score.helper?.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !score.helper?.email.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const pendingChecks = checks.filter(c => c.status === 'pending').length
  const verifiedChecks = checks.filter(c => c.status === 'verified').length
  const expiredChecks = checks.filter(c => c.status === 'expired').length

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Trust & Safety Dashboard</h1>
          <p className="text-muted-foreground">Monitor background checks, verifications, and trust scores</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-primary">{checks.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Checks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingChecks}</div>
              <p className="text-sm text-muted-foreground mt-1">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600">{verifiedChecks}</div>
              <p className="text-sm text-muted-foreground mt-1">Verified</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-red-600">{expiredChecks}</div>
              <p className="text-sm text-muted-foreground mt-1">Expired</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-blue-600">{trustScores.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Trust Scores</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('checks')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'checks'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Background Checks ({checks.length})
          </button>
          <button
            onClick={() => setActiveTab('scores')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'scores'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Trust Scores ({trustScores.length})
          </button>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {activeTab === 'checks' && (
                <div className="flex gap-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('pending')}
                  >
                    Pending
                  </Button>
                  <Button
                    variant={filter === 'verified' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('verified')}
                  >
                    Verified
                  </Button>
                  <Button
                    variant={filter === 'expired' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('expired')}
                  >
                    Expired
                  </Button>
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="search"
                  placeholder="Search by helper name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : activeTab === 'checks' ? (
          filteredChecks.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">No background checks found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredChecks.map(check => (
                <Card key={check.id} className={isExpiringSoon(check.expires_at) ? 'border-yellow-300' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {check.helper?.name?.charAt(0).toUpperCase() || 'H'}
                        </div>
                        <div>
                          <div className="font-medium">{check.helper?.name || 'Unknown Helper'}</div>
                          <div className="text-sm text-muted-foreground">{check.helper?.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="font-medium capitalize">{check.check_type.replace('_', ' ')}</div>
                          <div className="text-sm text-muted-foreground">
                            {check.verified_at ? `Verified ${new Date(check.verified_at).toLocaleDateString()}` : 'Not verified'}
                          </div>
                          {check.expires_at && (
                            <div className={`text-xs mt-1 ${isExpiringSoon(check.expires_at) ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                              {isExpiringSoon(check.expires_at) && '⚠️ '}
                              Expires {new Date(check.expires_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}>
                          {check.status}
                        </span>

                        <Link href={`/admin/helpers/${check.helper_id}`}>
                          <Button size="sm" variant="outline">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          filteredScores.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center">No trust scores found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredScores.map(score => {
                const badge = getVerificationBadge(score.verification_level)
                return (
                  <Card key={score.helper_id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {score.helper?.name?.charAt(0).toUpperCase() || 'H'}
                          </div>
                          <div>
                            <div className="font-medium">{score.helper?.name || 'Unknown Helper'}</div>
                            <div className="text-sm text-muted-foreground">{score.helper?.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className={`text-3xl font-bold ${getScoreColor(score.score)}`}>{score.score}</div>
                            <div className="text-xs text-muted-foreground">Trust Score</div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(score.status)}`}>
                              {score.status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                              {badge.icon} {score.verification_level}
                            </span>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Last Updated</div>
                            <div className="text-sm font-medium">{new Date(score.last_updated).toLocaleDateString()}</div>
                          </div>

                          <Link href={`/admin/helpers/${score.helper_id}`}>
                            <Button size="sm" variant="outline">
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}
