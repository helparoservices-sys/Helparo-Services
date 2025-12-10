'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  DollarSign, 
  Briefcase, 
  Star, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Shield,
  Search,
  Wallet,
  FileText,
  TrendingUp,
  Power
} from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading'
import { getHelperDashboardStats } from '@/app/actions/helper-dashboard'
import { getHelperAvailability, toggleHelperAvailability } from '@/app/actions/helper-availability'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

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
  const [error, setError] = useState('')
  const [isAvailableNow, setIsAvailableNow] = useState(false)
  const [togglingAvailability, setTogglingAvailability] = useState(false)

  useEffect(() => {
    checkProfile()
    loadAvailability()
  }, [])

  const checkProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Auth error:', authError)
        setError('Not authenticated')
        setLoading(false)
        return
      }

      // Check if phone is verified - redirect to complete-profile if not
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('phone, phone_verified')
        .eq('id', user.id)
        .single()

      if (!userProfile?.phone || !userProfile?.phone_verified) {
        router.push('/auth/complete-signup')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('helper_profiles')
        .select('address, service_categories')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        setError('Failed to load profile')
        setLoading(false)
        return
      }

      // Redirect to onboarding if profile incomplete
      if (!profile?.address || !profile?.service_categories?.length) {
        router.push('/helper/onboarding')
        return
      }

      loadDashboard()
    } catch (err) {
      console.error('Check profile error:', err)
      setError('Failed to check profile')
      setLoading(false)
    }
  }

  const loadDashboard = async () => {
    try {
      setLoading(true)
      console.log('Loading dashboard stats...')
      const result = await getHelperDashboardStats()
      
      console.log('Dashboard result:', result)
      
      if ('error' in result) {
        setError(result.error || 'Failed to load dashboard')
      } else if ('stats' in result) {
        setStats(result.stats)
      }
    } catch (err) {
      console.error('Load dashboard error:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailability = async () => {
    try {
      const result = await getHelperAvailability()
      console.log('🔍 Dashboard received availability:', result)
      if ('error' in result) {
        console.error('Failed to load availability:', result.error)
      } else {
        console.log('✅ Setting state:', { isAvailableNow: result.isAvailableNow })
        setIsAvailableNow(result.isAvailableNow)
      }
    } catch (err) {
      console.error('Load availability error:', err)
    }
  }

  const handleAvailabilityToggle = async (newValue: boolean) => {
    setTogglingAvailability(true)
    const result = await toggleHelperAvailability(newValue)
    
    if ('error' in result) {
      toast.error(result.error)
    } else {
      setIsAvailableNow(newValue)
      toast.success(newValue ? 'You are now available for jobs' : 'You are now unavailable')
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
        <button 
          onClick={loadDashboard}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const needsVerification = !stats.verification.isApproved || stats.verification.status !== 'approved'

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              Helper Dashboard
              {!needsVerification && <CheckCircle className="h-6 w-6" />}
            </h1>
            <p className="text-purple-100">Track your earnings and manage your service requests</p>
          </div>
          {!needsVerification && (
            <div className="hidden md:flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
              <Shield className="h-5 w-5" />
              <span className="font-medium">Verified Helper</span>
            </div>
          )}
        </div>
      </div>

      {/* Verification Alert */}
      {needsVerification && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white shadow-lg border-2 border-amber-400">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                Complete Verification to Start Earning
              </h2>
              <p className="text-amber-50 mb-4">
                {stats.verification.status === 'pending' 
                  ? 'Your profile is under review. Our team will verify your details within 24-48 hours.'
                  : 'Upload your documents and complete your profile to receive job assignments and start earning money.'}
              </p>
              {stats.verification.status === 'pending' ? (
                <Link
                  href="/helper/verification"
                  className="inline-flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors shadow-md"
                >
                  <FileText className="h-5 w-5" />
                  View Verification Status
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <Link
                  href="/helper/onboarding"
                  className="inline-flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors shadow-md"
                >
                  Complete Verification Now
                  <ArrowRight className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Availability Control */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className={`p-6 transition-colors ${isAvailableNow ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl transition-all ${
                isAvailableNow 
                  ? 'bg-green-500 shadow-lg shadow-green-500/30' 
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                <Power className={`h-7 w-7 ${isAvailableNow ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isAvailableNow ? "You're Online" : "You're Offline"}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                  {isAvailableNow 
                    ? 'You are visible to customers and can receive job requests' 
                    : 'Go online to start accepting job requests'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleAvailabilityToggle(!isAvailableNow)}
              disabled={togglingAvailability}
              className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isAvailableNow 
                  ? 'bg-green-600 focus:ring-green-500 shadow-lg shadow-green-500/30' 
                  : 'bg-slate-300 dark:bg-slate-600 focus:ring-slate-500'
              } ${togglingAvailability ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-md transition-transform ${
                  isAvailableNow ? 'translate-x-10' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Status indicator */}
        <div className={`px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center text-xs ${
          isAvailableNow ? 'bg-green-50/50 dark:bg-green-900/10' : 'bg-slate-50 dark:bg-slate-900/30'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${isAvailableNow ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
            <span className="text-slate-600 dark:text-slate-400">
              {isAvailableNow ? 'Accepting job requests' : 'Not accepting jobs'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Today's Earnings</span>
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{stats.earnings.today.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">This week: ₹{stats.earnings.thisWeek.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Active Jobs</span>
            <Briefcase className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.jobs.active}</p>
          <p className="text-xs text-slate-500 mt-1">In progress</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Average Rating</span>
            <Star className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.rating.average.toFixed(1)}</p>
          <p className="text-xs text-slate-500 mt-1">{stats.rating.totalReviews} reviews</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Completed</span>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.jobs.completed}</p>
          <p className="text-xs text-slate-500 mt-1">Total jobs done</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          href={needsVerification ? "/helper/verification" : "/helper/requests"}
          className={`${needsVerification ? 'opacity-60 cursor-not-allowed' : ''} bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group`}
          onClick={(e) => needsVerification && e.preventDefault()}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">Browse Requests</h3>
          </div>
          <p className="text-sm text-purple-100 mb-3">Find service requests and submit bids</p>
          {needsVerification && (
            <div className="text-xs bg-white/20 px-3 py-1 rounded-full inline-flex items-center gap-1">
              <Shield className="h-3 w-3" /> Verification required
            </div>
          )}
          {!needsVerification && (
            <div className="flex items-center text-sm font-medium group-hover:gap-2 transition-all">
              Browse Now <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          )}
        </Link>

        {/* === HIDDEN FOR PLAY STORE DEPLOYMENT - MY WALLET CARD ===
        * TODO: Uncomment when payment integration is complete
        <Link 
          href="/helper/wallet"
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Wallet className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">My Wallet</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Pending: ₹{stats.earnings.pending.toLocaleString()}</p>
          <div className="flex items-center text-sm font-medium text-green-600 group-hover:gap-2 transition-all">
            View Earnings <ArrowRight className="h-4 w-4 ml-1" />
          </div>
        </Link>
        === END HIDDEN WALLET CARD === */}

        <Link 
          href="/helper/services"
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">My Services</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Update rates and availability</p>
          <div className="flex items-center text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
            Manage <ArrowRight className="h-4 w-4 ml-1" />
          </div>
        </Link>
      </div>

      {/* Recent & Upcoming Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Jobs</h3>
            <Link href="/helper/assigned" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              View All →
            </Link>
          </div>
          {stats.recentJobs.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No recent jobs yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentJobs.map((job) => (
                <Link 
                  key={job.id} 
                  href="/helper/assigned"
                  className="block p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">{job.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{job.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">₹{job.amount}</p>
                      <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${
                        job.status === 'completed' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Jobs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Upcoming Jobs</h3>
            <Link href="/helper/assigned" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              View All →
            </Link>
          </div>
          {stats.upcomingJobs.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No upcoming jobs scheduled</p>
          ) : (
            <div className="space-y-3">
              {stats.upcomingJobs.map((job) => (
                <Link 
                  key={job.id}
                  href="/helper/assigned"
                  className="block p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">{job.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{job.customer_name}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-600 dark:text-slate-400">
                        <span>{new Date(job.scheduled_time).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
