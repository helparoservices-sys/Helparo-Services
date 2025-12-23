'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/ui/loading'
import { getHelperReviews } from '@/app/actions/review-responses'
import { Star, MessageSquare, ThumbsUp, Clock, Award, Home, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface Review {
  id: string
  rating: number
  comment: string | null
  punctuality_rating: number | null
  quality_rating: number | null
  behaviour_rating: number | null
  would_recommend: boolean | null
  tip_amount: number | null
  created_at: string
  customer_name: string
  customer_email: string
  customer_avatar: string | null
  service_title: string
  request_id: string
  response?: {
    response_text: string
    created_at: string
  } | null
}

export default function HelperRatingsPage() {
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const result = await getHelperReviews()
    if ('error' in result && result.error) {
      setError(result.error)
      toast.error(result.error)
    } else if ('data' in result && result.data) {
      setReviews(result.data.reviews)
    }
    setLoading(false)
  }

  const stats = {
    total: reviews.length,
    average: reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0,
    fiveStar: reviews.filter(r => r.rating === 5).length,
    fourStar: reviews.filter(r => r.rating === 4).length,
    threeStar: reviews.filter(r => r.rating === 3).length,
    twoStar: reviews.filter(r => r.rating === 2).length,
    oneStar: reviews.filter(r => r.rating === 1).length,
  }

  const getRatingPercentage = (count: number) => stats.total > 0 ? Math.round((count / stats.total) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/helper/dashboard" className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <Home className="w-4 h-4" /> Home
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-800 font-medium">Ratings</span>
        </div>
      </div>

      <div className="px-3 py-3 space-y-3">
        {/* Header Card */}
        <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
          <h1 className="text-lg font-bold text-emerald-600">Ratings & Reviews</h1>
          <p className="text-gray-500 text-xs">See what customers are saying about your service</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Rating Summary - Compact */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-3 text-center">
            <div className="text-4xl font-bold text-amber-500">{stats.average.toFixed(1)}</div>
            <div className="flex justify-center gap-0.5 mt-1.5">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-4 h-4 ${i <= Math.round(stats.average) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">{stats.total} reviews</p>
          </div>
        </div>

        {/* Rating Distribution - Compact */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
          <h2 className="font-semibold text-gray-800 text-sm mb-2">Rating Distribution</h2>
          <div className="space-y-1.5">
            {[
              { rating: 5, count: stats.fiveStar },
              { rating: 4, count: stats.fourStar },
              { rating: 3, count: stats.threeStar },
              { rating: 2, count: stats.twoStar },
              { rating: 1, count: stats.oneStar },
            ].map(({ rating, count }) => (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-5 flex items-center gap-0.5">
                  {rating}<Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${getRatingPercentage(count)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 w-6 text-right">{count}</span>
                <span className="text-xs text-gray-400 w-10 text-right">{getRatingPercentage(count)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List - Compact */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Reviews ({reviews.length})</h2>
          </div>
          
          {reviews.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No reviews yet</p>
              <p className="text-sm text-gray-400 mt-1">Complete jobs to receive reviews!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reviews.map(review => (
                <div key={review.id} className="p-4">
                  {/* Customer info & rating */}
                  <div className="flex items-start gap-3 mb-2">
                    {review.customer_avatar ? (
                      <img src={review.customer_avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-white text-sm font-semibold">
                        {review.customer_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-gray-800 text-sm truncate">{review.customer_name}</p>
                        {review.tip_amount && review.tip_amount > 0 && (
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            +₹{review.tip_amount} tip
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Service tag */}
                  <div className="mb-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {review.service_title}
                    </span>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                  )}

                  {/* Sub-ratings - compact inline */}
                  {(review.punctuality_rating || review.quality_rating || review.behaviour_rating) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {review.punctuality_rating && (
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {review.punctuality_rating}/5
                        </span>
                      )}
                      {review.quality_rating && (
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Award className="w-3 h-3" /> {review.quality_rating}/5
                        </span>
                      )}
                      {review.behaviour_rating && (
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" /> {review.behaviour_rating}/5
                        </span>
                      )}
                    </div>
                  )}

                  {/* Recommend badge */}
                  {review.would_recommend && (
                    <div className="mt-2">
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> Recommends you
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
