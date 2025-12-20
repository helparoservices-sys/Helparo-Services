'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  IndianRupee, 
  Briefcase, 
  Star, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Search,
  Power,
  User,
  Phone,
  Navigation,
  MapPin,
  MessageSquare,
  Clock,
  CreditCard,
  Banknote,
  Camera,
  Play,
  Shield,
  Loader2,
  ChevronDown,
  ChevronUp,
  PartyPopper,
  X,
  Trophy,
  Sparkles,
  ThumbsUp
} from 'lucide-react'
import { getHelperDashboardStats } from '@/app/actions/helper-dashboard'
import { getHelperAssignedJobs } from '@/app/actions/assigned-jobs'
import { getHelperAvailability, toggleHelperAvailability } from '@/app/actions/helper-availability'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/components/auth/RoleGuard'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface AssignedJob {
  id: string
  title: string
  description: string
  category: string
  customer_name: string
  customer_phone: string | null
  location_address: string
  latitude: number | null
  longitude: number | null
  scheduled_time: string | null
  status: string
  amount: number
  notes?: string
}

// Extended job details for full view
interface FullJobDetails {
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
  videos: string[]
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
  service_type_details?: {
    videos?: string[]
    ai_analysis?: string
    pricing_tier?: string
    problem_duration?: string
    estimated_duration?: number
    helper_brings?: string[]
    customer_provides?: string[]
    work_overview?: string
    materials_needed?: string[]
  }
}

interface DashboardStats {
  earnings: {
    today: number
    thisWeek: number
    thisMonth: number
    pending: number
  }
  jobs: {
    active: number
    completed: number
    pending: number
    total: number
  }
  rating: {
    average: number
    totalReviews: number
  }
  verification: {
    isApproved: boolean
    status: string
  }
  recentJobs: Array<{
    id: string
    title: string
    customer_name: string
    status: string
    amount: number
    scheduled_time: string
  }>
  upcomingJobs: Array<{
    id: string
    title: string
    customer_name: string
    scheduled_time: string
    location: string
  }>
}

export default function HelperDashboard() {
  const router = useRouter()
  const { userId: cachedUserId } = useUser()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeJob, setActiveJob] = useState<AssignedJob | null>(null)
  const [fullJobDetails, setFullJobDetails] = useState<FullJobDetails | null>(null)
  const [activeJobChecked, setActiveJobChecked] = useState(false)
  const [error, setError] = useState('')
  const [isAvailableNow, setIsAvailableNow] = useState(false)
  const [togglingAvailability, setTogglingAvailability] = useState(false)
  const [userId, setUserId] = useState<string | null>(cachedUserId)
  
  // OTP inputs
  const [startOtpInput, setStartOtpInput] = useState('')
  const [endOtpInput, setEndOtpInput] = useState('')
  const [verifyingStart, setVerifyingStart] = useState(false)
  const [verifyingEnd, setVerifyingEnd] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  
  // UI state
  const [showPhotos, setShowPhotos] = useState(true)
  const [showVideos, setShowVideos] = useState(true)
  const [elapsedTime, setElapsedTime] = useState('00:00:00')
  const [elapsedMinutes, setElapsedMinutes] = useState(0)
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [completedJobDetails, setCompletedJobDetails] = useState<FullJobDetails | null>(null)

  const defaultStats: DashboardStats = {
    earnings: { today: 0, thisWeek: 0, thisMonth: 0, pending: 0 },
    jobs: { active: 0, completed: 0, pending: 0, total: 0 },
    rating: { average: 0, totalReviews: 0 },
    verification: { isApproved: false, status: '' },
    recentJobs: [],
    upcomingJobs: []
  }

  const isStatsLoading = loading || !stats
  const safeStats = stats || defaultStats
  const SkeletonLine = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className || ''}`} />
  )

  // Timer effect for elapsed time and color transition
  useEffect(() => {
    if (!fullJobDetails?.work_started_at || fullJobDetails?.work_completed_at) {
      return
    }

    const startTime = new Date(fullJobDetails.work_started_at).getTime()
    
    const updateTimer = () => {
      const now = Date.now()
      const diff = now - startTime
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      // Update elapsed minutes for gradient color change
      setElapsedMinutes(diff / 60000)
      
      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [fullJobDetails?.work_started_at, fullJobDetails?.work_completed_at])

  useEffect(() => {
    // Parallelize all initial data loading for faster startup
    const initializeDashboard = async () => {
      try {
        // If we have cached userId from RoleGuard, use it directly
        if (cachedUserId) {
          setUserId(cachedUserId)
        }
        
        // Run profile check and other loads in parallel
        const profileCheckPromise = checkProfile()
        const availabilityPromise = loadAvailability()
        const activeJobPromise = loadActiveJob()
        
        // Wait for all to complete
        await Promise.all([profileCheckPromise, availabilityPromise, activeJobPromise])
      } catch (err) {
        console.error('Dashboard initialization error:', err)
      }
    }
    
    initializeDashboard()
    
    return () => {
      if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId)
      }
    }
  }, [cachedUserId])
  
  // ✅ EGRESS FIX: Removed tab focus re-fetch
  // ✅ EGRESS FIX: Removed tab focus/visibility re-fetch
  // Dashboard updates via Realtime instead of polling on focus
  useEffect(() => {
    // No action needed - Realtime subscriptions handle all updates
    // Removed both visibilitychange and focus event listeners
    return () => {}
  }, [])
  
  // Load full job details when activeJob changes
  useEffect(() => {
    if (activeJob?.id) {
      loadFullJobDetails(activeJob.id)
      startLocationTracking(activeJob.id)
    } else {
      setFullJobDetails(null)
    }
  }, [activeJob?.id])

  const loadFullJobDetails = async (jobId: string) => {
    try {
      const response = await fetch(`/api/requests/${jobId}`)
      if (!response.ok) {
        console.error('Failed to load full job details')
        return
      }
      const data = await response.json()
      
      const serviceDetails = data.service_type_details || {}
      const videos = serviceDetails.videos || data.videos || []
      
      const transformedData: FullJobDetails = {
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

      setFullJobDetails(transformedData)
    } catch (error) {
      console.error('Failed to load full job details:', error)
    }
  }

  const startLocationTracking = (jobId: string) => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          await fetch(`/api/requests/${jobId}/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          })
        } catch (err) {
          console.error('Error updating location:', err)
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Please enable location access for live tracking')
        }
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
    )

    setLocationWatchId(watchId)
  }

  // Load the currently active job (assigned status)
  const loadActiveJob = async () => {
    console.log('🔄 loadActiveJob called')
    try {
      const result = await getHelperAssignedJobs()
      console.log('📋 getHelperAssignedJobs result:', result)
      if (result && Array.isArray(result.jobs)) {
        console.log('📋 All jobs:', result.jobs.map((j: AssignedJob) => ({ id: j.id, status: j.status, title: j.title })))
        const job = result.jobs.find((j: AssignedJob) => j.status === 'assigned')
        console.log('✅ Active job found:', job ? { id: job.id, status: job.status } : 'none')
        setActiveJob(job || null)
        
        // AUTO-FIX: If no active job but is_on_job flag might be stuck, reset it
        if (!job) {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: helperProfile } = await supabase
              .from('helper_profiles')
              .select('id, is_on_job')
              .eq('user_id', user.id)
              .single()
            
            if (helperProfile && helperProfile.is_on_job === true) {
              console.log('⚠️ AUTO-FIX: is_on_job=true but no active job found. Resetting flag.')
              await supabase
                .from('helper_profiles')
                .update({ is_on_job: false })
                .eq('id', helperProfile.id)
              console.log('✅ AUTO-FIX: is_on_job reset to false')
            }
          }
        }
      } else {
        console.log('❌ No jobs array in result')
        setActiveJob(null)
      }
    } catch (err) {
      console.error('❌ loadActiveJob error:', err)
      setActiveJob(null)
    } finally {
      setActiveJobChecked(true)
    }
  }

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    
    // Subscribe to service_requests assigned to this helper
    // This catches updates to already-assigned jobs
    const assignedChannel = supabase
      .channel('dashboard-assigned-jobs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'service_requests',
        filter: `assigned_helper_id=eq.${userId}`
      }, (payload) => {
        console.log('📬 Assigned job update received:', payload)
        // Refresh both stats and active job state (dashboard is locked when active job exists)
        loadDashboard()
        loadActiveJob()
      })
      .subscribe()
    
    // Subscribe to helper_profiles to catch when is_on_job changes
    // This fires when the helper accepts a job (is_on_job set to true)
    const helperProfileChannel = supabase
      .channel('dashboard-helper-profile')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'helper_profiles',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('👤 Helper profile update received:', payload)
        const newData = payload.new as { is_on_job?: boolean }
        // If is_on_job changed to true, we just accepted a job - refresh active job
        if (newData?.is_on_job === true) {
          console.log('🎯 is_on_job changed to true, refreshing active job')
          loadActiveJob()
          loadDashboard()
        }
      })
      .subscribe()
    
    // Also subscribe to notifications table to catch when we accept a new job
    // The accept API creates a notification for the customer, but we can also use this channel
    // to know something happened with our job assignments
    const notificationsChannel = supabase
      .channel('dashboard-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('🔔 New notification for helper:', payload)
        loadActiveJob()
      })
      .subscribe()

    return () => { 
      supabase.removeChannel(assignedChannel)
      supabase.removeChannel(helperProfileChannel)
      supabase.removeChannel(notificationsChannel)
    }
  }, [userId])

  const checkProfile = async () => {
    try {
      const supabase = createClient()
      
      // Use cached userId if available, otherwise fetch
      let currentUserId = cachedUserId
      
      if (!currentUserId) {
        // Use getSession for faster check (already validated by RoleGuard)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          setError('Not authenticated')
          setLoading(false)
          return
        }
        currentUserId = session.user.id
        setUserId(currentUserId)
      }

      // Parallel fetch both profiles at once
      const [userProfileResult, helperProfileResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('phone, phone_verified')
          .eq('id', currentUserId)
          .single(),
        supabase
          .from('helper_profiles')
          .select('address, service_categories')
          .eq('user_id', currentUserId)
          .maybeSingle()
      ])

      const userProfile = userProfileResult.data as { phone?: string | null; phone_verified?: boolean | null } | null

      if (!userProfile?.phone || !userProfile?.phone_verified) {
        router.push('/auth/complete-signup')
        return
      }

      const profile = helperProfileResult.data as { address?: string | null; service_categories?: unknown[] | null } | null

      if (!profile?.address || !profile?.service_categories?.length) {
        router.push('/helper/onboarding')
        return
      }

      loadDashboard()
    } catch {
      setError('Failed to check profile')
      setLoading(false)
    }
  }

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const result = await getHelperDashboardStats()
      if ('error' in result) {
        setError(result.error || 'Failed to load dashboard')
      } else if ('stats' in result) {
        setStats(result.stats)
      }
    } catch {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailability = async () => {
    try {
      const result = await getHelperAvailability()
      if (!('error' in result)) {
        setIsAvailableNow(result.isAvailableNow)
      }
    } catch { /* ignore */ }
  }

  const handleAvailabilityToggle = async (newValue: boolean) => {
    setTogglingAvailability(true)
    
    // If going online, capture current location
    let latitude: number | undefined
    let longitude: number | undefined
    
    if (newValue && navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          })
        })
        latitude = position.coords.latitude
        longitude = position.coords.longitude
        console.log('📍 Captured location for going online:', latitude, longitude)
      } catch (err) {
        console.log('⚠️ Could not get location for going online:', err)
      }
    }
    
    const result = await toggleHelperAvailability(newValue, latitude, longitude)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      setIsAvailableNow(newValue)
      toast.success(newValue ? 'You are now online' : 'You are now offline')
    }
    setTogglingAvailability(false)
  }

  // OTP Verification Functions
  const verifyStartOTP = async () => {
    if (!fullJobDetails || startOtpInput.length !== 6) {
      toast.error('Please enter 6-digit OTP')
      return
    }

    setVerifyingStart(true)
    try {
      if (startOtpInput !== fullJobDetails.start_otp) {
        throw new Error('Invalid OTP')
      }

      const supabase = createClient()
      const { error } = await supabase
        .from('service_requests')
        .update({
          status: 'assigned',
          broadcast_status: 'accepted',
          work_started_at: new Date().toISOString()
        })
        .eq('id', fullJobDetails.id)

      if (error) throw error

      toast.success('Work started! Good luck!')
      loadActiveJob()
      if (fullJobDetails.id) loadFullJobDetails(fullJobDetails.id)
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify OTP')
    } finally {
      setVerifyingStart(false)
    }
  }

  const verifyEndOTP = async () => {
    if (!fullJobDetails || endOtpInput.length !== 6) {
      toast.error('Please enter 6-digit OTP')
      return
    }

    setVerifyingEnd(true)
    try {
      if (endOtpInput !== fullJobDetails.end_otp) {
        throw new Error('Invalid OTP')
      }

      const supabase = createClient()
      
      // Calculate work duration
      const startTime = fullJobDetails.work_started_at ? new Date(fullJobDetails.work_started_at).getTime() : Date.now()
      const endTime = Date.now()
      const durationMs = endTime - startTime
      const durationMinutes = Math.floor(durationMs / 60000)
      
      const { error } = await supabase
        .from('service_requests')
        .update({
          status: 'completed',
          broadcast_status: 'completed',
          work_completed_at: new Date().toISOString()
        })
        .eq('id', fullJobDetails.id)

      if (error) throw error

      // Update helper's earnings
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: helperProfile } = await supabase
          .from('helper_profiles')
          .select('total_earnings, total_jobs_completed')
          .eq('user_id', user.id)
          .single()

        if (helperProfile) {
          await supabase
            .from('helper_profiles')
            .update({
              total_earnings: (helperProfile.total_earnings || 0) + fullJobDetails.estimated_price,
              total_jobs_completed: (helperProfile.total_jobs_completed || 0) + 1,
              is_on_job: false
            })
            .eq('user_id', user.id)
        }
      }

      // Store completed job details for the modal and show it
      setCompletedJobDetails({
        ...fullJobDetails,
        work_completed_at: new Date().toISOString()
      })
      setShowCompletionModal(true)
      
      // Clear active job state
      setActiveJob(null)
      setFullJobDetails(null)
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify OTP')
    } finally {
      setVerifyingEnd(false)
    }
  }
  
  const handleCompletionModalClose = () => {
    setShowCompletionModal(false)
    setCompletedJobDetails(null)
    loadActiveJob()
    loadDashboard()
  }

  const callCustomer = () => {
    if (fullJobDetails?.customer?.phone) {
      window.location.href = `tel:${fullJobDetails.customer.phone}`
    }
  }

  const messageCustomer = () => {
    if (fullJobDetails?.customer?.phone) {
      window.open(`https://wa.me/91${fullJobDetails.customer.phone}`, '_blank')
    }
  }

  const openNavigation = () => {
    if (fullJobDetails?.service_location_lat && fullJobDetails?.service_location_lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${fullJobDetails.service_location_lat},${fullJobDetails.service_location_lng}`,
        '_blank'
      )
    }
  }

  // Cancel job before work starts (helper cancellation)
  const cancelJob = async () => {
    if (!fullJobDetails || fullJobDetails.work_started_at) {
      toast.error('Cannot cancel - work has already started')
      return
    }
    
    if (!confirm('Are you sure you want to cancel this job? This may affect your rating.')) {
      return
    }
    
    setCancelling(true)
    try {
      const supabase = createClient()
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
      const response = await fetch(`/api/requests/${fullJobDetails.id}/rebroadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to re-broadcast job')
      }
      
      toast.success(`Job cancelled. ${data.helpersNotified} helpers notified.`)
      
      // Clear active job state
      setActiveJob(null)
      setFullJobDetails(null)
      loadDashboard()
    } catch (error: any) {
      console.error('Cancel error:', error)
      toast.error(error.message || 'Failed to cancel job')
    } finally {
      setCancelling(false)
    }
  }

  if (!isStatsLoading && activeJobChecked && (error || !stats)) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-600 dark:text-red-400">{error || 'Failed to load dashboard'}</p>
        <button onClick={loadDashboard} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">
          Retry
        </button>
      </div>
    )
  }

  const needsVerification = !isStatsLoading && (!safeStats.verification.isApproved || safeStats.verification.status !== 'approved')

  // Get gradient colors based on elapsed time (gradual transition over 30 mins)
  const getTimerGradient = () => {
    const minutes = elapsedMinutes
    
    // 0-10 mins: Green (emerald/teal)
    // 10-20 mins: Transition to Yellow/Amber
    // 20-30 mins: Transition to Orange
    // 30+ mins: Red/Rose
    
    if (minutes < 10) {
      // Pure green - emerald to teal
      return 'from-emerald-500 to-teal-600'
    } else if (minutes < 15) {
      // Green to yellow-green transition
      return 'from-emerald-500 to-lime-500'
    } else if (minutes < 20) {
      // Yellow-green to yellow
      return 'from-lime-500 to-yellow-500'
    } else if (minutes < 25) {
      // Yellow to amber
      return 'from-yellow-500 to-amber-500'
    } else if (minutes < 30) {
      // Amber to orange
      return 'from-amber-500 to-orange-500'
    } else if (minutes < 40) {
      // Orange to red-orange
      return 'from-orange-500 to-red-500'
    } else {
      // Red - urgent
      return 'from-red-500 to-rose-600'
    }
  }

  // Get text colors that match the gradient
  const getTimerTextColor = () => {
    const minutes = elapsedMinutes
    if (minutes < 10) return 'text-emerald-100'
    if (minutes < 20) return 'text-lime-100'
    if (minutes < 30) return 'text-amber-100'
    return 'text-red-100'
  }

  // If there is an active job, show FULL job details on home page
  if (activeJob && fullJobDetails) {
    const job = fullJobDetails
    const isCash = job.payment_method?.toLowerCase() === 'cash'
    const hasStarted = !!job.work_started_at
    const isCompleted = !!job.work_completed_at
    const timerGradient = getTimerGradient()
    const timerTextColor = getTimerTextColor()

    return (
      <div className="space-y-4 pb-6">
        {/* Header with Status - Color changes based on time */}
        <div className={`bg-gradient-to-r ${timerGradient} rounded-2xl p-4 text-white transition-all duration-1000`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`${timerTextColor} text-sm`}>Active Job</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              hasStarted ? 'bg-white/20 backdrop-blur-sm' : 'bg-amber-500'
            }`}>
              {hasStarted ? 'In Progress' : 'Waiting to Start'}
            </span>
          </div>
          <h2 className="text-xl font-bold">{job.title}</h2>
          <p className={`${timerTextColor} text-sm`}>#{job.id.slice(0, 8)}</p>
          
          {/* Timer */}
          {hasStarted && !isCompleted && (
            <div className="mt-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-mono text-lg">{elapsedTime}</span>
            </div>
          )}
        </div>

        {/* Customer Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 overflow-hidden flex items-center justify-center">
                {job.customer?.avatar_url ? (
                  <img src={job.customer.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-7 w-7 text-emerald-600" />
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900">{job.customer?.full_name || 'Customer'}</p>
                <p className="text-sm text-emerald-600">{job.customer?.phone || 'No phone'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={callCustomer}
                className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center"
              >
                <Phone className="h-5 w-5 text-emerald-600" />
              </button>
              <button
                onClick={messageCustomer}
                className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center"
              >
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Amount & Payment Method */}
        <div className={`rounded-xl p-4 ${isCash ? 'bg-amber-50 border-2 border-amber-200' : 'bg-blue-50 border-2 border-blue-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isCash ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800'}`}>
              {job.category?.name || 'Service'}
            </div>
          </div>
        </div>

        {/* Service Location */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start gap-3 mb-3">
            <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Service Location</p>
              <p className="text-gray-900 font-medium">{job.service_address}</p>
            </div>
          </div>
          
          {/* Map */}
          {job.service_location_lat && job.service_location_lng && (
            <div className="mb-3">
              <iframe
                title="Service Location"
                width="100%"
                height="180"
                className="rounded-lg border"
                loading="lazy"
                src={`https://www.google.com/maps?q=${job.service_location_lat},${job.service_location_lng}&z=16&output=embed`}
                allowFullScreen
              />
            </div>
          )}
          
          <button
            onClick={openNavigation}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            <Navigation className="h-5 w-5" />
            Navigate to Location
          </button>
        </div>

        {/* Job Description */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-2">Problem Description</h3>
          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{job.description || 'No description provided'}</p>
          
          {/* AI Analysis if available */}
          {job.service_type_details?.ai_analysis && (
            <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-xs text-purple-600 font-medium mb-1">🤖 AI Analysis</p>
              <p className="text-sm text-purple-800">{job.service_type_details.ai_analysis}</p>
            </div>
          )}

          {/* Work Overview */}
          {job.service_type_details?.work_overview && (
            <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="text-xs text-emerald-600 font-medium mb-1">📋 Work Overview</p>
              <p className="text-sm text-emerald-800">{job.service_type_details.work_overview}</p>
            </div>
          )}

          {/* Materials Needed */}
          {job.service_type_details?.materials_needed && job.service_type_details.materials_needed.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 font-medium mb-2">🔧 Materials You May Need</p>
              <div className="flex flex-wrap gap-2">
                {job.service_type_details.materials_needed.map((material, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {material}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Photos Section */}
        {job.images && job.images.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <button 
              onClick={() => setShowPhotos(!showPhotos)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-gray-600" />
                <span className="font-semibold text-gray-900">Problem Photos ({job.images.length})</span>
              </div>
              {showPhotos ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
            </button>
            
            {showPhotos && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {job.images.map((img, idx) => (
                  <img 
                    key={idx}
                    src={img}
                    alt={`Problem ${idx + 1}`}
                    className="w-full h-24 rounded-lg object-cover cursor-pointer hover:opacity-90"
                    onClick={() => window.open(img, '_blank')}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Videos Section */}
        {job.videos && job.videos.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <button 
              onClick={() => setShowVideos(!showVideos)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5 text-gray-600" />
                <span className="font-semibold text-gray-900">Problem Videos ({job.videos.length})</span>
              </div>
              {showVideos ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
            </button>
            
            {showVideos && (
              <div className="mt-3 space-y-3">
                {job.videos.map((video, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden bg-black">
                    <video
                      src={video}
                      controls
                      className="w-full h-44 object-contain"
                      preload="metadata"
                      playsInline
                    />
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                      Video {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* OTP Section - Start Work */}
        {!hasStarted && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5" />
              <h3 className="font-bold">Start Work - Enter OTP</h3>
            </div>
            <p className="text-amber-100 text-sm mb-3">Ask customer for the 6-digit START OTP to begin work</p>
            
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={startOtpInput}
                onChange={(e) => setStartOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/60 text-center text-xl tracking-widest font-mono"
              />
              <Button
                onClick={verifyStartOTP}
                disabled={verifyingStart || startOtpInput.length !== 6}
                className="bg-white text-amber-600 hover:bg-amber-50 font-bold px-6"
              >
                {verifyingStart ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Start'}
              </Button>
            </div>
          </div>
        )}

        {/* Cancel Job Button - Only visible before work starts */}
        {!hasStarted && (
          <div className="bg-white rounded-xl p-4 border border-red-200">
            <Button
              variant="outline"
              onClick={cancelJob}
              disabled={cancelling}
              className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Job
                </>
              )}
            </Button>
            <p className="text-xs text-gray-400 text-center mt-2">
              You can only cancel before entering the Start OTP
            </p>
          </div>
        )}

        {/* OTP Section - Complete Work */}
        {hasStarted && !isCompleted && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5" />
              <h3 className="font-bold">Complete Work - Enter OTP</h3>
            </div>
            <p className="text-emerald-100 text-sm mb-3">Ask customer for the 6-digit END OTP to complete the job</p>
            
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={endOtpInput}
                onChange={(e) => setEndOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/60 text-center text-xl tracking-widest font-mono"
              />
              <Button
                onClick={verifyEndOTP}
                disabled={verifyingEnd || endOtpInput.length !== 6}
                className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold px-6"
              >
                {verifyingEnd ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Complete'}
              </Button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={callCustomer}
            className="bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Phone className="h-5 w-5" />
            Call
          </button>
          <button
            onClick={messageCustomer}
            className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <MessageSquare className="h-5 w-5" />
            WhatsApp
          </button>
        </div>
      </div>
    )
  }

  const renderActiveJobSkeleton = () => (
    <div className="space-y-4 pb-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse h-48" />
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse h-32" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse" />
        <div className="h-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse" />
      </div>
    </div>
  )

  if (activeJob && !fullJobDetails) {
    return renderActiveJobSkeleton()
  }

  // ...existing code...
  return (
    <div className="space-y-4">
      {/* Online/Offline Toggle - Compact */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${isAvailableNow ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <Power className={`h-5 w-5 ${isAvailableNow ? 'text-white' : 'text-slate-400'}`} />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                {isAvailableNow ? "Online" : "Offline"}
              </p>
              <p className="text-xs text-slate-500">
                {isAvailableNow ? 'Receiving jobs' : 'Go online to work'}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleAvailabilityToggle(!isAvailableNow)}
            disabled={togglingAvailability}
            className={`relative h-8 w-14 rounded-full transition-all ${
              isAvailableNow ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
            } ${togglingAvailability ? 'opacity-50' : ''}`}
          >
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
              isAvailableNow ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Verification Alert - Compact */}
      {needsVerification && (
        <Link 
          href={safeStats.verification.status === 'pending' ? "/helper/verification" : "/helper/onboarding"}
          className="block bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="flex-1 font-medium text-amber-800 dark:text-amber-200 text-sm">
              {safeStats.verification.status === 'pending' ? 'Verification in progress' : 'Complete verification to start'}
            </p>
            <ArrowRight className="h-4 w-4 text-amber-600" />
          </div>
        </Link>
      )}

      {/* Stats - 4 columns on desktop, 2 on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-slate-500">Today</span>
          </div>
          {isStatsLoading ? (
            <SkeletonLine className="h-7 w-24" />
          ) : (
            <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{safeStats.earnings.today.toLocaleString()}</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-slate-500">Active</span>
          </div>
          {isStatsLoading ? <SkeletonLine className="h-7 w-16" /> : (
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{safeStats.jobs.active}</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-slate-500">Rating</span>
          </div>
          {isStatsLoading ? <SkeletonLine className="h-7 w-16" /> : (
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{safeStats.rating.average.toFixed(1)}</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-teal-600" />
            <span className="text-xs text-slate-500">Done</span>
          </div>
          {isStatsLoading ? <SkeletonLine className="h-7 w-16" /> : (
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{safeStats.jobs.completed}</p>
          )}
        </div>
      </div>

      {/* Find Jobs Button */}
      <Link 
        href={needsVerification ? "#" : "/helper/jobs"}
        className={`block bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl p-4 ${
          needsVerification ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98] transition-transform'
        }`}
        onClick={(e) => needsVerification && e.preventDefault()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5" />
            <span className="font-semibold">Find New Jobs</span>
          </div>
          <ArrowRight className="h-5 w-5" />
        </div>
      </Link>

      {/* Recent Jobs - Simple List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <span className="font-semibold text-slate-900 dark:text-white text-sm">Recent Jobs</span>
          <Link href="/helper/assigned" className="text-xs text-emerald-600 font-medium">View All</Link>
        </div>
        {isStatsLoading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-2.5">
                <div className="min-w-0 flex-1 space-y-1">
                  <SkeletonLine className="h-4 w-40" />
                  <SkeletonLine className="h-3 w-24" />
                </div>
                <div className="text-right ml-3 space-y-1">
                  <SkeletonLine className="h-4 w-12" />
                  <SkeletonLine className="h-3 w-14" />
                </div>
              </div>
            ))}
          </div>
        ) : safeStats.recentJobs.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No jobs yet</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {safeStats.recentJobs.slice(0, 5).map((job) => (
              <Link 
                key={job.id} 
                href="/helper/assigned"
                className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{job.title}</p>
                  <p className="text-xs text-slate-500">{job.customer_name}</p>
                </div>
                <div className="text-right ml-3">
                  <p className="text-sm font-bold text-emerald-600">₹{job.amount}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    job.status === 'completed' ? 'bg-green-100 text-green-700' :
                    job.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {job.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Job Completion Modal */}
      {showCompletionModal && completedJobDetails && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleCompletionModalClose} />
          
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-12 duration-500 max-h-[90vh] overflow-auto">
            {/* Success Header */}
            <div className="relative h-36 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-t-3xl sm:rounded-t-2xl overflow-hidden">
              {/* Confetti pieces */}
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-bounce"
                  style={{
                    width: `${4 + Math.random() * 6}px`,
                    height: `${8 + Math.random() * 8}px`,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    backgroundColor: ['#fff', '#ffd700', '#ff6b6b', '#4ade80', '#60a5fa'][i % 5],
                    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${0.6 + Math.random() * 0.4}s`,
                    opacity: 0.8
                  }}
                />
              ))}
              
              {/* Trophy Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl">
                  <Trophy className="w-10 h-10 text-emerald-600" />
                </div>
              </div>
              
              {/* Close button */}
              <button 
                onClick={handleCompletionModalClose}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="px-5 py-5 -mt-4 relative bg-white rounded-t-3xl">
              {/* Title */}
              <h2 className="text-xl font-bold text-center text-gray-800 mb-1">
                Job Completed! 🎉
              </h2>
              <p className="text-center text-gray-500 text-sm mb-4">
                Great work on {completedJobDetails.category?.name || 'this service'}!
              </p>

              {/* Earnings Card */}
              <div className={`rounded-2xl p-5 mb-4 relative overflow-hidden ${
                completedJobDetails.payment_method === 'cash' 
                  ? 'bg-amber-50 border-2 border-amber-200' 
                  : 'bg-emerald-50 border-2 border-emerald-200'
              }`}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/30 rounded-full -translate-x-8 -translate-y-12" />
                
                {completedJobDetails.payment_method === 'cash' ? (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-200 flex items-center justify-center">
                        <Banknote className="w-6 h-6 text-amber-700" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Collect Cash</p>
                        <p className="text-3xl font-black text-amber-700">₹{completedJobDetails.estimated_price}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-amber-200">
                      <p className="text-sm text-amber-700 font-medium flex items-center gap-2">
                        <span className="text-lg">💵</span>
                        Please collect ₹{completedJobDetails.estimated_price} from customer
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-200 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">You Earned</p>
                        <p className="text-3xl font-black text-emerald-700">₹{completedJobDetails.estimated_price}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-emerald-200">
                      <p className="text-sm text-emerald-700 font-medium flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Payment will be credited to your account
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Job Summary */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Job Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Service</span>
                    <span className="text-sm font-semibold text-gray-800">{completedJobDetails.category?.name || completedJobDetails.title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Customer</span>
                    <span className="text-sm font-semibold text-gray-800">{completedJobDetails.customer?.full_name || 'Customer'}</span>
                  </div>
                  {completedJobDetails.work_started_at && completedJobDetails.work_completed_at && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Duration</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {(() => {
                          const start = new Date(completedJobDetails.work_started_at!).getTime()
                          const end = new Date(completedJobDetails.work_completed_at!).getTime()
                          const mins = Math.floor((end - start) / 60000)
                          return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Motivational message */}
              <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3 mb-4 border border-blue-100">
                <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  Keep up the great work! Your rating helps build trust.
                </p>
              </div>

              {/* Action Button */}
              <Button 
                onClick={handleCompletionModalClose}
                className="w-full h-12 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl shadow-sm transition-colors"
              >
                <ThumbsUp className="w-5 h-5 mr-2" />
                Done - Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
