'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SkeletonCard } from '@/components/ui/loading'
import { getMyVideoCallSessions } from '@/app/actions/video-calls'

interface VideoCall {
  id: string
  service_request_id: string
  channel_name: string
  call_type: string
  status: string
  scheduled_for: string | null
  started_at: string | null
  ended_at: string | null
  created_at: string
}

export default function HelperVideoCallHistoryPage() {
  const [loading, setLoading] = useState(true)
  const [calls, setCalls] = useState<VideoCall[]>([])
  const [filteredCalls, setFilteredCalls] = useState<VideoCall[]>([])
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadCalls()
  }, [])

  useEffect(() => {
    filterCalls()
  }, [calls, filter, searchTerm])

  const loadCalls = async () => {
    setLoading(true)
    setError('')

    const result = await getMyVideoCallSessions()

    if ('error' in result && result.error) {
      setError(result.error)
    } else if ('sessions' in result) {
      setCalls(result.sessions || [])
    }

    setLoading(false)
  }

  const filterCalls = () => {
    let filtered = calls

    if (filter !== 'all') {
      filtered = filtered.filter(c => c.status === filter)
    }

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.call_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.service_request_id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredCalls(filtered)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
      missed: 'bg-yellow-100 text-yellow-700'
    }
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-700'
  }

  const isUpcoming = (scheduledTime: string | null) => {
    if (!scheduledTime) return false
    return new Date(scheduledTime) > new Date()
  }

  const formatDuration = (startTime: string | null, endTime: string | null) => {
    if (!startTime || !endTime) return 'N/A'
    const duration = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)
    if (duration < 60) return `${duration}m`
    const hours = Math.floor(duration / 60)
    const mins = duration % 60
    return `${hours}h ${mins}m`
  }

  const scheduledCount = calls.filter(c => c.status === 'scheduled').length
  const completedCount = calls.filter(c => c.status === 'completed').length
  const totalRevenue = completedCount * 500 // Placeholder calculation

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Video Call History</h1>
          <p className="text-muted-foreground">Manage your video consultations with customers</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-primary">{calls.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Calls</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-blue-600">{scheduledCount}</div>
              <p className="text-sm text-muted-foreground mt-1">Upcoming</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <p className="text-sm text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-gray-600">
                {calls.filter(c => c.ended_at && c.started_at).reduce((sum, c) => {
                  const duration = (new Date(c.ended_at!).getTime() - new Date(c.started_at!).getTime()) / 60000
                  return sum + duration
                }, 0).toFixed(0)}m
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total Time</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'scheduled' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('scheduled')}
                >
                  Scheduled
                </Button>
                <Button
                  variant={filter === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('completed')}
                >
                  Completed
                </Button>
                <Button
                  variant={filter === 'cancelled' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('cancelled')}
                >
                  Cancelled
                </Button>
              </div>
              <div className="flex-1">
                <Input
                  type="search"
                  placeholder="Search by call type or service request..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calls List */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredCalls.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📹</div>
                <p className="text-sm text-muted-foreground mb-4">No video calls found</p>
                <p className="text-xs text-muted-foreground">
                  Video calls are initiated by customers. You'll see them here once scheduled.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredCalls.map(call => (
              <Card key={call.id} className={isUpcoming(call.scheduled_for) ? 'border-blue-300' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold capitalize">{call.call_type.replace('_', ' ')}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(call.status)}`}>
                          {call.status}
                        </span>
                        {isUpcoming(call.scheduled_for) && call.status === 'scheduled' && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            Upcoming
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1">
                        Service Request: {call.service_request_id.substring(0, 8)}...
                      </p>

                      <div className="flex flex-wrap gap-4 mt-3 text-sm">
                        {call.scheduled_for && (
                          <div>
                            <span className="text-muted-foreground">Scheduled:</span>
                            <span className="ml-2 font-medium">
                              {new Date(call.scheduled_for).toLocaleString()}
                            </span>
                          </div>
                        )}

                        {call.started_at && call.ended_at && (
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="ml-2 font-medium">
                              {formatDuration(call.started_at, call.ended_at)}
                            </span>
                          </div>
                        )}

                        {call.started_at && !call.ended_at && (
                          <div>
                            <span className="text-muted-foreground">Started:</span>
                            <span className="ml-2 font-medium">
                              {new Date(call.started_at).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {call.status === 'scheduled' && isUpcoming(call.scheduled_for) && (
                        <Link href={`/helper/video-calls/${call.id}`}>
                          <Button size="sm">Join Call</Button>
                        </Link>
                      )}
                      {call.status === 'active' && (
                        <Link href={`/helper/video-calls/${call.id}`}>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Join Now
                          </Button>
                        </Link>
                      )}
                      {call.status === 'completed' && (
                        <Button size="sm" variant="outline">
                          View Recording
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
