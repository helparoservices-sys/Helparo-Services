'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading'
import { getHelperReviews } from '@/app/actions/reviews'
import { respondToReview } from '@/app/actions/review-responses'
import { Star, TrendingUp, TrendingDown, MessageSquare, Send, Filter, Search } from 'lucide-react'
import { toast } from 'sonner'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  customer_name: string
  customer_email: string
  service_title: string
  response?: {
    response_text: string
    created_at: string
  }
}

export default function HelperRatingsPage() {
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterData()
  }, [reviews, searchQuery, filterRating])

  const loadData = async () => {
    setLoading(true)
    setError('')

    const result = await getHelperReviews()

    if ('error' in result && result.error) {
      setError(result.error)
      toast.error(result.error)
    } else if ('data' in result && result.data) {
      setReviews(result.data.reviews)
    }

    setLoading(false)
  }

  const filterData = () => {
    let filtered = reviews

    // Filter by rating
    if (filterRating !== null) {
      filtered = filtered.filter(r => r.rating === filterRating)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        r =>
          r.comment?.toLowerCase().includes(query) ||
          r.customer_name.toLowerCase().includes(query) ||
          r.service_title.toLowerCase().includes(query)
      )
    }

    setFilteredReviews(filtered)
  }

  const handleRespondToReview = async (reviewId: string) => {
    if (!responseText.trim()) {
      toast.error('Please enter a response')
      return
    }

    setSubmitting(true)

    const result = await respondToReview(reviewId, responseText.trim())

    if ('error' in result && result.error) {
      toast.error(result.error)
    } else {
      toast.success('Response submitted successfully')
      setResponseText('')
      setRespondingTo(null)
      loadData()
    }

    setSubmitting(false)
  }

  const calculateStats = () => {
    if (reviews.length === 0) {
      return {
        total: 0,
        average: 0,
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
        responseRate: 0,
      }
    }

    const total = reviews.length
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    const average = sum / total

    const fiveStar = reviews.filter(r => r.rating === 5).length
    const fourStar = reviews.filter(r => r.rating === 4).length
    const threeStar = reviews.filter(r => r.rating === 3).length
    const twoStar = reviews.filter(r => r.rating === 2).length
    const oneStar = reviews.filter(r => r.rating === 1).length

    const positive = fiveStar + fourStar
    const neutral = threeStar
    const negative = twoStar + oneStar

    const withResponses = reviews.filter(r => r.response).length
    const responseRate = Math.round((withResponses / total) * 100)

    return {
      total,
      average,
      fiveStar,
      fourStar,
      threeStar,
      twoStar,
      oneStar,
      positive,
      neutral,
      negative,
      responseRate,
    }
  }

  const stats = calculateStats()

  const getRatingPercentage = (count: number) => {
    return stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'
        }`}
      />
    ))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Ratings & Reviews
          </h1>
          <p className="text-gray-600 mt-1">See what customers are saying about your service</p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            {/* Rating Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overall Rating Card */}
              <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-6xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                      {stats.average.toFixed(1)}
                    </div>
                    <div className="flex justify-center gap-1 mt-3">
                      {renderStars(Math.round(stats.average))}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{stats.total} reviews</p>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-600">{stats.responseRate}% response rate</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rating Distribution */}
              <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardHeader>
                  <CardTitle>Rating Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { rating: 5, count: stats.fiveStar },
                      { rating: 4, count: stats.fourStar },
                      { rating: 3, count: stats.threeStar },
                      { rating: 2, count: stats.twoStar },
                      { rating: 1, count: stats.oneStar },
                    ].map(({ rating, count }) => {
                      const percentage = getRatingPercentage(count)

                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <button
                            onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                              filterRating === rating
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {rating} <Star className="h-3 w-3" />
                          </button>
                          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm w-12 text-right text-gray-600">{count}</span>
                          <span className="text-sm w-12 text-right text-gray-400">{percentage}%</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600">
                        <TrendingUp className="h-5 w-5" />
                        {stats.positive}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Positive</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{stats.neutral}</div>
                      <p className="text-xs text-gray-600 mt-1">Neutral</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-2xl font-bold text-red-600">
                        <TrendingDown className="h-5 w-5" />
                        {stats.negative}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Negative</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters & Search */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search reviews..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <Button
                    variant={filterRating !== null ? 'default' : 'outline'}
                    onClick={() => setFilterRating(null)}
                    className="gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    {filterRating !== null ? `${filterRating} Star` : 'All Ratings'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reviews List */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
              <CardHeader>
                <CardTitle>
                  Reviews ({filteredReviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 font-medium">No reviews found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {filterRating !== null || searchQuery
                        ? 'Try adjusting your filters'
                        : 'Complete jobs to receive your first review!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredReviews.map(review => (
                      <div
                        key={review.id}
                        className="pb-6 border-b last:border-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-medium">
                                {review.customer_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{review.customer_name}</p>
                                <p className="text-xs text-gray-500">{review.customer_email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex gap-1">{renderStars(review.rating)}</div>
                              <span className="text-xs text-gray-500">
                                {new Date(review.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-600 font-medium">
                            Service: {review.service_title}
                          </p>
                        </div>

                        {review.comment && (
                          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                        )}

                        {/* Helper Response */}
                        {review.response ? (
                          <div className="mt-4 ml-6 pl-4 border-l-2 border-blue-300 bg-blue-50 rounded-r-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900">Your Response</span>
                              <span className="text-xs text-blue-600">
                                {new Date(review.response.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-blue-900">{review.response.response_text}</p>
                          </div>
                        ) : (
                          <div className="mt-4">
                            {respondingTo === review.id ? (
                              <div className="space-y-3">
                                <textarea
                                  value={responseText}
                                  onChange={e => setResponseText(e.target.value)}
                                  placeholder="Write your response..."
                                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                  rows={3}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleRespondToReview(review.id)}
                                    disabled={submitting || !responseText.trim()}
                                    className="gap-2"
                                  >
                                    <Send className="h-4 w-4" />
                                    {submitting ? 'Submitting...' : 'Send Response'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setRespondingTo(null)
                                      setResponseText('')
                                    }}
                                    disabled={submitting}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRespondingTo(review.id)}
                                className="gap-2"
                              >
                                <MessageSquare className="h-4 w-4" />
                                Respond
                              </Button>
                            )}
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
