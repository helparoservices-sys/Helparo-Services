'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Navigation,
  MessageSquare,
  Phone,
  User,
  Briefcase,
  ChevronRight,
  Play,
  Pause,
  Square
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading'
import { toast } from 'sonner'
import { getHelperAssignedJobs, updateJobStatus, startJobTimer, stopJobTimer } from '@/app/actions/assigned-jobs'
import { VerificationGate } from '@/components/helper/verification-gate'
import { createClient } from '@/lib/supabase/client'

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
  created_at: string
  updated_at: string
  time_tracking: {
    started_at: string | null
    ended_at: string | null
    total_minutes: number
    is_active: boolean
  } | null
}

export default function HelperAssignedJobsPage() {
  const [jobs, setJobs] = useState<AssignedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [checkingVerification, setCheckingVerification] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({})
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    checkVerification()
  }, [])

  useEffect(() => {
    if (isVerified) {
      loadJobs()
    }
  }, [isVerified])

  // Realtime subscription for job updates
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    
    const channel = supabase
      .channel('assigned-jobs-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `assigned_helper_id=eq.${userId}`
        },
        (payload) => {
          console.log('📡 Realtime update for assigned jobs:', payload)
          loadJobs() // Reload jobs when any assigned job changes
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const checkVerification = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setCheckingVerification(false)
      return
    }

    // Set userId for realtime subscription
    setUserId(user.id)

    const { data: profile } = await supabase
      .from('helper_profiles')
      .select('is_approved, verification_status')
      .eq('user_id', user.id)
      .single()

    setIsVerified(profile?.is_approved === true || false)
    setCheckingVerification(false)
  }

  const loadJobs = async () => {
    setLoading(true)
    const result = await getHelperAssignedJobs()
    
    if ('error' in result) {
      toast.error(result.error || 'Failed to load assigned jobs')
    } else if ('jobs' in result) {
      setJobs(result.jobs)
    }
    
    setLoading(false)
  }

  const handleStatusUpdate = async (jobId: string, newStatus: string) => {
    const confirmMessages: Record<string, string> = {
      in_progress: 'Mark this job as in progress?',
      completed: 'Mark this job as completed? The customer will be notified.',
      cancelled: 'Cancel this job? This action cannot be undone.',
    }

    if (confirmMessages[newStatus] && !confirm(confirmMessages[newStatus])) {
      return
    }

    setUpdatingStatus({ ...updatingStatus, [jobId]: true })

    const result = await updateJobStatus(jobId, newStatus)

    if ('error' in result) {
      toast.error(result.error || 'Failed to update job status')
    } else {
      toast.success(`Job ${newStatus === 'in_progress' ? 'started' : newStatus}!`)
      loadJobs()
    }

    setUpdatingStatus({ ...updatingStatus, [jobId]: false })
  }

  const handleTimerToggle = async (jobId: string, isActive: boolean) => {
    const result = isActive ? await stopJobTimer(jobId) : await startJobTimer(jobId)

    if ('error' in result) {
      toast.error(result.error || 'Failed to update timer')
    } else {
      toast.success(isActive ? 'Timer stopped' : 'Timer started')
      loadJobs()
    }
  }

  const handleNavigate = (latitude: number, longitude: number, address: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    window.open(url, '_blank')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  if (checkingVerification || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const activeJobs = jobs.filter(job => ['accepted', 'in_progress'].includes(job.status))
  const completedJobs = jobs.filter(job => job.status === 'completed')
  const cancelledJobs = jobs.filter(job => job.status === 'cancelled')

  return (
    <VerificationGate isVerified={isVerified}>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 py-6 px-4">`
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Assigned Jobs</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage your accepted and ongoing jobs
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-sm">
              {activeJobs.length} active
            </Badge>
            <Badge variant="outline" className="text-sm">
              {completedJobs.length} completed
            </Badge>
          </div>
        </div>

        {/* Active Jobs */}
        {activeJobs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Active Jobs
            </h2>
            <div className="grid grid-cols-1 gap-6">
              {activeJobs.map((job) => (
                <Card key={job.id} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">{job.title}</CardTitle>
                          <Badge className={getStatusColor(job.status)}>
                            {job.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {job.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {job.customer_name}
                          </span>
                          {job.scheduled_time && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(job.scheduled_time).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          ₹{job.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Description */}
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {job.description}
                    </p>

                    {/* Location */}
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300">{job.location_address}</span>
                    </div>

                    {/* Time Tracking */}
                    {job.time_tracking && (
                      <div className="bg-slate-50 dark:bg-slate-800 border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Time Tracking
                          </p>
                          {job.time_tracking.is_active && (
                            <Badge variant="destructive" className="animate-pulse">
                              <Play className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">Total Time</p>
                            <p className="font-bold text-lg">
                              {formatDuration(job.time_tracking.total_minutes)}
                            </p>
                          </div>
                          {job.time_tracking.started_at && (
                            <div>
                              <p className="text-slate-500 dark:text-slate-400">Started At</p>
                              <p className="font-medium">
                                {new Date(job.time_tracking.started_at).toLocaleTimeString()}
                              </p>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant={job.time_tracking.is_active ? 'destructive' : 'default'}
                          onClick={() => handleTimerToggle(job.id, job.time_tracking!.is_active)}
                          className="w-full gap-2"
                        >
                          {job.time_tracking.is_active ? (
                            <>
                              <Pause className="h-4 w-4" />
                              Stop Timer
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              Start Timer
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t">
                      {job.latitude && job.longitude && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNavigate(job.latitude!, job.longitude!, job.location_address)}
                          className="gap-2"
                        >
                          <Navigation className="h-4 w-4" />
                          Navigate
                        </Button>
                      )}
                      {job.customer_phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`tel:${job.customer_phone}`, '_self')}
                          className="gap-2"
                        >
                          <Phone className="h-4 w-4" />
                          Call
                        </Button>
                      )}
                      <Link href={`/helper/requests/${job.id}/chat`}>
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Chat
                        </Button>
                      </Link>
                      {job.status === 'accepted' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(job.id, 'in_progress')}
                          disabled={updatingStatus[job.id]}
                          className="gap-2"
                        >
                          <Play className="h-4 w-4" />
                          Start Job
                        </Button>
                      )}
                      {job.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(job.id, 'completed')}
                          disabled={updatingStatus[job.id]}
                          className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State for Active Jobs */}
        {activeJobs.length === 0 && (
          <Card className="shadow-lg">
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                No active jobs at the moment
              </p>
              <Link href="/helper/requests">
                <Button className="gap-2">
                  Browse Available Jobs
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Completed Jobs */}
        {completedJobs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Completed Jobs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedJobs.map((job) => (
                <Card key={job.id} className="shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <p className="font-semibold mb-1">{job.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {job.customer_name}
                        </p>
                      </div>
                      <p className="font-bold text-green-600 dark:text-green-400">
                        ₹{job.amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{new Date(job.updated_at).toLocaleDateString()}</span>
                      {job.time_tracking && (
                        <span>Duration: {formatDuration(job.time_tracking.total_minutes)}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </VerificationGate>
  )
}
