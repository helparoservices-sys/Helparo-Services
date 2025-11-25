'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/loading'
import { getHelperVideoCalls, getCallAnalytics } from '@/app/actions/helper-video-calls'
import { Video, Phone, Clock, Star, Calendar, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface VideoCall {
  id: string
  customer_name: string
  customer_avatar: string | null
  scheduled_at: string | null
  started_at: string | null
  ended_at: string | null
  duration_minutes: number
  status: string
  call_quality: number | null
  notes: string | null
}

interface CallAnalytics {
  total_calls: number
  total_duration: number
  average_duration: number
  average_quality: number
}

export default function HelperVideoCallsPage() {
  const [loading, setLoading] = useState(true)
  const [calls, setCalls] = useState<VideoCall[]>([])
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'missed'>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const [callsResult, analyticsResult] = await Promise.all([
      getHelperVideoCalls(),
      getCallAnalytics(),
    ])

    if ('error' in callsResult && callsResult.error) {
      toast.error(callsResult.error)
    } else if ('data' in callsResult && callsResult.data) {
      setCalls(callsResult.data)
    }

    if ('error' in analyticsResult && analyticsResult.error) {
      toast.error(analyticsResult.error)
    } else if ('data' in analyticsResult && analyticsResult.data) {
      setAnalytics(analyticsResult.data)
    }

    setLoading(false)
  }

  const filteredCalls = calls.filter(call => {
    if (filter === 'all') return true
    if (filter === 'upcoming') return call.status === 'scheduled'
    if (filter === 'completed') return call.status === 'completed'
    if (filter === 'missed') return call.status === 'missed'
    return true
  })

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'missed':
        return 'bg-red-100 text-red-700'
      case 'cancelled':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Video Calls
          </h1>
          <p className="text-gray-600 mt-1">Manage your video consultations</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      <Video className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{analytics?.total_calls || 0}</p>
                      <p className="text-xs text-gray-600">Total Calls</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatDuration(analytics?.total_duration || 0)}
                      </p>
                      <p className="text-xs text-gray-600">Total Duration</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatDuration(analytics?.average_duration || 0)}
                      </p>
                      <p className="text-xs text-gray-600">Avg Duration</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                      <Star className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics?.average_quality?.toFixed(1) || '0.0'}
                      </p>
                      <p className="text-xs text-gray-600">Avg Quality</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-white/50">
              <Button
                onClick={() => setFilter('all')}
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1"
              >
                All Calls
              </Button>
              <Button
                onClick={() => setFilter('upcoming')}
                variant={filter === 'upcoming' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1"
              >
                Upcoming
              </Button>
              <Button
                onClick={() => setFilter('completed')}
                variant={filter === 'completed' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1"
              >
                Completed
              </Button>
              <Button
                onClick={() => setFilter('missed')}
                variant={filter === 'missed' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1"
              >
                Missed
              </Button>
            </div>

            {/* Calls List */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
              <CardHeader>
                <CardTitle>Call History</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredCalls.length === 0 ? (
                  <div className="text-center py-12">
                    <Video className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 font-medium">No video calls found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {filter === 'all'
                        ? 'Your video call history will appear here'
                        : `No ${filter} calls at the moment`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCalls.map(call => (
                      <div
                        key={call.id}
                        className={`p-4 rounded-lg border ${
                          call.status === 'scheduled'
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50'
                            : call.status === 'completed'
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50'
                            : 'bg-gradient-to-r from-white to-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                              {call.customer_name?.charAt(0) || 'C'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-gray-900">{call.customer_name}</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                                  {call.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-600">
                                {call.scheduled_at && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(call.scheduled_at).toLocaleDateString()} at{' '}
                                    {new Date(call.scheduled_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </div>
                                )}
                                {call.duration_minutes > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(call.duration_minutes)}
                                  </div>
                                )}
                                {call.call_quality && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    {call.call_quality.toFixed(1)}
                                  </div>
                                )}
                              </div>
                              {call.notes && (
                                <p className="text-xs text-gray-500 mt-2">{call.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {call.status === 'scheduled' && (
                              <Button size="sm" className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-500">
                                <Phone className="h-4 w-4" />
                                Join
                              </Button>
                            )}
                            {call.status === 'completed' && (
                              <Button size="sm" variant="outline" className="gap-2">
                                <Video className="h-4 w-4" />
                                Details
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
