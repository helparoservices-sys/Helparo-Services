'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { 
  Star, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Award,
  Loader2,
  User
} from 'lucide-react'
import Link from 'next/link'

const ratingLabels = [
  { rating: 1, label: 'Poor', emoji: '😞', color: 'text-red-500' },
  { rating: 2, label: 'Fair', emoji: '😐', color: 'text-orange-500' },
  { rating: 3, label: 'Good', emoji: '🙂', color: 'text-yellow-500' },
  { rating: 4, label: 'Very Good', emoji: '😊', color: 'text-emerald-500' },
  { rating: 5, label: 'Excellent', emoji: '🤩', color: 'text-emerald-600' },
]

const quickReviews = [
  'Great customer!',
  'Very respectful',
  'Clear instructions',
  'On time',
  'Easy to work with',
  'Would serve again',
]

export default function HelperReviewPage() {
  const params = useParams<{ id: string }>()
  const requestId = params.id
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not authenticated'); setLoading(false); return }

      // Fetch request to validate state and get customer
      const { data: req, error: reqErr } = await supabase
        .from('service_requests')
        .select('id, customer_id, assigned_helper_id, status')
        .eq('id', requestId)
        .maybeSingle()
      if (reqErr || !req) { setError('Request not found'); setLoading(false); return }
      const reqTyped = req as { id: string; customer_id: string; assigned_helper_id: string | null; status: string }
      if (reqTyped.assigned_helper_id !== user.id) { setError('Not authorized'); setLoading(false); return }
      if (reqTyped.status !== 'completed') { setError('Request not completed yet'); setLoading(false); return }

      // Get customer name
      const { data: customer } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', reqTyped.customer_id)
        .maybeSingle()
      if (customer) setCustomerName((customer as any).full_name || 'Customer')

      // Check if already reviewed
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('request_id', requestId)
        .eq('reviewer_id', user.id)
        .eq('reviewee_id', reqTyped.customer_id)
        .maybeSingle()
      if (existing) setAlreadyReviewed(true)

      setLoading(false)
    }
    if (requestId) load()
  }, [requestId])

  const submit = async () => {
    setError('')
    setSubmitting(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    const { data: req } = await supabase
      .from('service_requests')
      .select('customer_id')
      .eq('id', requestId)
      .maybeSingle()
    const customerId = (req as any)?.customer_id
    if (!customerId) { setError('Missing customer'); setSubmitting(false); return }

    const payload = {
      request_id: requestId as string,
      reviewer_id: user.id,
      reviewee_id: customerId,
      rating,
      comment: comment.trim() || null,
    }
    const { error: insErr } = await (supabase.from('reviews') as any).insert(payload)
    if (insErr) { setError(insErr.message); setSubmitting(false); return }
    
    setSuccess(true)
    setTimeout(() => {
      router.push(`/helper/assigned`)
    }, 2000)
  }

  const addQuickReview = (text: string) => {
    setComment(prev => prev ? `${prev} ${text}` : text)
  }

  const currentRating = hoverRating || rating
  const ratingInfo = ratingLabels.find(r => r.rating === currentRating) || ratingLabels[4]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center animate-pulse">
            <Star className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Thank You! 🎉</h2>
          <p className="text-gray-600 mb-2">Your review has been submitted successfully.</p>
          <p className="text-sm text-blue-600">Redirecting you back...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="mx-auto max-w-lg">
        {/* Back Button */}
        <Link 
          href="/helper/assigned"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Jobs</span>
        </Link>

        {error ? (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Oops!</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        ) : alreadyReviewed ? (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Already Reviewed</h3>
            <p className="text-gray-600">You have already submitted a review for this customer.</p>
            <Link 
              href="/helper/assigned"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
            >
              Go Back
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <User className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Rate the Customer</h1>
                <p className="text-blue-100">
                  How was your experience with {customerName}?
                </p>
              </div>
            </div>

            {/* Rating Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Your Rating</h3>
              
              {/* Star Rating */}
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star 
                      className={`w-12 h-12 transition-colors ${
                        star <= currentRating 
                          ? 'text-amber-400 fill-amber-400' 
                          : 'text-gray-200'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Rating Label */}
              <div className="text-center mb-2">
                <span className="text-4xl">{ratingInfo.emoji}</span>
                <p className={`text-lg font-bold ${ratingInfo.color}`}>
                  {ratingInfo.label}
                </p>
              </div>
            </div>

            {/* Comment Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Share Your Feedback</h3>
              
              {/* Quick Reviews */}
              <div className="flex flex-wrap gap-2 mb-4">
                {quickReviews.map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => addQuickReview(text)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    {text}
                  </button>
                ))}
              </div>

              {/* Comment Textarea */}
              <textarea 
                className="w-full min-h-[120px] p-4 bg-gray-50 border-0 rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                placeholder="Tell us more about your experience... (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={submit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  Submit Review
                </>
              )}
            </button>

            {/* Helper Note */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <Award className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Your feedback helps maintain quality standards and improves the experience for everyone.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
