'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Video, Phone, Clock, Calendar, User, CheckCircle2, 
  XCircle, Loader2, PlayCircle, PhoneOff 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface VideoCall {
  id: string
  request_id: string | null
  customer_id: string
  helper_id: string
  scheduled_at: string | null
  started_at: string | null
  ended_at: string | null
  duration_seconds: number | null
  status: string
  created_at: string
  service_requests?: {
    title: string
  }
  profiles?: {
    full_name: string
    avatar_url: string | null
  }
}

export default function CustomerVideoCallsPage() {
  const [calls, setCalls] = useState<VideoCall[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'missed'>('all')

  useEffect(() => {
    loadCalls()
    subscribeToCalls()
  }, [])

  async function loadCalls() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('video_calls')
      .select(`
        id,
        request_id,
        customer_id,
        helper_id,
        scheduled_at,
        started_at,
        ended_at,
        duration_seconds,
        status,
        created_at,
        service_requests (
          title
        ),
        profiles:helper_id (
          full_name,
          avatar_url
        )
      `)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setCalls(data as any)
    }
    setLoading(false)
  }

  function subscribeToCalls() {
    const supabase = createClient()
    
    const channel = supabase
      .channel('customer-video-calls')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_calls',
        },
        () => {
          loadCalls()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const filteredCalls = calls.filter(call => {
    if (filter === 'all') return true
    if (filter === 'scheduled') return call.status === 'scheduled'
    if (filter === 'completed') return call.status === 'completed'
    if (filter === 'missed') return call.status === 'missed' || call.status === 'cancelled'
    return true
  })

  const counts = {
    all: calls.length,
    scheduled: calls.filter(c => c.status === 'scheduled').length,
    completed: calls.filter(c => c.status === 'completed').length,
    missed: calls.filter(c => c.status === 'missed' || c.status === 'cancelled').length,
  }

  function formatDuration(seconds: number | null) {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Video Calls
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage your video consultations with helpers
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {(['all', 'scheduled', 'completed', 'missed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-2 text-xs opacity-75">({counts[f]})</span>
            </button>
          ))}
        </div>

        {/* Calls List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredCalls.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Video className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No video calls yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Schedule a video call with a helper from your service requests
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCalls.map((call) => {
              const isUpcoming = call.scheduled_at && new Date(call.scheduled_at) > new Date()
              
              return (
                <Card key={call.id} className="border-slate-200 dark:border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Helper Avatar */}
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {(call.profiles as any)?.full_name?.[0] || 'H'}
                        </div>

                        <div className="flex-1">
                          {/* Helper Name & Request */}
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {(call.profiles as any)?.full_name || 'Helper'}
                          </h3>
                          {call.service_requests && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Re: {(call.service_requests as any).title}
                            </p>
                          )}

                          {/* Call Details */}
                          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
                            {call.scheduled_at && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(call.scheduled_at).toLocaleString()}
                              </div>
                            )}
                            {call.duration_seconds && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Duration: {formatDuration(call.duration_seconds)}
                              </div>
                            )}
                          </div>

                          {/* Status Badge */}
                          <div className="mt-3">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                call.status === 'scheduled'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                  : call.status === 'in_progress'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : call.status === 'completed'
                                  ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}
                            >
                              {call.status === 'scheduled' && <Calendar className="h-3 w-3" />}
                              {call.status === 'in_progress' && <PlayCircle className="h-3 w-3" />}
                              {call.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
                              {(call.status === 'missed' || call.status === 'cancelled') && <PhoneOff className="h-3 w-3" />}
                              {call.status.charAt(0).toUpperCase() + call.status.slice(1).replace('_', ' ')}
                            </span>
                            {isUpcoming && (
                              <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                                Upcoming
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      {call.status === 'scheduled' && isUpcoming && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Join Call
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
