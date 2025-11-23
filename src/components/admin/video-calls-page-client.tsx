'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Video, Clock, CheckCircle, Calendar, PlayCircle, Search, RefreshCw, Users, Phone } from 'lucide-react'
import { useToast } from '@/components/ui/toast-notification'

const formatDateTime = (dateString: string | null) => {
  if (!dateString) return null
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return 'N/A'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

interface Participant {
  name: string
  email: string
  avatar: string | null
}

interface VideoSession {
  id: string
  call_type: string
  provider: string
  status: string
  scheduled_at: string | null
  started_at: string | null
  ended_at: string | null
  duration_seconds: number | null
  recording_url: string | null
  is_recorded: boolean
  quality_rating: number | null
  created_at: string
  customer: Participant
  helper: Participant
}

interface VideoCallsPageClientProps {
  sessions: VideoSession[]
  stats: {
    totalCalls: number
    ongoingCalls: number
    completedCalls: number
    scheduledCalls: number
    avgDuration: number
    recordedCalls: number
  }
  error?: string
}

export function VideoCallsPageClient({
  sessions: initialSessions,
  stats,
  error: initialError
}: VideoCallsPageClientProps) {
  const router = useRouter()
  const { showSuccess, showInfo } = useToast()
  const [sessions] = useState(initialSessions)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [callTypeFilter, setCallTypeFilter] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [error] = useState(initialError)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    showInfo('Refreshing Sessions...', 'Fetching latest video call data')
    router.refresh()
    setTimeout(() => {
      setRefreshing(false)
      showSuccess('Sessions Refreshed! 📹', 'Video call sessions updated successfully')
    }, 500)
  }, [router, showInfo, showSuccess])

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // Status filter
      if (statusFilter !== 'all' && session.status !== statusFilter) {
        return false
      }
      
      // Call type filter
      if (callTypeFilter !== 'all' && session.call_type !== callTypeFilter) {
        return false
      }
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          session.customer.name.toLowerCase().includes(query) ||
          session.customer.email.toLowerCase().includes(query) ||
          session.helper.name.toLowerCase().includes(query) ||
          session.helper.email.toLowerCase().includes(query) ||
          session.call_type.toLowerCase().includes(query)
        )
      }
      
      return true
    })
  }, [sessions, searchQuery, statusFilter, callTypeFilter])

  const getStatusBadge = (status: string) => {
    const styles = {
      ongoing: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      scheduled: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      failed: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
    }
    return styles[status as keyof typeof styles] || styles.failed
  }

  const getCallTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      consultation: 'Consultation',
      pre_booking: 'Pre-Booking',
      support: 'Support',
      training: 'Training'
    }
    return labels[type] || type
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Video className="h-8 w-8 text-blue-600" />
              Video Call Sessions
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Monitor all video consultations and support calls</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Calls</p>
              <Video className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalCalls}</p>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">Ongoing</p>
              <Phone className="h-5 w-5 text-green-600 animate-pulse" />
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.ongoingCalls}</p>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.completedCalls}</p>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">Scheduled</p>
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.scheduledCalls}</p>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">Avg Duration</p>
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgDuration}m</p>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">Recorded</p>
              <PlayCircle className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.recordedCalls}</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by participant name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="scheduled">Scheduled</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>

            {/* Call Type Filter */}
            <select
              value={callTypeFilter}
              onChange={(e) => setCallTypeFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="consultation">Consultation</option>
              <option value="pre_booking">Pre-Booking</option>
              <option value="support">Support</option>
              <option value="training">Training</option>
            </select>
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Call Sessions ({filteredSessions.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Quality
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Recording
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Video className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-500 dark:text-slate-400">No video calls found</p>
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{session.customer.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Customer</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{session.helper.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Helper</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-900 dark:text-white">
                          {getCallTypeLabel(session.call_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(session.status)}`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                        {formatDuration(session.duration_seconds)}
                      </td>
                      <td className="px-6 py-4">
                        {session.quality_rating ? (
                          <span className="text-sm text-slate-900 dark:text-white">
                            {'⭐'.repeat(session.quality_rating)}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {formatDateTime(session.started_at || session.scheduled_at || session.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        {session.is_recorded && session.recording_url ? (
                          <a
                            href={session.recording_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <PlayCircle className="h-4 w-4" />
                            View
                          </a>
                        ) : (
                          <span className="text-sm text-slate-400">No recording</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
