'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { 
  Star, 
  ThumbsUp, 
  Clock, 
  Wrench, 
  Heart,
  Loader2,
  CheckCircle,
  User,
  Gift
} from 'lucide-react'
import { toast } from 'sonner'

interface JobDetails {
  id: string
  estimated_price: number
  assigned_helper?: {
    id: string
    user_id: string
    profile: {
      full_name: string
      avatar_url: string | null
    }
  } | null
  category?: {
    name: string
  }
}

const tipAmounts = [0, 20, 50, 100]

export default function RateHelperPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.id as string
  
  const [job, setJob] = useState<JobDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  // Rating states
  const [overallRating, setOverallRating] = useState(5)
  const [punctualityRating, setPunctualityRating] = useState(5)
  const [qualityRating, setQualityRating] = useState(5)
  const [behaviourRating, setBehaviourRating] = useState(5)
  const [review, setReview] = useState('')
  const [wouldRecommend, setWouldRecommend] = useState(true)
  const [tipAmount, setTipAmount] = useState(0)
  
  const supabase = createClient()

  const loadJobDetails = useCallback(async () => {
    try {
      // Use API to get job details with helper info
      const response = await fetch(`/api/requests/${requestId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load job')
      }

      const data = await response.json()

      // Check if already rated
      const { data: existingRating } = await supabase
        .from('job_ratings')
        .select('id')
        .eq('request_id', requestId)
        .single()

      if (existingRating) {
        setSubmitted(true)
      }

      // Transform the data from API response
      const helperName = data.assigned_helper?.profile?.full_name || 
                         data.assigned_helper?.full_name ||
                         'Helper'
      
      const transformedData: JobDetails = {
        id: data.id,
        estimated_price: data.estimated_price,
        category: data.category,
        assigned_helper: data.assigned_helper ? {
          id: data.assigned_helper.id,
          user_id: data.assigned_helper.user_id,
          profile: {
            full_name: helperName,
            avatar_url: data.assigned_helper.profile?.avatar_url || data.assigned_helper.avatar_url || null
          }
        } : null
      }

      setJob(transformedData)
    } catch (error) {
      console.error('Failed to load job:', error)
    } finally {
      setLoading(false)
    }
  }, [requestId, supabase])

  useEffect(() => {
    loadJobDetails()
  }, [loadJobDetails])

  async function submitRating() {
    if (!job?.assigned_helper) {
      toast.error('Invalid job data')
      return
    }

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get the helper_profiles.id (not user_id)
      // The assigned_helper.id from API should be helper_profiles.id
      // But we need to verify - if it's actually user_id, we need to look up helper_profiles
      let helperProfileId = job.assigned_helper.id
      
      // Check if we need to look up the helper_profiles.id
      if (job.assigned_helper.user_id && job.assigned_helper.id === job.assigned_helper.user_id) {
        // The id is actually user_id, we need to get helper_profiles.id
        const { data: helperProfile } = await supabase
          .from('helper_profiles')
          .select('id')
          .eq('user_id', job.assigned_helper.user_id)
          .single()
        
        if (helperProfile) {
          helperProfileId = helperProfile.id
        } else {
          throw new Error('Helper profile not found')
        }
      }

      // Insert rating
      const { error } = await supabase
        .from('job_ratings')
        .insert({
          request_id: requestId,
          customer_id: user.id,
          helper_id: helperProfileId,
          rating: overallRating,
          review: review.trim() || null,
          punctuality_rating: punctualityRating,
          quality_rating: qualityRating,
          behaviour_rating: behaviourRating,
          would_recommend: wouldRecommend,
          tip_amount: tipAmount
        })

      if (error) {
        console.error('Rating insert error:', error)
        throw error
      }

      // Update helper's average rating
      await supabase.rpc('update_helper_rating', {
        helper_uuid: helperProfileId
      })

      setSubmitted(true)
      toast.success('Thank you for your feedback!')

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/customer/dashboard')
      }, 2000)
    } catch (error) {
      console.error('Failed to submit rating:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit rating')
    } finally {
      setSubmitting(false)
    }
  }

  function StarRating({ 
    value, 
    onChange, 
    size = 'normal' 
  }: { 
    value: number
    onChange: (v: number) => void
    size?: 'normal' | 'large'
  }) {
    const starSize = size === 'large' ? 'w-10 h-10' : 'w-7 h-7'
    
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`${starSize} ${
                star <= value 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'fill-gray-200 text-gray-200'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-6">Your feedback helps us improve</p>
          <Button onClick={() => router.push('/customer/dashboard')}>
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 text-center">Rate Your Experience</h1>
        <p className="text-gray-500 text-sm text-center mt-1">
          Help {job?.assigned_helper?.profile?.full_name || 'the helper'} improve
        </p>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Helper Card */}
        <Card className="shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden relative">
                {job?.assigned_helper?.profile?.avatar_url ? (
                  <Image 
                    src={job.assigned_helper.profile.avatar_url} 
                    alt="" 
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">
                  {job?.assigned_helper?.profile?.full_name || 'Helper'}
                </p>
                <p className="text-sm text-gray-500">{job?.category?.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall Rating */}
        <Card className="shadow-md">
          <CardContent className="p-5 text-center">
            <p className="text-gray-600 mb-4">How was your overall experience?</p>
            <div className="flex justify-center mb-2">
              <StarRating value={overallRating} onChange={setOverallRating} size="large" />
            </div>
            <p className="text-sm text-gray-500">
              {overallRating === 5 && 'Excellent! 🌟'}
              {overallRating === 4 && 'Great! 😊'}
              {overallRating === 3 && 'Good 👍'}
              {overallRating === 2 && 'Fair 😐'}
              {overallRating === 1 && 'Poor 😞'}
            </p>
          </CardContent>
        </Card>

        {/* Detailed Ratings */}
        <Card className="shadow-md">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 mb-2">Rate the details</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="text-gray-700">Punctuality</span>
              </div>
              <StarRating value={punctualityRating} onChange={setPunctualityRating} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-orange-500" />
                <span className="text-gray-700">Work Quality</span>
              </div>
              <StarRating value={qualityRating} onChange={setQualityRating} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                <span className="text-gray-700">Behaviour</span>
              </div>
              <StarRating value={behaviourRating} onChange={setBehaviourRating} />
            </div>
          </CardContent>
        </Card>

        {/* Would Recommend */}
        <Card className="shadow-md">
          <CardContent className="p-5">
            <p className="text-gray-700 mb-3">Would you recommend this helper?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setWouldRecommend(true)}
                className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                  wouldRecommend 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                    : 'border-gray-200 text-gray-500'
                }`}
              >
                <ThumbsUp className={`h-5 w-5 mx-auto mb-1 ${wouldRecommend ? 'fill-emerald-500' : ''}`} />
                <span className="text-sm font-medium">Yes</span>
              </button>
              <button
                onClick={() => setWouldRecommend(false)}
                className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                  !wouldRecommend 
                    ? 'border-red-500 bg-red-50 text-red-700' 
                    : 'border-gray-200 text-gray-500'
                }`}
              >
                <ThumbsUp className={`h-5 w-5 mx-auto mb-1 rotate-180 ${!wouldRecommend ? 'fill-red-500' : ''}`} />
                <span className="text-sm font-medium">No</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Tip Section */}
        <Card className="shadow-md border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="h-5 w-5 text-amber-600" />
              <span className="font-semibold text-amber-800">Add a Tip (Optional)</span>
            </div>
            <p className="text-sm text-amber-700 mb-3">
              100% of tips go directly to the helper
            </p>
            <div className="flex gap-2">
              {tipAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTipAmount(amount)}
                  className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                    tipAmount === amount
                      ? 'border-amber-500 bg-amber-100 text-amber-700'
                      : 'border-amber-200 bg-white text-gray-600'
                  }`}
                >
                  <span className="text-sm font-bold">
                    {amount === 0 ? 'No Tip' : `₹${amount}`}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Written Review */}
        <Card className="shadow-md">
          <CardContent className="p-5">
            <p className="text-gray-700 mb-3">Write a review (optional)</p>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience with the helper..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-400 text-right mt-1">
              {review.length}/500
            </p>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          onClick={submitRating}
          disabled={submitting}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 text-base font-bold rounded-xl shadow-lg"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Submitting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Submit Rating
              {tipAmount > 0 && ` + ₹${tipAmount} Tip`}
            </span>
          )}
        </Button>

        {/* Skip Button */}
        <button
          onClick={() => router.push('/customer/dashboard')}
          className="w-full text-center text-gray-500 py-3 text-sm"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
