'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageLoader } from '@/components/admin/PageLoader'
import { getReportedReviews, hideReview, reportReview, approveReview } from '@/app/actions/reviews'
import { Star, MessageSquare, Flag, CheckCircle, Clock, AlertCircle, Search, Eye, ThumbsUp, Ban } from 'lucide-react'

interface Review {
  id: string
  rating: number
  review_text: string | null
  is_flagged: boolean
  is_moderated: boolean
  flag_reason?: string | null
  created_at: string
  updated_at: string
  customer: {
    full_name: string
    avatar_url: string | null
  }
  helper: {
    full_name: string
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
      filtered = filtered.filter(r => !r.is_moderated && !r.is_flagged)
    } else if (filter === 'flagged') {
      filtered = filtered.filter(r => r.is_flagged)
    } else if (filter === 'approved') {
      filtered = filtered.filter(r => !r.is_moderated && !r.is_flagged)
    }

    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.helper?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.review_text?.toLowerCase().includes(searchTerm.toLowerCase())
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
    if (!confirm('Approve this review and clear any flags?')) return

    const result = await approveReview(reviewId)

    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      await loadReviews()
    }
  }

  const handleHide = async (reviewId: string) => {
    if (!confirm('Hide this review from public view?')) return

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

  const pendingCount = reviews.filter(r => !r.is_moderated && !r.is_flagged).length
  const flaggedCount = reviews.filter(r => r.is_flagged).length
  const approvedCount = reviews.filter(r => !r.is_moderated && !r.is_flagged).length
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0'

  if (loading) {
    return <PageLoader text="Loading reviews..." />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Review Moderation</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor and moderate user reviews</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 backdrop-blur-xl rounded-lg border border-red-200 dark:border-red-800/50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Reviews</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{reviews.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-lg">
              <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">{avgRating} avg rating</span>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shadow-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Flagged</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{flaggedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shadow-lg">
              <Flag className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Approved</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{approvedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/70'
              }`}
            >
              All ({reviews.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/70'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('flagged')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'flagged'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/70'
              }`}
            >
              Flagged ({flaggedCount})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'approved'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800/70'
              }`}
            >
              Approved ({approvedCount})
            </button>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Search by helper, customer, or comment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg p-12 text-center">
          <MessageSquare className="h-16 w-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Reviews Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {searchTerm ? 'Try adjusting your search criteria' : 'No reviews match the selected filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map(review => (
            <div 
              key={review.id} 
              className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-lg border shadow-lg p-6 ${
                review.is_flagged ? 'border-red-300 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10' : 'border-white/20 dark:border-slate-700/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold shadow-lg">
                    {review.customer?.name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{review.customer?.full_name || 'Anonymous'}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        reviewed <span className="text-primary-600 dark:text-primary-400 font-medium">
                          {review.helper?.full_name || 'Unknown Helper'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {review.booking?.category_name} • {new Date(review.created_at).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 items-end">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star 
                            key={i} 
                            className={`h-5 w-5 ${
                              i < review.rating 
                                ? 'text-yellow-500 fill-yellow-500' 
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex gap-1">
                        {review.is_flagged && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                            <Flag className="h-3 w-3" />
                            Flagged
                          </span>
                        )}
                        {review.is_moderated && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400">
                            <Ban className="h-3 w-3" />
                            Hidden
                          </span>
                        )}
                        {!review.is_moderated && !review.is_flagged && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <CheckCircle className="h-3 w-3" />
                            Approved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {review.review_text && (
                    <div className="text-sm bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      {review.review_text}
                    </div>
                  )}

                  {review.flag_reason && (
                    <div className="text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                      <span className="font-medium">Flag Reason:</span> {review.flag_reason}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    {!review.is_moderated && review.is_flagged && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleApprove(review.id)}
                        className="inline-flex items-center gap-1"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Approve
                      </Button>
                    )}
                    {!review.is_flagged && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleFlag(review.id)}
                        className="inline-flex items-center gap-1"
                      >
                        <Flag className="h-4 w-4" />
                        Flag
                      </Button>
                    )}
                    {!review.is_moderated && (
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleHide(review.id)}
                        className="inline-flex items-center gap-1"
                      >
                        <Ban className="h-4 w-4" />
                        Hide
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
