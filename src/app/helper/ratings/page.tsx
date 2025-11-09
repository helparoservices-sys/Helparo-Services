'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getHelperRatingSummary, getHelperReviews } from '@/app/actions/reviews'

interface RatingSummary {
  helper_id: string
  total_reviews: number
  average_rating: number
  rating_5_count: number
  rating_4_count: number
  rating_3_count: number
  rating_2_count: number
  rating_1_count: number
}

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  customer: {
    email: string
  }
  photos: Array<{ photo_url: string }>
}

export default function HelperRatingsPage() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<RatingSummary | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')

    // Get user ID first
    const { supabase } = await import('@/lib/supabase/client')
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    const [summaryRes, reviewsRes] = await Promise.all([
      getHelperRatingSummary(user.id),
      getHelperReviews(user.id, 20)
    ])

    if ('error' in summaryRes && summaryRes.error) {
      setError(summaryRes.error)
    } else if ('summary' in summaryRes) {
      setSummary(summaryRes.summary)
    }

    if ('error' in reviewsRes && reviewsRes.error) {
      setError(reviewsRes.error)
      } else if ('reviews' in reviewsRes) {
      setReviews(reviewsRes.reviews || [])
    }

    setLoading(false)
  }

  const getRatingPercentage = (count: number, total: number) => {
    return total > 0 ? Math.round((count / total) * 100) : 0
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-500' : 'text-gray-300'}>
        ★
      </span>
    ))
  }

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Ratings & Reviews</h1>
          <p className="text-muted-foreground">See what customers are saying about your service</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Rating Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Rating Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {!summary || summary.total_reviews === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No reviews yet</p>
                    <p className="text-xs text-muted-foreground mt-2">Complete jobs to receive your first review!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Overall Rating */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-primary">{summary.average_rating.toFixed(1)}</div>
                        <div className="flex justify-center text-2xl mt-2">
                          {renderStars(Math.round(summary.average_rating))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{summary.total_reviews} reviews</p>
                      </div>

                      {/* Rating Breakdown */}
                      <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map(rating => {
                          const count = (summary as any)[`rating_${rating}_count`] || 0
                          const percentage = getRatingPercentage(count, summary.total_reviews)
                          
                          return (
                            <div key={rating} className="flex items-center gap-3">
                              <span className="text-sm w-8">{rating}★</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-yellow-500 transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm w-12 text-right text-muted-foreground">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {summary.rating_5_count + summary.rating_4_count}
                        </div>
                        <p className="text-xs text-muted-foreground">Positive Reviews</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {summary.rating_3_count}
                        </div>
                        <p className="text-xs text-muted-foreground">Neutral Reviews</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {summary.rating_2_count + summary.rating_1_count}
                        </div>
                        <p className="text-xs text-muted-foreground">Negative Reviews</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No reviews yet</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <div key={review.id} className="pb-4 border-b last:border-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{review.customer.email.split('@')[0]}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex text-lg mt-1">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                        </div>
                        
                        {review.comment && (
                          <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                        )}

                        {review.photos && review.photos.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {review.photos.map((photo, idx) => (
                              <div key={idx} className="w-20 h-20 rounded border overflow-hidden">
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <span className="text-2xl">📷</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
