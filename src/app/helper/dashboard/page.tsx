'use client'

import { useEffect, useState } from 'react'
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
  Navigation
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading'
import { getHelperDashboardStats } from '@/app/actions/helper-dashboard'
import { getHelperAssignedJobs } from '@/app/actions/assigned-jobs'
import { getHelperAvailability, toggleHelperAvailability } from '@/app/actions/helper-availability'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

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
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeJob, setActiveJob] = useState<AssignedJob | null>(null)
  const [error, setError] = useState('')
  const [isAvailableNow, setIsAvailableNow] = useState(false)
  const [togglingAvailability, setTogglingAvailability] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    checkProfile()
    loadAvailability()
    loadActiveJob()
  }, [])
  // Load the currently active job (accepted/in_progress)
  const loadActiveJob = async () => {
    try {
      const result = await getHelperAssignedJobs()
      if ('jobs' in result) {
        const job = result.jobs.find((j: AssignedJob) => ['accepted', 'in_progress'].includes(j.status))
        setActiveJob(job || null)
      }
    } catch {
      setActiveJob(null)
    }
  }

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    const channel = supabase
      .channel('dashboard-jobs-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'service_requests',
        filter: `assigned_helper_id=eq.${userId}`
      }, () => loadDashboard())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const checkProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        setError('Not authenticated')
        setLoading(false)
        return
      }
      setUserId(user.id)

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('phone, phone_verified')
        .eq('id', user.id)
        .single()

      if (!userProfile?.phone || !userProfile?.phone_verified) {
        router.push('/auth/complete-signup')
        return
      }

      const { data: profile } = await supabase
        .from('helper_profiles')
        .select('address, service_categories')
        .eq('user_id', user.id)
        .maybeSingle()

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
    const result = await toggleHelperAvailability(newValue)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      setIsAvailableNow(newValue)
      toast.success(newValue ? 'You are now online' : 'You are now offline')
    }
    setTogglingAvailability(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-600 dark:text-red-400">{error || 'Failed to load dashboard'}</p>
        <button onClick={loadDashboard} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">
          Retry
        </button>
      </div>
    )
  }

  const needsVerification = !stats.verification.isApproved || stats.verification.status !== 'approved'

  // If there is an active job, show it as the main dashboard card
  if (activeJob) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <User className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-lg text-slate-900 dark:text-white">{activeJob.customer_name}</p>
              {activeJob.customer_phone && (
                <a href={`tel:${activeJob.customer_phone}`} className="text-emerald-600 text-sm hover:underline">{activeJob.customer_phone}</a>
              )}
            </div>
          </div>
          <div className="mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Job:</span> {activeJob.title}
          </div>
          <div className="mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Description:</span> {activeJob.description}
          </div>
          <div className="mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Category:</span> {activeJob.category}
          </div>
          <div className="mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Address:</span> {activeJob.location_address}
          </div>
          {activeJob.scheduled_time && (
            <div className="mb-2">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Scheduled:</span> {new Date(activeJob.scheduled_time).toLocaleString()}
            </div>
          )}
          {activeJob.notes && (
            <div className="mb-2">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Notes:</span> {activeJob.notes}
            </div>
          )}
          <div className="mb-4">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Amount:</span> <span className="text-emerald-700 font-bold">₹{activeJob.amount}</span>
          </div>
          {/* Route Map */}
          {activeJob.latitude && activeJob.longitude && (
            <div className="mb-4">
              <iframe
                title="Route Map"
                width="100%"
                height="200"
                className="rounded-lg border"
                loading="lazy"
                src={`https://www.google.com/maps/embed/v1/directions?key=YOUR_GOOGLE_MAPS_API_KEY&destination=${activeJob.latitude},${activeJob.longitude}`}
                allowFullScreen
              />
            </div>
          )}
          <div className="flex gap-3 mt-4">
            {activeJob.customer_phone && (
              <a href={`tel:${activeJob.customer_phone}`} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" /> Call
              </a>
            )}
            {activeJob.latitude && activeJob.longitude && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activeJob.latitude},${activeJob.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
              >
                <Navigation className="h-4 w-4" /> Navigate
              </a>
            )}
          </div>
          <div className="mt-6">
            <Link href={`/helper/jobs/${activeJob.id}`} className="text-emerald-700 underline font-medium">View Full Job Details</Link>
          </div>
        </div>
      </div>
    )
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
          href={stats.verification.status === 'pending' ? "/helper/verification" : "/helper/onboarding"}
          className="block bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="flex-1 font-medium text-amber-800 dark:text-amber-200 text-sm">
              {stats.verification.status === 'pending' ? 'Verification in progress' : 'Complete verification to start'}
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
          <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{stats.earnings.today.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-slate-500">Active</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.jobs.active}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-slate-500">Rating</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.rating.average.toFixed(1)}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-teal-600" />
            <span className="text-xs text-slate-500">Done</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.jobs.completed}</p>
        </div>
      </div>

      {/* Find Jobs Button */}
      <Link 
        href={needsVerification ? "#" : "/helper/requests"}
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
        {stats.recentJobs.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No jobs yet</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {stats.recentJobs.slice(0, 5).map((job) => (
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
    </div>
  )
}
