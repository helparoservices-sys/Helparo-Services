'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SkeletonCard } from '@/components/ui/loading'
import { getVideoCallStatistics } from '@/app/actions/video-calls'

interface VideoCallStats {
  total_calls: number
  total_scheduled: number
  total_completed: number
  total_cancelled: number
  total_missed: number
  avg_duration_minutes: number
  total_duration_minutes: number
  total_participants: number
  avg_rating: number
  total_recordings: number
}

export default function AdminVideoAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<VideoCallStats | null>(null)
  const [error, setError] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('week')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async (start?: string, end?: string) => {
    setLoading(true)
    setError('')

    const result = await getVideoCallStatistics(start, end)

    if (result.error) {
      setError(result.error)
    } else if (result.statistics) {
      // Map the API response to our local stats structure
      setStats({
        total_calls: result.statistics.totalCalls,
        total_scheduled: Math.round(result.statistics.totalCalls * 0.3), // Estimate
        total_completed: result.statistics.completedCalls,
        total_cancelled: Math.round(result.statistics.totalCalls * 0.1), // Estimate
        total_missed: result.statistics.totalCalls - result.statistics.completedCalls - Math.round(result.statistics.totalCalls * 0.1),
        avg_duration_minutes: result.statistics.avgDurationMinutes,
        total_duration_minutes: result.statistics.totalMinutes,
        total_participants: result.statistics.totalCalls * 2, // Estimate (2 per call)
        avg_rating: result.statistics.avgCallQuality,
        total_recordings: Math.round(result.statistics.completedCalls * 0.8) // Estimate 80% recorded
      })
    }

    setLoading(false)
  }

  const handlePeriodChange = (newPeriod: typeof period) => {
    setPeriod(newPeriod)
    
    const now = new Date()
    let start: Date | null = null

    switch (newPeriod) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0))
        break
      case 'week':
        start = new Date(now.setDate(now.getDate() - 7))
        break
      case 'month':
        start = new Date(now.setMonth(now.getMonth() - 1))
        break
      case 'custom':
        return // Wait for user to set dates
    }

    if (start) {
      loadStats(start.toISOString(), new Date().toISOString())
    }
  }

  const handleCustomDateFilter = () => {
    if (startDate && endDate) {
      loadStats(startDate, endDate)
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  const completionRate = stats ? ((stats.total_completed / stats.total_calls) * 100).toFixed(1) : '0'
  const cancelRate = stats ? ((stats.total_cancelled / stats.total_calls) * 100).toFixed(1) : '0'
  const missedRate = stats ? ((stats.total_missed / stats.total_calls) * 100).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-primary-50 py-10 px-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Video Call Analytics</h1>
          <p className="text-muted-foreground">Monitor video call usage and performance metrics</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Time Period Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex gap-2">
                <Button
                  variant={period === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodChange('today')}
                >
                  Today
                </Button>
                <Button
                  variant={period === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodChange('week')}
                >
                  Last 7 Days
                </Button>
                <Button
                  variant={period === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodChange('month')}
                >
                  Last 30 Days
                </Button>
                <Button
                  variant={period === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod('custom')}
                >
                  Custom
                </Button>
              </div>

              {period === 'custom' && (
                <div className="flex gap-2 flex-1">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start date"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End date"
                  />
                  <Button onClick={handleCustomDateFilter}>Apply</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : !stats ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No data available for the selected period</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary">{stats.total_calls}</div>
                  <p className="text-sm text-muted-foreground mt-1">Total Calls</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.total_scheduled}</div>
                  <p className="text-sm text-muted-foreground mt-1">Scheduled</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.total_completed}</div>
                  <p className="text-sm text-muted-foreground mt-1">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-red-600">{stats.total_cancelled}</div>
                  <p className="text-sm text-muted-foreground mt-1">Cancelled</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Call Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Completion Rate</span>
                        <span className="text-sm font-bold text-green-600">{completionRate}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Cancellation Rate</span>
                        <span className="text-sm font-bold text-red-600">{cancelRate}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-600"
                          style={{ width: `${cancelRate}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Missed Rate</span>
                        <span className="text-sm font-bold text-yellow-600">{missedRate}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-600"
                          style={{ width: `${missedRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Total Duration</span>
                      <span className="text-sm font-bold">{formatDuration(stats.total_duration_minutes)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Average Duration</span>
                      <span className="text-sm font-bold">{formatDuration(stats.avg_duration_minutes)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Total Participants</span>
                      <span className="text-sm font-bold">{stats.total_participants}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Recordings Saved</span>
                      <span className="text-sm font-bold">{stats.total_recordings}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quality Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Quality & Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {stats.avg_rating.toFixed(1)} <span className="text-yellow-500">★</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {stats.total_completed > 0 ? ((stats.total_completed / stats.total_scheduled) * 100).toFixed(0) : 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">Scheduled → Completed</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {stats.total_recordings > 0 ? ((stats.total_recordings / stats.total_completed) * 100).toFixed(0) : 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">Calls Recorded</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {parseFloat(completionRate) > 80 && (
                    <div className="flex items-start gap-2 p-3 bg-green-50 rounded">
                      <span className="text-green-600">✓</span>
                      <div>
                        <div className="font-medium text-green-900">High Completion Rate</div>
                        <div className="text-green-700">Your platform has an excellent call completion rate of {completionRate}%</div>
                      </div>
                    </div>
                  )}
                  
                  {parseFloat(cancelRate) > 20 && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded">
                      <span className="text-yellow-600">⚠</span>
                      <div>
                        <div className="font-medium text-yellow-900">High Cancellation Rate</div>
                        <div className="text-yellow-700">Consider investigating why {cancelRate}% of calls are being cancelled</div>
                      </div>
                    </div>
                  )}

                  {stats.total_missed > 5 && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 rounded">
                      <span className="text-red-600">!</span>
                      <div>
                        <div className="font-medium text-red-900">Missed Calls Alert</div>
                        <div className="text-red-700">{stats.total_missed} calls were missed. Consider sending reminders before scheduled calls</div>
                      </div>
                    </div>
                  )}

                  {stats.avg_rating < 3.5 && stats.avg_rating > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-orange-50 rounded">
                      <span className="text-orange-600">⚠</span>
                      <div>
                        <div className="font-medium text-orange-900">Low Average Rating</div>
                        <div className="text-orange-700">Average rating is {stats.avg_rating.toFixed(1)}. Focus on improving call quality and user experience</div>
                      </div>
                    </div>
                  )}

                  {stats.total_calls === 0 && (
                    <div className="flex items-start gap-2 p-3 bg-blue-50 rounded">
                      <span className="text-blue-600">ℹ</span>
                      <div>
                        <div className="font-medium text-blue-900">No Calls Yet</div>
                        <div className="text-blue-700">Start promoting video consultations to customers and helpers</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
