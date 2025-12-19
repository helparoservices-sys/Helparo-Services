'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Phone, 
  MessageSquare, 
  IndianRupee, 
  Clock, 
  Navigation,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Flag,
  Shield,
  Camera,
  Image as ImageIcon,
  Banknote,
  CreditCard,
  Star as StarIcon,
  PartyPopper,
  Wallet,
  Video,
  Play as PlayIcon
} from 'lucide-react'
import { toast } from 'sonner'

interface ServiceTypeDetails {
  videos?: string[]
  ai_analysis?: string
  pricing_tier?: string
  problem_duration?: string
  error_code?: string
  preferred_time?: string
  // AI estimation details
  estimated_duration?: number
  confidence?: number
  helper_brings?: string[]
  customer_provides?: string[]
  work_overview?: string
  materials_needed?: string[]
}

interface JobDetails {
  id: string
  title: string
  description: string
  status: string
  broadcast_status: string
  service_address: string
  estimated_price: number
  payment_method: string
  start_otp: string | null
  end_otp: string | null
  urgency_level: string
  service_location_lat: number
  service_location_lng: number
  images: string[]
  videos?: string[] // Direct videos array
  service_type_details?: ServiceTypeDetails // Contains videos and other details
  created_at: string
  helper_accepted_at: string | null
  work_started_at: string | null
  work_completed_at: string | null
  customer?: {
    id: string
    full_name: string
    phone: string
    avatar_url: string | null
  }
  category?: {
    name: string
  }
}

// Job Completion Modal Component
function JobCompletionModal({
  isOpen,
  job,
  onClose,
  onRateCustomer
}: {
  isOpen: boolean
  job: JobDetails
  onClose: () => void
  onRateCustomer: (rating: number) => Promise<boolean>
}) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  if (!isOpen) return null

  const isCash = job.payment_method?.toLowerCase() === 'cash'

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.error('Please rate the customer')
      return
    }
    setSubmitting(true)
    try {
      const success = await onRateCustomer(rating)
      if (success) {
        router.push('/helper/dashboard')
      }
    } catch (error) {
      console.error('Rating submission failed:', error)
      toast.error('Failed to submit rating. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = () => {
    router.push('/helper/dashboard')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Job Completed! 🎉</h2>
          <p className="text-emerald-100">Thanks for your excellent service</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Payment Info */}
          <div className={`rounded-xl p-4 ${isCash ? 'bg-amber-50 border-2 border-amber-200' : 'bg-blue-50 border-2 border-blue-200'}`}>
            <div className="flex items-center gap-3 mb-3">
              {isCash ? (
                <Banknote className="h-8 w-8 text-amber-600" />
              ) : (
                <CreditCard className="h-8 w-8 text-blue-600" />
              )}
              <div>
                <p className={`text-sm font-medium ${isCash ? 'text-amber-700' : 'text-blue-700'}`}>
                  {isCash ? 'Cash Payment' : 'UPI Payment'}
                </p>
                <p className={`text-2xl font-bold ${isCash ? 'text-amber-800' : 'text-blue-800'}`}>
                  ₹{job.estimated_price}
                </p>
              </div>
            </div>
            
            {isCash ? (
              <div className="bg-white rounded-lg p-3 border border-amber-200">
                <p className="text-amber-800 font-medium text-center">
                  💵 Please collect <span className="font-bold">₹{job.estimated_price}</span> from
                </p>
                <p className="text-amber-900 font-bold text-center text-lg mt-1">
                  {job.customer?.full_name || 'Customer'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <p className="text-blue-800 font-medium text-center">
                  🏦 Your money will be credited to your bank account
                </p>
                <p className="text-blue-600 text-sm text-center mt-1">
                  Expected within 24 hours
                </p>
              </div>
            )}
          </div>

          {/* Today's Earnings */}
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Added to Today's Earnings</span>
              </div>
              <span className="text-lg font-bold text-emerald-700">+₹{job.estimated_price}</span>
            </div>
          </div>

          {/* Rate Customer */}
          <div className="text-center">
            <p className="text-gray-700 font-medium mb-3">How was your experience with {job.customer?.full_name || 'the customer'}?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <StarIcon
                    className={`h-10 w-10 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {rating === 0 && 'Tap to rate'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Below Average'}
              {rating === 3 && 'Average'}
              {rating === 4 && 'Good'}
              {rating === 5 && 'Excellent!'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-3">
          <Button
            onClick={handleSubmitRating}
            disabled={submitting || rating === 0}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Submit Rating & Continue'
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full text-gray-500"
          >
            Skip for now
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

export default function HelperJobPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.id as string
  
  const [job, setJob] = useState<JobDetails | null>(null)
  const [videoSrcs, setVideoSrcs] = useState<string[]>([])
  const videoSrcsRef = useRef<string[]>([])
  const [loading, setLoading] = useState(true)
  const [startOtpInput, setStartOtpInput] = useState('')
  const [endOtpInput, setEndOtpInput] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00')
  const supabase = createClient()

  // Timer effect - updates elapsed time every second when work is in progress
  useEffect(() => {
    if (!job?.work_started_at || job?.work_completed_at) {
      return
    }

    const startTime = new Date(job.work_started_at).getTime()
    
    const updateTimer = () => {
      const now = Date.now()
      const diff = now - startTime
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }

    // Update immediately
    updateTimer()
    
    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [job?.work_started_at, job?.work_completed_at])

  useEffect(() => {
    loadJobDetails()
    startLocationTracking()

    // Subscribe to realtime updates for this request so helper UI reflects cancellations/updates
    const channel = supabase
      .channel(`helper-job-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `id=eq.${requestId}`,
        },
        (payload) => {
          console.log('Realtime update for job:', requestId, payload)
          // reload details to reflect status changes (e.g., cancelled)
          loadJobDetails()
        }
      )
      .subscribe((status) => {
        console.log('Subscribed to job updates:', status)
      })

    return () => {
      // Cleanup location watcher
      if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId)
      }
      // Remove supabase subscription
      try {
        supabase.removeChannel(channel)
      } catch (err) {
        console.warn('Failed to remove supabase channel', err)
      }
    }
  }, [requestId])

  async function loadJobDetails() {
    try {
      // Use API to bypass RLS and get full data including OTPs
      const response = await fetch(`/api/requests/${requestId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load job')
      }
      
      const data = await response.json()
      
      // Extract videos from service_type_details
      const serviceDetails = data.service_type_details || {}
      const videos = serviceDetails.videos || data.videos || []
      
      // Transform to match expected format
      const transformedData: JobDetails = {
        id: data.id,
        title: data.title || 'Service Request',
        description: data.description || '',
        status: data.status || 'open',
        broadcast_status: data.broadcast_status || 'accepted',
        service_address: data.service_address || data.address_line1 || 'Address not provided',
        estimated_price: data.estimated_price || 0,
        payment_method: data.payment_method || 'cash',
        start_otp: data.start_otp || null,
        end_otp: data.end_otp || null,
        urgency_level: data.urgency_level || 'normal',
        service_location_lat: data.service_location_lat || data.latitude || 0,
        service_location_lng: data.service_location_lng || data.longitude || 0,
        images: data.images || [],
        videos: videos,
        service_type_details: serviceDetails,
        created_at: data.created_at,
        helper_accepted_at: data.helper_accepted_at || null,
        work_started_at: data.work_started_at || null,
        work_completed_at: data.work_completed_at || null,
        customer: data.customer || undefined,
        category: data.category || undefined
      }

      console.log('✅ Job loaded with OTPs:', { start_otp: transformedData.start_otp, end_otp: transformedData.end_otp, videos: videos.length })
      setJob(transformedData)
      // Convert any base64/data: URLs to blob object URLs for better browser compatibility
      try {
        const rawVideos = videos || []
        const createUrls = await Promise.all(rawVideos.map(async (v: string) => {
          try {
            // If already an object URL or http(s), leave as-is
            if (v.startsWith('blob:') || v.startsWith('http')) return v
            const res = await fetch(v)
            const blob = await res.blob()
            return URL.createObjectURL(blob)
          } catch (err) {
            console.error('Failed to convert video to blob URL', err)
            return v
          }
        }))
        setVideoSrcs(createUrls)
        videoSrcsRef.current = createUrls
      } catch (err) {
        console.error('Error preparing video URLs', err)
      }

      // cleanup previous blob URLs when loading new job
      if (videoSrcsRef.current && videoSrcsRef.current.length > 0) {
        videoSrcsRef.current.forEach(url => {
          try { URL.revokeObjectURL(url) } catch { /* ignore */ }
        })
      }
      videoSrcsRef.current = []
    } catch (error) {
      console.error('Failed to load job:', error)
      toast.error('Failed to load job details')
    } finally {
      setLoading(false)
    }
  }

  function startLocationTracking() {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported')
      return
    }

    console.log('🚀 Starting location tracking...')

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          console.log('📍 Location update:', position.coords.latitude, position.coords.longitude)

          // Update helper location in service_requests for this job via API (bypasses RLS safely)
          try {
            const res = await fetch(`/api/requests/${requestId}/location`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }),
            })

            if (!res.ok) {
              const payload = await res.json().catch(() => ({}))
              console.error('Error updating service_requests location (API):', payload?.error || res.statusText)
            }
          } catch (err) {
            console.error('Error updating service_requests location (API):', err)
          }

          // Also update helper_profiles current location (for future jobs/fallback)
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { error: profileError } = await supabase
              .from('helper_profiles')
              .update({
                current_location_lat: position.coords.latitude,
                current_location_lng: position.coords.longitude
              })
              .eq('user_id', user.id)

            if (profileError) {
              console.error('Error updating helper_profiles location:', profileError)
            }

            // Also log to location history
            const { data: helperProfile } = await supabase
              .from('helper_profiles')
              .select('id')
              .eq('user_id', user.id)
              .single()

            if (helperProfile) {
              await supabase
                .from('helper_location_history')
                .insert({
                  helper_id: helperProfile.id,
                  request_id: requestId,
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy
                })
            }
          }
        } catch (error) {
          console.error('Failed to update location:', error)
        }
      },
      (error) => {
        console.error('Location error:', {
          code: error.code,
          message: error.message,
        })

        // Only show the "enable location" message when the browser explicitly denies permission.
        // Other errors (timeout/position unavailable) can happen even when permission is granted.
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Please enable location access for live tracking')
        }
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
    )

    setLocationWatchId(watchId)
  }

  async function verifyStartOTP() {
    if (!job || startOtpInput.length !== 6) {
      toast.error('Please enter 6-digit OTP')
      return
    }

    setVerifying(true)
    try {
      if (startOtpInput !== job.start_otp) {
        throw new Error('Invalid OTP')
      }

      // Update job status - use 'assigned' status (valid enum: draft, open, assigned, completed, cancelled)
      // broadcast_status valid values: pending, broadcasting, accepted, cancelled, completed, expired
      const { error } = await supabase
        .from('service_requests')
        .update({
          status: 'assigned',
          broadcast_status: 'accepted',
          work_started_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

      toast.success('Work started! Good luck!')
      loadJobDetails()
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify OTP')
    } finally {
      setVerifying(false)
    }
  }

  async function verifyEndOTP() {
    if (!job || endOtpInput.length !== 6) {
      toast.error('Please enter 6-digit OTP')
      return
    }

    setCompleting(true)
    try {
      if (endOtpInput !== job.end_otp) {
        throw new Error('Invalid OTP')
      }

      // Update job status
      const { error } = await supabase
        .from('service_requests')
        .update({
          status: 'completed',
          broadcast_status: 'completed',
          work_completed_at: new Date().toISOString()
        })
        .eq('id', requestId)

      if (error) throw error

      // Update helper's today earnings in helper_profiles
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Get current helper stats
        const { data: helperProfile } = await supabase
          .from('helper_profiles')
          .select('total_earnings, total_jobs_completed')
          .eq('user_id', user.id)
          .single()

        if (helperProfile) {
          // Update earnings and job count
          await supabase
            .from('helper_profiles')
            .update({
              total_earnings: (helperProfile.total_earnings || 0) + job.estimated_price,
              total_jobs_completed: (helperProfile.total_jobs_completed || 0) + 1,
              is_on_job: false
            })
            .eq('user_id', user.id)

          // Also log today's earning
          await supabase
            .from('helper_earnings')
            .insert({
              helper_id: user.id,
              request_id: requestId,
              amount: job.estimated_price,
              payment_method: job.payment_method,
              status: job.payment_method === 'cash' ? 'collected' : 'pending',
              earned_at: new Date().toISOString()
            })
            .select()
            .single()
            .catch(() => {
              // Table might not exist, that's okay
              console.log('helper_earnings table might not exist')
            })
        }
      }

      // Reload job details
      await loadJobDetails()
      
      // Show completion modal instead of redirecting
      setShowCompletionModal(true)
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify OTP')
    } finally {
      setCompleting(false)
    }
  }

  async function rateCustomer(rating: number): Promise<boolean> {
    if (!job?.customer?.id) {
      toast.error('Customer information not found')
      return false
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please login to rate')
        return false
      }

      // Get helper profile
      const { data: helperProfile, error: profileError } = await supabase
        .from('helper_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (profileError || !helperProfile) {
        console.error('Helper profile error:', profileError)
        toast.error('Could not find your helper profile')
        return false
      }

      // Save customer rating from helper
      const { error: ratingError } = await supabase
        .from('customer_ratings')
        .insert({
          customer_id: job.customer.id,
          helper_id: helperProfile.id,
          request_id: requestId,
          rating: rating,
          created_at: new Date().toISOString()
        })

      if (ratingError) {
        console.error('Rating insert error:', ratingError)
        // If table doesn't exist or other error, still allow user to proceed
        if (ratingError.code === '42P01') {
          console.log('customer_ratings table does not exist')
        } else {
          toast.error('Could not save rating, but you can continue')
        }
      } else {
        toast.success('Thanks for your feedback!')
      }

      return true
    } catch (error) {
      console.error('Failed to rate customer:', error)
      toast.error('Something went wrong')
      return false
    }
  }

  function callCustomer() {
    if (job?.customer?.phone) {
      window.location.href = `tel:${job.customer.phone}`
    }
  }

  // Cancel job before work starts (helper cancellation)
  async function cancelJob() {
    if (!job || job.work_started_at) {
      toast.error('Cannot cancel - work has already started')
      return
    }
    
    if (!confirm('Are you sure you want to cancel this job? This may affect your rating.')) {
      return
    }
    
    setCancelling(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please login')
        return
      }
      
      // Reset helper's is_on_job flag first
      await supabase
        .from('helper_profiles')
        .update({ is_on_job: false })
        .eq('user_id', user.id)
      
      // Call re-broadcast API to reset job and notify other helpers
      const response = await fetch(`/api/requests/${requestId}/rebroadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to re-broadcast job')
      }
      
      toast.success(`Job cancelled. ${data.helpersNotified} helpers notified.`)
      router.push('/helper/dashboard')
    } catch (error: any) {
      console.error('Cancel error:', error)
      toast.error(error.message || 'Failed to cancel job')
    } finally {
      setCancelling(false)
    }
  }

  function messageCustomer() {
    if (job?.customer?.phone) {
      window.open(`https://wa.me/91${job.customer.phone}`, '_blank')
    }
  }

  function openNavigation() {
    if (job?.service_location_lat && job?.service_location_lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${job.service_location_lat},${job.service_location_lng}`,
        '_blank'
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-800 font-semibold">Job not found</p>
          <Button onClick={() => router.push('/helper/assigned')} className="mt-4">
            Go to Jobs
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className={`px-4 pt-6 pb-8 ${job.status === 'cancelled' ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-white">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <Badge className="bg-white/20 text-white border-0">
            {job.category?.name}
          </Badge>
        </div>
        
        <h1 className="text-xl font-bold text-white mb-1">
          {job.status === 'cancelled' ? 'Cancelled Job' : 'Active Job'}
        </h1>
        <p className={`text-sm ${job.status === 'cancelled' ? 'text-red-100' : 'text-emerald-100'}`}>Job #{job.id.slice(0, 8)}</p>
      </div>

      {/* Content */}
      <div className="px-4 -mt-4">
        {/* Cancelled Status Banner */}
        {job.status === 'cancelled' && (
          <Card className="mb-4 bg-red-50 border-2 border-red-300 shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-7 w-7 text-red-500" />
                </div>
                <div>
                  <p className="font-bold text-red-700 text-lg">Booking Cancelled</p>
                  <p className="text-red-600 text-sm">The customer has cancelled this booking</p>
                </div>
              </div>
              <Button 
                onClick={() => router.push('/helper/assigned')} 
                className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white"
              >
                Return to My Jobs
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Customer Card */}
        <Card className="mb-4 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden">
                  {job.customer?.avatar_url ? (
                    <img src={job.customer.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {job.customer?.full_name || 'Customer'}
                  </p>
                  <p className="text-sm text-gray-500">Customer</p>
                </div>
              </div>
              
              {/* Contact Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={callCustomer}
                  className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"
                >
                  <Phone className="h-5 w-5 text-emerald-600" />
                </button>
                <button
                  onClick={messageCustomer}
                  className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"
                >
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </button>
              </div>
            </div>

            {/* Address with Navigation */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Service Location</p>
                    <p className="text-gray-800 font-medium">{job.service_address}</p>
                  </div>
                </div>
                <button
                  onClick={openNavigation}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                >
                  <Navigation className="h-4 w-4" />
                  Navigate
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card className="mb-4">
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Job Details</h3>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-gray-800">{job.description}</p>
            </div>

            {/* Job Images */}
            {job.images && job.images.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Problem Photos</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {job.images.map((img, idx) => (
                    <img 
                      key={`img-${idx}`}
                      src={img}
                      alt={`Problem ${idx + 1}`}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Job Videos */}
            {(job.videos && job.videos.length > 0) || (job.service_type_details?.videos && job.service_type_details.videos.length > 0) ? (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Problem Videos</p>
                <div className="space-y-3">
                  {(videoSrcs.length > 0 ? videoSrcs : (job.videos || job.service_type_details?.videos || [])).map((video, idx) => (
                    <div key={`video-${idx}`} className="relative rounded-lg overflow-hidden bg-black">
                      <video
                        src={video}
                        controls
                        className="w-full h-36 object-contain bg-black"
                        preload="metadata"
                        playsInline
                        onError={(e) => {
                          console.error('Video playback error for job:', job.id, { idx, src: video, e })
                          // show small inline hint to download
                        }}
                      />
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <PlayIcon className="h-3 w-3" />
                        <span>Video {idx + 1}</span>
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <a
                          href={video}
                          download={`job-${job.id}-video-${idx + 1}.mp4`}
                          className="text-xs bg-white/20 text-white px-2 py-1 rounded"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">🔊 Customer explains the problem in the video — if playback fails, please download and play locally</p>
              </div>
            ) : null}

            {/* AI Estimation Details */}
            {job.service_type_details && (job.service_type_details.work_overview || (job.service_type_details.helper_brings && job.service_type_details.helper_brings.length > 0)) && (
              <div className="mb-4 space-y-3">
                {/* Work Overview */}
                {job.service_type_details.work_overview && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                        <Flag className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-emerald-800">What You&apos;ll Do</h4>
                    </div>
                    <p className="text-sm text-gray-700">{job.service_type_details.work_overview}</p>
                  </div>
                )}

                {/* Helper Brings & Customer Provides */}
                <div className="grid grid-cols-2 gap-3">
                  {job.service_type_details.helper_brings && job.service_type_details.helper_brings.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <h4 className="font-semibold text-blue-700 text-sm mb-2 flex items-center gap-1">
                        🛠️ You Should Bring
                      </h4>
                      <ul className="space-y-1">
                        {job.service_type_details.helper_brings.map((item, idx) => (
                          <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {job.service_type_details.customer_provides && job.service_type_details.customer_provides.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                      <h4 className="font-semibold text-orange-700 text-sm mb-2 flex items-center gap-1">
                        👤 Customer Should Provide
                      </h4>
                      <ul className="space-y-1">
                        {job.service_type_details.customer_provides.map((item, idx) => (
                          <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Materials Needed */}
                {job.service_type_details.materials_needed && job.service_type_details.materials_needed.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                    <h4 className="font-semibold text-purple-700 text-sm mb-2">📦 Materials That May Be Needed</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.service_type_details.materials_needed.map((item, idx) => (
                        <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {item}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">* Additional materials cost will be informed to customer before purchase</p>
                  </div>
                )}

                {/* Duration & Confidence */}
                {(job.service_type_details.estimated_duration || job.service_type_details.confidence) && (
                  <div className="flex gap-3">
                    {job.service_type_details.estimated_duration && (
                      <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-emerald-600">~{job.service_type_details.estimated_duration}</p>
                        <p className="text-xs text-gray-500">min estimated</p>
                      </div>
                    )}
                    {job.service_type_details.confidence && (
                      <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-blue-600">{job.service_type_details.confidence}%</p>
                        <p className="text-xs text-gray-500">AI confidence</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold text-xl">
                  <IndianRupee className="h-5 w-5" />
                  {job.estimated_price}
                </div>
                <p className="text-xs text-gray-500 mt-1">Your Earnings</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-blue-600 font-bold text-xl capitalize">
                  {job.payment_method || 'Cash'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Payment</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Start Work OTP Section */}
        {!job.work_started_at && (
          <Card className="mb-4 border-2 border-emerald-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <PlayIcon className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Start Work</h3>
                  <p className="text-sm text-gray-500">Enter OTP from customer</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={startOtpInput}
                  onChange={(e) => setStartOtpInput(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-xl font-bold tracking-widest"
                />
                <Button
                  onClick={verifyStartOTP}
                  disabled={verifying || startOtpInput.length !== 6}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {verifying ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {/* Cancel Button - Only visible before work starts */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={cancelJob}
                  disabled={cancelling}
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Job
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-400 text-center mt-2">
                  You can only cancel before entering the Start OTP
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Work In Progress */}
        {job.work_started_at && !job.work_completed_at && (
          <>
            {/* Progress Indicator with Live Timer */}
            <Card className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Clock className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">Work In Progress</p>
                      <p className="text-blue-100 text-sm">
                        Started {new Date(job.work_started_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {/* Live Timer */}
                  <div className="text-right">
                    <div className="bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm">
                      <p className="text-3xl font-mono font-bold tracking-wider">{elapsedTime}</p>
                      <p className="text-xs text-blue-100 mt-0.5">Time Elapsed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Complete Work OTP Section */}
            <Card className="mb-4 border-2 border-blue-200">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Flag className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Complete Work</h3>
                    <p className="text-sm text-gray-500">Enter completion OTP from customer</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={endOtpInput}
                    onChange={(e) => setEndOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-xl font-bold tracking-widest"
                  />
                  <Button
                    onClick={verifyEndOTP}
                    disabled={completing || endOtpInput.length !== 6}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {completing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Completed Status */}
        {job.work_completed_at && (
          <Card className="mb-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-lg">Job Completed!</p>
                  <p className="text-emerald-100 text-sm">
                    ₹{job.estimated_price} will be credited to your wallet
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Safety Note */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
          <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800 font-medium">Safety Reminder</p>
            <p className="text-xs text-amber-700 mt-1">
              Always verify customer identity and get OTP before starting work. 
              Report any issues immediately through the SOS button.
            </p>
          </div>
        </div>
      </div>

      {/* Job Completion Modal */}
      {job && (
        <JobCompletionModal
          isOpen={showCompletionModal}
          job={job}
          onClose={() => setShowCompletionModal(false)}
          onRateCustomer={rateCustomer}
        />
      )}
    </div>
  )
}
