'use client'

import { useEffect, useState } from 'react'
import { 
  Clock, 
  Play, 
  Pause, 
  Square,
  Calendar,
  TrendingUp,
  BarChart3,
  Timer,
  CheckCircle,
  Coffee
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { toast } from 'sonner'
import { getTimeTrackingData, startTimer, pauseTimer, stopTimer, addBreak } from '@/app/actions/time-tracking'

interface TimeEntry {
  id: string
  job_title: string
  started_at: string
  ended_at: string | null
  total_minutes: number
  is_active: boolean
  breaks: number
  job_id: string
}

interface TimeStats {
  today: {
    total_minutes: number
    jobs_count: number
    breaks_count: number
  }
  this_week: {
    total_minutes: number
    jobs_count: number
    average_per_day: number
  }
  this_month: {
    total_minutes: number
    jobs_count: number
    average_per_day: number
  }
}

export default function HelperTimeTrackingPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [stats, setStats] = useState<TimeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTimer, setActiveTimer] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [filterPeriod, setFilterPeriod] = useState('week')

  useEffect(() => {
    loadTimeData()
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    loadTimeData()
  }, [filterPeriod])

  const loadTimeData = async () => {
    setLoading(true)
    const result = await getTimeTrackingData(filterPeriod)
    
    if ('error' in result) {
      toast.error(result.error || 'Failed to load time tracking data')
    } else if ('data' in result) {
      setEntries(result.data.entries)
      setStats(result.data.stats)
      const active = result.data.entries.find(e => e.is_active)
      setActiveTimer(active?.id || null)
    }
    
    setLoading(false)
  }

  const handleStartTimer = async (jobId: string) => {
    const result = await startTimer(jobId)
    
    if ('error' in result) {
      toast.error(result.error || 'Failed to start timer')
    } else {
      toast.success('Timer started!')
      loadTimeData()
    }
  }

  const handlePauseTimer = async (entryId: string) => {
    const result = await pauseTimer(entryId)
    
    if ('error' in result) {
      toast.error(result.error || 'Failed to pause timer')
    } else {
      toast.success('Timer paused')
      loadTimeData()
    }
  }

  const handleStopTimer = async (entryId: string) => {
    if (!confirm('Stop this timer? This will mark the session as complete.')) return

    const result = await stopTimer(entryId)
    
    if ('error' in result) {
      toast.error(result.error || 'Failed to stop timer')
    } else {
      toast.success('Timer stopped and saved!')
      loadTimeData()
    }
  }

  const handleAddBreak = async (entryId: string) => {
    const result = await addBreak(entryId)
    
    if ('error' in result) {
      toast.error(result.error || 'Failed to add break')
    } else {
      toast.success('Break recorded')
      loadTimeData()
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getActiveTimeDuration = (startedAt: string) => {
    const start = new Date(startedAt)
    const diff = currentTime.getTime() - start.getTime()
    const minutes = Math.floor(diff / 60000)
    return formatDuration(minutes)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const activeEntry = entries.find(e => e.is_active)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Timer className="h-8 w-8" />
              Time Tracking
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track your work hours and productivity
            </p>
          </div>
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger className="w-36">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Timer Card */}
        {activeEntry && (
          <Card className="shadow-lg border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="animate-pulse">
                      <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                    </div>
                    <h3 className="font-bold text-lg">Active Timer</h3>
                  </div>
                  <p className="font-semibold text-xl mb-1">{activeEntry.job_title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Started at {new Date(activeEntry.started_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {getActiveTimeDuration(activeEntry.started_at)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddBreak(activeEntry.id)}
                      className="gap-2"
                    >
                      <Coffee className="h-4 w-4" />
                      Break
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStopTimer(activeEntry.id)}
                      className="gap-2"
                    >
                      <Square className="h-4 w-4" />
                      Stop
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Today
                  </CardTitle>
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {formatDuration(stats.today.total_minutes)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {stats.today.jobs_count} jobs • {stats.today.breaks_count} breaks
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    This Week
                  </CardTitle>
                  <BarChart3 className="h-5 w-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {formatDuration(stats.this_week.total_minutes)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {stats.this_week.jobs_count} jobs • Avg {formatDuration(stats.this_week.average_per_day)}/day
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    This Month
                  </CardTitle>
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {formatDuration(stats.this_month.total_minutes)}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {stats.this_month.jobs_count} jobs • Avg {formatDuration(stats.this_month.average_per_day)}/day
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Time Entries List */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Time Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                No time entries for this period
              </p>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-lg border ${
                      entry.is_active 
                        ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' 
                        : 'hover:border-primary'
                    } transition-colors`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold">{entry.job_title}</p>
                          {entry.is_active && (
                            <Badge className="bg-blue-500 animate-pulse">
                              <Play className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                          {!entry.is_active && entry.ended_at && (
                            <Badge className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Play className="h-3 w-3" />
                            Started: {new Date(entry.started_at).toLocaleString()}
                          </span>
                          {entry.ended_at && (
                            <span className="flex items-center gap-1">
                              <Square className="h-3 w-3" />
                              Ended: {new Date(entry.ended_at).toLocaleString()}
                            </span>
                          )}
                          {entry.breaks > 0 && (
                            <span className="flex items-center gap-1">
                              <Coffee className="h-3 w-3" />
                              {entry.breaks} break{entry.breaks > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                          {entry.is_active 
                            ? getActiveTimeDuration(entry.started_at)
                            : formatDuration(entry.total_minutes)
                          }
                        </p>
                        {!entry.is_active && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Total duration
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
