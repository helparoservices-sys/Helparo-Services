import { VideoCallsPageClient } from '@/components/admin/video-calls-page-client'
import { createClient } from '@/lib/supabase/server'

export default async function AdminVideoCallsPage() {
  const supabase = await createClient()

  // Fetch all video call sessions with participant details
  const { data: sessionsData, error: sessionsError } = await supabase
    .from('video_call_sessions')
    .select(`
      id,
      call_type,
      provider,
      status,
      scheduled_at,
      started_at,
      ended_at,
      duration_seconds,
      recording_url,
      is_recorded,
      quality_rating,
      created_at,
      customer:profiles!video_call_sessions_customer_id_fkey(full_name, email, avatar_url),
      helper:profiles!video_call_sessions_helper_id_fkey(full_name, email, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  // Transform data
  const sessions = (sessionsData || []).map((session) => {
    const customerData = Array.isArray(session.customer) ? session.customer[0] : session.customer
    const helperData = Array.isArray(session.helper) ? session.helper[0] : session.helper
    
    return {
      ...session,
      customer: {
        name: customerData?.full_name || 'Unknown',
        email: customerData?.email || 'N/A',
        avatar: customerData?.avatar_url || null
      },
      helper: {
        name: helperData?.full_name || 'Unknown',
        email: helperData?.email || 'N/A',
        avatar: helperData?.avatar_url || null
      }
    }
  })

  // Calculate stats
  const totalCalls = sessions.length
  const ongoingCalls = sessions.filter(s => s.status === 'ongoing').length
  const completedCalls = sessions.filter(s => s.status === 'completed').length
  const scheduledCalls = sessions.filter(s => s.status === 'scheduled').length
  const totalDuration = sessions
    .filter(s => s.duration_seconds)
    .reduce((sum, s) => sum + (s.duration_seconds || 0), 0)
  const avgDuration = completedCalls > 0 ? Math.round(totalDuration / completedCalls / 60) : 0
  const recordedCalls = sessions.filter(s => s.is_recorded).length

  return (
    <VideoCallsPageClient
      sessions={sessions}
      stats={{
        totalCalls,
        ongoingCalls,
        completedCalls,
        scheduledCalls,
        avgDuration,
        recordedCalls
      }}
      error={sessionsError?.message}
    />
  )
}
