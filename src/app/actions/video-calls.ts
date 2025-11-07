'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Server Actions for Video Calls (Migration 026)
 * Tables: video_call_sessions, call_participants, call_recordings, call_analytics
 * 
 * NOTE: This integrates with Agora.io or Twilio for actual video calling
 * You'll need to add API keys in .env:
 * - AGORA_APP_ID
 * - AGORA_APP_CERTIFICATE
 * OR
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 */

// ============================================
// VIDEO CALL SESSIONS
// ============================================

export async function createVideoCallSession(formData: FormData) {
  const supabase = await createClient()
  
  const serviceRequestId = formData.get('service_request_id') as string
  const callType = formData.get('call_type') as string
  const scheduledFor = formData.get('scheduled_for') as string

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Generate unique channel name
    const channelName = `helparo-${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Generate Agora token (placeholder - implement actual Agora token generation)
    const agoraToken = await generateAgoraToken(channelName, user.id)

    const { data: session, error } = await supabase
      .from('video_call_sessions')
      .insert({
        service_request_id: serviceRequestId,
        channel_name: channelName,
        call_type: callType,
        status: scheduledFor ? 'scheduled' : 'active',
        scheduled_for: scheduledFor || null,
        agora_token: agoraToken,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error

    // Add creator as participant
    await addCallParticipant(session.id, user.id, 'host')

    revalidatePath('/customer/video-calls')
    revalidatePath('/helper/video-calls')
    return { success: true, session }
  } catch (error: any) {
    console.error('Create video call session error:', error)
    return { error: error.message }
  }
}

export async function joinVideoCall(sessionId: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('video_call_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError) throw sessionError
    if (!session) return { error: 'Session not found' }

    // Check if user is authorized to join
    const { data: serviceRequest } = await supabase
      .from('service_requests')
      .select('customer_id, assigned_helper_id')
      .eq('id', session.service_request_id)
      .single()

    if (serviceRequest?.customer_id !== user.id && serviceRequest?.assigned_helper_id !== user.id) {
      return { error: 'Unauthorized to join this call' }
    }

    // Add as participant if not already
    await addCallParticipant(sessionId, user.id, 'participant')

    // Update session status
    if (session.status === 'scheduled') {
      await supabase
        .from('video_call_sessions')
        .update({
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', sessionId)
    }

    // Generate new token for this user
    const agoraToken = await generateAgoraToken(session.channel_name, user.id)

    revalidatePath('/customer/video-calls')
    revalidatePath('/helper/video-calls')
    return { 
      success: true, 
      session: {
        ...session,
        agora_token: agoraToken
      }
    }
  } catch (error: any) {
    console.error('Join video call error:', error)
    return { error: error.message }
  }
}

export async function endVideoCall(sessionId: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get session to calculate duration
    const { data: session } = await supabase
      .from('video_call_sessions')
      .select('started_at, created_by')
      .eq('id', sessionId)
      .single()

    if (!session) {
      return { error: 'Session not found' }
    }

    // Only creator can end the call
    if (session.created_by !== user.id) {
      return { error: 'Only the call host can end the call' }
    }

    const endedAt = new Date()
    const startedAt = new Date(session.started_at || new Date())
    const durationMinutes = Math.round((endedAt.getTime() - startedAt.getTime()) / (1000 * 60))

    const { data, error } = await supabase
      .from('video_call_sessions')
      .update({
        status: 'completed',
        ended_at: endedAt.toISOString(),
        duration_minutes: durationMinutes
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error

    // Create analytics record
    await createCallAnalytics(sessionId)

    revalidatePath('/customer/video-calls')
    revalidatePath('/helper/video-calls')
    return { success: true, session: data }
  } catch (error: any) {
    console.error('End video call error:', error)
    return { error: error.message }
  }
}

export async function getMyVideoCallSessions(status?: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get sessions where user is a participant
    const { data: participations } = await supabase
      .from('call_participants')
      .select('session_id')
      .eq('user_id', user.id)

    if (!participations || participations.length === 0) {
      return { success: true, sessions: [] }
    }

    const sessionIds = participations.map(p => p.session_id)

    let query = supabase
      .from('video_call_sessions')
      .select(`
        *,
        service_request:service_requests(
          title,
          customer_id,
          assigned_helper_id
        ),
        participants:call_participants(
          user_id,
          role,
          user:profiles(full_name, avatar_url)
        )
      `)
      .in('id', sessionIds)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, sessions: data }
  } catch (error: any) {
    console.error('Get my video call sessions error:', error)
    return { error: error.message }
  }
}

// ============================================
// CALL PARTICIPANTS
// ============================================

export async function addCallParticipant(sessionId: string, userId: string, role: 'host' | 'participant') {
  const supabase = await createClient()

  try {
    // Check if already participant
    const { data: existing } = await supabase
      .from('call_participants')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      // Update join time
      await supabase
        .from('call_participants')
        .update({ joined_at: new Date().toISOString() })
        .eq('id', existing.id)

      return { success: true }
    }

    const { error } = await supabase
      .from('call_participants')
      .insert({
        session_id: sessionId,
        user_id: userId,
        role,
        joined_at: new Date().toISOString()
      })

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Add call participant error:', error)
    return { error: error.message }
  }
}

export async function updateParticipantStatus(sessionId: string, userId: string, status: any) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('call_participants')
      .update({
        is_video_on: status.videoOn,
        is_audio_on: status.audioOn,
        is_screen_sharing: status.screenSharing
      })
      .eq('session_id', sessionId)
      .eq('user_id', userId)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Update participant status error:', error)
    return { error: error.message }
  }
}

export async function recordParticipantLeft(sessionId: string, userId: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('call_participants')
      .update({ left_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .eq('user_id', userId)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Record participant left error:', error)
    return { error: error.message }
  }
}

// ============================================
// CALL RECORDINGS
// ============================================

export async function startCallRecording(sessionId: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check if user is host
    const { data: participant } = await supabase
      .from('call_participants')
      .select('role')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (participant?.role !== 'host') {
      return { error: 'Only the host can start recording' }
    }

    // Start recording with Agora/Twilio (placeholder)
    const recordingId = `rec-${Date.now()}`

    const { data, error } = await supabase
      .from('call_recordings')
      .insert({
        session_id: sessionId,
        recording_url: null, // Will be updated when recording completes
        started_by: user.id,
        status: 'recording'
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, recording: data }
  } catch (error: any) {
    console.error('Start call recording error:', error)
    return { error: error.message }
  }
}

export async function stopCallRecording(recordingId: string, recordingUrl: string, durationSeconds: number, fileSize: number) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('call_recordings')
      .update({
        recording_url: recordingUrl,
        duration_seconds: durationSeconds,
        file_size_mb: fileSize,
        status: 'completed'
      })
      .eq('id', recordingId)
      .select()
      .single()

    if (error) throw error

    return { success: true, recording: data }
  } catch (error: any) {
    console.error('Stop call recording error:', error)
    return { error: error.message }
  }
}

export async function getSessionRecordings(sessionId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('call_recordings')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, recordings: data }
  } catch (error: any) {
    console.error('Get session recordings error:', error)
    return { error: error.message }
  }
}

// ============================================
// CALL ANALYTICS
// ============================================

export async function createCallAnalytics(sessionId: string) {
  const supabase = await createClient()

  try {
    // Get session details
    const { data: session } = await supabase
      .from('video_call_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (!session) return { error: 'Session not found' }

    // Get participants count
    const { count: participantCount } = await supabase
      .from('call_participants')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)

    // Calculate average call quality (placeholder - would come from Agora/Twilio metrics)
    const avgCallQuality = 4.5

    const { data, error } = await supabase
      .from('call_analytics')
      .insert({
        session_id: sessionId,
        total_participants: participantCount || 0,
        peak_participants: participantCount || 0,
        average_call_quality: avgCallQuality,
        total_duration_minutes: session.duration_minutes || 0,
        network_issues_count: 0,
        reconnection_attempts: 0
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, analytics: data }
  } catch (error: any) {
    console.error('Create call analytics error:', error)
    return { error: error.message }
  }
}

export async function updateCallAnalytics(sessionId: string, metrics: any) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('call_analytics')
      .update({
        peak_participants: metrics.peakParticipants,
        average_call_quality: metrics.avgQuality,
        network_issues_count: metrics.networkIssues,
        reconnection_attempts: metrics.reconnections,
        bandwidth_stats: metrics.bandwidth
      })
      .eq('session_id', sessionId)
      .select()
      .single()

    if (error) throw error

    return { success: true, analytics: data }
  } catch (error: any) {
    console.error('Update call analytics error:', error)
    return { error: error.message }
  }
}

export async function getCallAnalytics(sessionId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('call_analytics')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (error) throw error

    return { success: true, analytics: data }
  } catch (error: any) {
    console.error('Get call analytics error:', error)
    return { error: error.message }
  }
}

export async function getVideoCallStatistics(startDate?: string, endDate?: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    let query = supabase
      .from('video_call_sessions')
      .select('*, analytics:call_analytics(*)')

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data: sessions, error } = await query

    if (error) throw error

    // Calculate statistics
    const totalCalls = sessions?.length || 0
    const completedCalls = sessions?.filter(s => s.status === 'completed').length || 0
    const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0
    const avgDuration = totalMinutes / (completedCalls || 1)
    
    const avgQuality = sessions
      ?.filter((s: any) => s.analytics?.[0]?.average_call_quality)
      .reduce((sum: number, s: any) => sum + s.analytics[0].average_call_quality, 0) / (sessions?.length || 1)

    return {
      success: true,
      statistics: {
        totalCalls,
        completedCalls,
        totalMinutes: Math.round(totalMinutes),
        avgDurationMinutes: Math.round(avgDuration * 100) / 100,
        avgCallQuality: Math.round(avgQuality * 100) / 100
      }
    }
  } catch (error: any) {
    console.error('Get video call statistics error:', error)
    return { error: error.message }
  }
}

// ============================================
// AGORA TOKEN GENERATION (PLACEHOLDER)
// ============================================

async function generateAgoraToken(channelName: string, userId: string): Promise<string> {
  // TODO: Implement actual Agora token generation
  // For now, return a placeholder
  // 
  // You'll need to:
  // 1. Install Agora SDK: npm install agora-access-token
  // 2. Import: const { RtcTokenBuilder, RtcRole } = require('agora-access-token')
  // 3. Generate token with your AGORA_APP_ID and AGORA_APP_CERTIFICATE
  
  return `agora-token-${channelName}-${userId}-${Date.now()}`
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export async function scheduleVideoCall(formData: FormData) {
  const supabase = await createClient()
  
  const serviceRequestId = formData.get('service_request_id') as string
  const scheduledFor = formData.get('scheduled_for') as string
  const participantIds = formData.get('participant_ids') as string

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Create session
    const result = await createVideoCallSession(formData)
    
    if (!result.success || !result.session) {
      return result
    }

    // Add other participants
    if (participantIds) {
      const ids = participantIds.split(',')
      for (const participantId of ids) {
        await addCallParticipant(result.session.id, participantId.trim(), 'participant')
      }
    }

    return { success: true, session: result.session }
  } catch (error: any) {
    console.error('Schedule video call error:', error)
    return { error: error.message }
  }
}

export async function cancelScheduledCall(sessionId: string, reason: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('video_call_sessions')
      .update({
        status: 'cancelled',
        cancellation_reason: reason,
        cancelled_by: user.id,
        cancelled_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/customer/video-calls')
    revalidatePath('/helper/video-calls')
    return { success: true, session: data }
  } catch (error: any) {
    console.error('Cancel scheduled call error:', error)
    return { error: error.message }
  }
}
