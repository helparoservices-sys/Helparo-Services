'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast-notification'

interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
}

interface Referral {
  id: string
  referrer_id: string
  referred_user_id: string | null
  referral_code: string
  status: 'initiated' | 'converted' | 'rewarded' | 'cancelled'
  created_at: string
  converted_at: string | null
  rewarded_at: string | null
  referrer: UserProfile | null
  referred_user: UserProfile | null
}

interface Stats {
  totalReferrals: number
  convertedReferrals: number
  rewardedReferrals: number
  conversionRate: number
}

interface ReferralsPageClientProps {
  referrals: Referral[]
  stats: Stats
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return 'Not yet'
  return new Date(dateString).toLocaleString('en-US', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'initiated':
      return 'bg-blue-100 text-blue-700'
    case 'converted':
      return 'bg-green-100 text-green-700'
    case 'rewarded':
      return 'bg-purple-100 text-purple-700'
    case 'cancelled':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

function getUserDisplayName(user: UserProfile | null): string {
  if (!user) return 'Unknown User'
  return user.full_name || user.email || 'Unnamed User'
}

function getUserInitials(user: UserProfile | null): string {
  if (!user) return 'U'
  const name = user.full_name || user.email || 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function ReferralsPageClient({ referrals, stats }: ReferralsPageClientProps) {
  const router = useRouter()
  const { showSuccess, showInfo } = useToast()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const handleRefresh = useCallback(() => {
    showInfo('Refreshing Referrals...', 'Fetching latest referral data')
    router.refresh()
  }, [router, showInfo])

  // Filter and search referrals
  const filteredReferrals = useMemo(() => {
    return referrals.filter(referral => {
      // Status filter
      if (statusFilter !== 'all' && referral.status !== statusFilter) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const referrerName = getUserDisplayName(referral.referrer).toLowerCase()
        const referredName = getUserDisplayName(referral.referred_user).toLowerCase()
        const code = referral.referral_code.toLowerCase()
        
        return referrerName.includes(query) || 
               referredName.includes(query) || 
               code.includes(query)
      }

      return true
    })
  }, [referrals, statusFilter, searchQuery])

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-slate-900 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold dark:text-white">Referral Management</h1>
            <p className="text-muted-foreground dark:text-slate-400">Monitor referral conversions and track rewards</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" className="dark:bg-slate-800 dark:text-white dark:border-slate-600">
            Refresh Data
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalReferrals}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Referrals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.convertedReferrals}</div>
              <p className="text-sm text-muted-foreground mt-1">Converted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.rewardedReferrals}</div>
              <p className="text-sm text-muted-foreground mt-1">Rewarded</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.conversionRate}%</div>
              <p className="text-sm text-muted-foreground mt-1">Conversion Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="initiated">Initiated</option>
              <option value="converted">Converted</option>
              <option value="rewarded">Rewarded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Search by referrer, referred user, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-80"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredReferrals.length} of {referrals.length} referrals
        </div>

        {/* Referrals List */}
        {filteredReferrals.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🎯</div>
                <p className="text-sm text-muted-foreground mb-4">
                  {referrals.length === 0 ? 'No referrals found' : 'No referrals match your filters'}
                </p>
                {referrals.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Referrals will appear here when users start referring friends
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReferrals.map((referral) => (
              <Card key={referral.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Main Info */}
                      <div className="flex items-start gap-4">
                        {/* Referrer */}
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">{getUserInitials(referral.referrer)}</span>
                          </div>
                          <div>
                            <p className="font-medium">{getUserDisplayName(referral.referrer)}</p>
                            <p className="text-xs text-muted-foreground">Referrer</p>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0 pt-3">
                          <div className="text-muted-foreground">→</div>
                        </div>

                        {/* Referred User */}
                        <div className="flex items-center gap-3">
                          {referral.referred_user ? (
                            <>
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-green-700">{getUserInitials(referral.referred_user)}</span>
                              </div>
                              <div>
                                <p className="font-medium">{getUserDisplayName(referral.referred_user)}</p>
                                <p className="text-xs text-muted-foreground">Referred User</p>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <span className="text-xs text-gray-500">?</span>
                              </div>
                              <div>
                                <p className="font-medium text-muted-foreground">Not yet converted</p>
                                <p className="text-xs text-muted-foreground">Pending signup</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Referral Code</p>
                          <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                            {referral.referral_code}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Created</p>
                          <p className="text-sm">{formatDateTime(referral.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Converted</p>
                          <p className="text-sm">{formatDateTime(referral.converted_at)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Rewarded</p>
                          <p className="text-sm">{formatDateTime(referral.rewarded_at)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      <Badge className={getStatusColor(referral.status)}>
                        {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                      </Badge>
                    </div>
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