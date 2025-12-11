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
  Play,
  Flag,
  Shield,
  Camera,
  Image as ImageIcon,
  Banknote,
  CreditCard,
  Star as StarIcon,
  PartyPopper,
  Wallet
} from 'lucide-react'
import { toast } from 'sonner'

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
  onRateCustomer: (rating: number) => void
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
    await onRateCustomer(rating)
    setSubmitting(false)
    router.push('/helper/dashboard')
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
  const [loading, setLoading] = useState(true)
  const [startOtpInput, setStartOtpInput] = useState('')
  const [endOtpInput, setEndOtpInput] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadJobDetails()
    startLocationTracking()

    return () => {
      if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId)
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
        created_at: data.created_at,
        helper_accepted_at: data.helper_accepted_at || null,
        work_started_at: data.work_started_at || null,
        work_completed_at: data.work_completed_at || null,
        customer: data.customer || undefined,
        category: data.category || undefined
      }

      console.log('✅ Job loaded with OTPs:', { start_otp: transformedData.start_otp, end_otp: transformedData.end_otp })
      setJob(transformedData)
    } catch (error) {
      console.error('Failed to load job:', error)
      toast.error('Failed to load job details')
    } finally {
      setLoading(false)
    }
  }

  function startLocationTracking() {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          // Update helper location in database
          await supabase
            .from('service_requests')
            .update({
              helper_location_lat: position.coords.latitude,
              helper_location_lng: position.coords.longitude,
              helper_location_updated_at: new Date().toISOString()
            })
            .eq('id', requestId)

          // Also log to location history
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
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
      (error) => console.error('Location error:', error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
              total_jobs_completed: (helperProfile.total_jobs_completed || 0) + 1
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

  async function rateCustomer(rating: number) {
    if (!job?.customer?.id) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get helper profile
      const { data: helperProfile } = await supabase
        .from('helper_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!helperProfile) return

      // Save customer rating from helper
      await supabase
        .from('customer_ratings')
        .insert({
          customer_id: job.customer.id,
          helper_id: helperProfile.id,
          request_id: requestId,
          rating: rating,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
        .catch(() => {
          // Table might not exist, that's okay
          console.log('customer_ratings table might not exist')
        })

      toast.success('Thanks for your feedback!')
    } catch (error) {
      console.error('Failed to rate customer:', error)
    }
  }

  function callCustomer() {
    if (job?.customer?.phone) {
      window.location.href = `tel:${job.customer.phone}`
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
          <Button onClick={() => router.push('/helper/bookings')} className="mt-4">
            Go to Jobs
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-4 pt-6 pb-8">
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
        
        <h1 className="text-xl font-bold text-white mb-1">Active Job</h1>
        <p className="text-emerald-100 text-sm">Job #{job.id.slice(0, 8)}</p>
      </div>

      {/* Content */}
      <div className="px-4 -mt-4">
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
                      key={idx}
                      src={img}
                      alt={`Problem ${idx + 1}`}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  ))}
                </div>
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
                  <Play className="h-5 w-5 text-emerald-600" />
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
            </CardContent>
          </Card>
        )}

        {/* Work In Progress */}
        {job.work_started_at && !job.work_completed_at && (
          <>
            {/* Progress Indicator */}
            <Card className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardContent className="p-5">
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
