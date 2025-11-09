'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SkeletonCard } from '@/components/ui/loading'
import { getReportedReviews, hideReview, reportReview } from '@/app/actions/reviews'

interface Review {
  id: string
  rating: number
  comment: string | null
  is_flagged: boolean
  is_approved: boolean
  created_at: string
  updated_at: string
  customer: {
    name: string
    avatar_url: string | null
  }
  helper: {
    name: string
    avatar_url: string | null
  }
  booking: {
    id: string
    category_name: string
  }
}

export default function AdminReviewsPage() {
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'flagged' | 'approved'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadReviews()
  }, [])

  useEffect(() => {
    filterReviews()
  }, [reviews, filter, searchTerm])

  const loadReviews = async () => {
    setLoading(true)
    setError('')

    const result = await getReportedReviews()

    if ('error' in result && result.error) {
      setError(result.error)
    } else if ('reviews' in result) {
      setReviews(result.reviews || [])
    }

    setLoading(false)
  }

  const filterReviews = () => {
    let filtered = reviews

    if (filter === 'pending') {
      filtered = filtered.filter(r => !r.is_approved)
    } else if (filter === 'flagged') {
      filtered = filtered.filter(r => r.is_flagged)
    } else if (filter === 'approved') {
      filtered = filtered.filter(r => r.is_approved)
    }

    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.helper?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.comment?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredReviews(filtered)
  }

  const handleFlag = async (reviewId: string) => {
    const reason = prompt('Enter reason for flagging this review:')
    if (!reason) return

    const result = await reportReview(reviewId, reason)

    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      await loadReviews()
    }
  }

  const handleApprove = async (reviewId: string) => {
    const result = await hideReview(reviewId)

    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      await loadReviews()
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-500' : 'text-gray-300'}>
        ★
      </span>
    ))
  }

  const pendingCount = reviews.filter(r => !r.is_approved).length
  const flaggedCount = reviews.filter(r => r.is_flagged).length
  const approvedCount = reviews.filter(r => r.is_approved).length

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Review Moderation</h1>
          <p className="text-muted-foreground">Monitor and moderate user reviews</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-primary">{reviews.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Reviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <p className="text-sm text-muted-foreground mt-1">Pending Approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-red-600">{flaggedCount}</div>
              <p className="text-sm text-muted-foreground mt-1">Flagged</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <p className="text-sm text-muted-foreground mt-1">Approved</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All ({reviews.length})
                </Button>
                <Button
                  variant={filter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('pending')}
                >
                  Pending ({pendingCount})
                </Button>
                <Button
                  variant={filter === 'flagged' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('flagged')}
                >
                  Flagged ({flaggedCount})
                </Button>
                <Button
                  variant={filter === 'approved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('approved')}
                >
                  Approved ({approvedCount})
                </Button>
              </div>
              <div className="flex-1">
                <Input
                  type="search"
                  placeholder="Search by helper, customer, or comment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">No reviews found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map(review => (
              <Card key={review.id} className={review.is_flagged ? 'border-red-300 bg-red-50/50' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {review.customer?.name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{review.customer?.name || 'Anonymous'}</div>
                          <div className="text-sm text-muted-foreground">
                            reviewed <Link href={`/admin/helpers/${review.helper?.name}`} className="text-primary hover:underline">
                              {review.helper?.name || 'Unknown Helper'}
                            </Link>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {review.booking?.category_name} • {new Date(review.created_at).toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 items-end">
                          <div className="flex gap-1 text-lg">
                            {renderStars(review.rating)}
                          </div>
                          <div className="flex gap-1">
                            {review.is_flagged && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                                🚩 Flagged
                              </span>
                            )}
                            {review.is_approved && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                ✓ Approved
                              </span>
                            )}
                            {!review.is_approved && !review.is_flagged && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                                ⏳ Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {review.comment && (
                        <div className="text-sm bg-white p-3 rounded border">
                          {review.comment}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t">
                        {!review.is_approved && (
                          <Button size="sm" variant="outline" onClick={() => handleApprove(review.id)}>
                            ✓ Approve
                          </Button>
                        )}
                        {!review.is_flagged && (
                          <Button size="sm" variant="outline" onClick={() => handleFlag(review.id)}>
                            🚩 Flag
                          </Button>
                        )}
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/bookings/${review.booking?.id}`}>
                            View Booking
                          </Link>
                        </Button>
                      </div>
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
