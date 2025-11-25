'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'
import { UserRole } from '@/lib/constants'
import { handleServerActionError } from '@/lib/errors'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function startJob(requestId: string) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    await rateLimit('start-job', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('start_job', { p_request_id: requestId } as any)
    
    if (error) throw error

    logger.info('Job started', { userId: user.id, requestId })
    return { data }
  } catch (error: any) {
    logger.error('Start job error', { error })
    return handleServerActionError(error)
  }
}

export async function recordArrival(requestId: string) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    await rateLimit('record-arrival', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('record_arrival', { p_request_id: requestId } as any)
    
    if (error) throw error

    logger.info('Arrival recorded', { userId: user.id, requestId })
    return { data }
  } catch (error: any) {
    logger.error('Record arrival error', { error })
    return handleServerActionError(error)
  }
}

export async function completeJob(requestId: string) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    await rateLimit('complete-job', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('complete_job', { p_request_id: requestId } as any)
    
    if (error) throw error

    logger.info('Job completed', { userId: user.id, requestId })
    return { data }
  } catch (error: any) {
    logger.error('Complete job error', { error })
    return handleServerActionError(error)
  }
}

export async function getTimeline(requestId: string) {
  try {
    await rateLimit('get-timeline', requestId, RATE_LIMITS.API_RELAXED)

    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_job_timeline', { p_request_id: requestId } as any)
    
    if (error) throw error

    return { data }
  } catch (error: any) {
    logger.error('Get timeline error', { error })
    return handleServerActionError(error)
  }
}

/**
 * GET TIME TRACKING DATA
 * Returns time entries and statistics for a given period
 */
export async function getTimeTrackingData(period: string = 'week') {
  try {
    const { user } = await requireAuth(UserRole.HELPER)

    const supabase = await createClient()

    // Get helper profile
    const { data: helperProfile } = await supabase
      .from('helper_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!helperProfile) {
      return { error: 'Helper profile not found' }
    }

    // Calculate date range
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    // Get time tracking entries
    const { data: entries, error } = await supabase
      .from('time_tracking_logs')
      .select(`
        id,
        started_at,
        ended_at,
        total_minutes,
        is_active,
        break_count,
        service_requests(id, title)
      `)
      .eq('helper_id', helperProfile.id)
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: false })

    if (error) {
      logger.error('Failed to fetch time entries', { error })
      return { error: 'Failed to load time tracking data' }
    }

    type EntryWithRequest = {
      id: string
      started_at: string
      ended_at: string | null
      total_minutes: number
      is_active: boolean
      break_count: number
      service_requests: Array<{ id: string; title: string | null }>
    }

    // Calculate statistics
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    const todayEntries = (entries as unknown as EntryWithRequest[])?.filter(e =>
      new Date(e.started_at) >= today
    ) || []

    const weekEntries = (entries as unknown as EntryWithRequest[])?.filter(e =>
      new Date(e.started_at) >= weekAgo
    ) || []

    const monthEntries = (entries as unknown as EntryWithRequest[])?.filter(e =>
      new Date(e.started_at) >= monthAgo
    ) || []

    const stats = {
      today: {
        total_minutes: todayEntries.reduce((sum, e) => sum + (e.total_minutes || 0), 0),
        jobs_count: todayEntries.length,
        breaks_count: todayEntries.reduce((sum, e) => sum + (e.break_count || 0), 0),
      },
      this_week: {
        total_minutes: weekEntries.reduce((sum, e) => sum + (e.total_minutes || 0), 0),
        jobs_count: weekEntries.length,
        average_per_day: Math.round(
          weekEntries.reduce((sum, e) => sum + (e.total_minutes || 0), 0) / 7
        ),
      },
      this_month: {
        total_minutes: monthEntries.reduce((sum, e) => sum + (e.total_minutes || 0), 0),
        jobs_count: monthEntries.length,
        average_per_day: Math.round(
          monthEntries.reduce((sum, e) => sum + (e.total_minutes || 0), 0) / 30
        ),
      },
    }

    return {
      data: {
        entries: (entries as unknown as EntryWithRequest[])?.map(e => ({
          id: e.id,
          job_title: e.service_requests?.[0]?.title || 'Unknown Job',
          job_id: e.service_requests?.[0]?.id || '',
          started_at: e.started_at,
          ended_at: e.ended_at,
          total_minutes: e.total_minutes || 0,
          is_active: e.is_active,
          breaks: e.break_count || 0,
        })) || [],
        stats,
      },
    }
  } catch (error) {
    logger.error('Get time tracking data error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * START TIMER
 * Start tracking time for a job
 */
export async function startTimer(jobId: string) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)

    const supabase = await createClient()

    // Get helper profile
    const { data: helperProfile } = await supabase
      .from('helper_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!helperProfile) {
      return { error: 'Helper profile not found' }
    }

    // Check if there's already an active timer
    const { data: activeTimer } = await supabase
      .from('time_tracking_logs')
      .select('id')
      .eq('helper_id', helperProfile.id)
      .eq('is_active', true)
      .maybeSingle()

    if (activeTimer) {
      return { error: 'Please stop your current timer before starting a new one' }
    }

    // Create new time entry
    const { error: insertError } = await supabase
      .from('time_tracking_logs')
      .insert({
        request_id: jobId,
        helper_id: helperProfile.id,
        started_at: new Date().toISOString(),
        is_active: true,
        total_minutes: 0,
        break_count: 0,
      })

    if (insertError) {
      logger.error('Failed to start timer', { error: insertError })
      return { error: 'Failed to start timer' }
    }

    logger.info('Timer started', {
      job_id: jobId,
      helper_id: helperProfile.id,
    })

    return { success: true }
  } catch (error) {
    logger.error('Start timer error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * PAUSE TIMER
 * Pause an active timer (not implemented in basic version - just stops it)
 */
export async function pauseTimer(entryId: string) {
  return stopTimer(entryId)
}

/**
 * STOP TIMER
 * Stop an active timer and calculate total time
 */
export async function stopTimer(entryId: string) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)

    const supabase = await createClient()

    // Get helper profile
    const { data: helperProfile } = await supabase
      .from('helper_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!helperProfile) {
      return { error: 'Helper profile not found' }
    }

    // Get the time entry
    const { data: entry, error: entryError } = await supabase
      .from('time_tracking_logs')
      .select('id, started_at, helper_id, is_active')
      .eq('id', entryId)
      .maybeSingle()

    if (entryError || !entry) {
      return { error: 'Time entry not found' }
    }

    if (entry.helper_id !== helperProfile.id) {
      return { error: 'You do not have permission to stop this timer' }
    }

    if (!entry.is_active) {
      return { error: 'This timer is already stopped' }
    }

    // Calculate duration
    const endTime = new Date()
    const startTime = new Date(entry.started_at)
    const durationMs = endTime.getTime() - startTime.getTime()
    const totalMinutes = Math.round(durationMs / 60000)

    // Update time entry
    const { error: updateError } = await supabase
      .from('time_tracking_logs')
      .update({
        ended_at: endTime.toISOString(),
        total_minutes: totalMinutes,
        is_active: false,
      })
      .eq('id', entryId)

    if (updateError) {
      logger.error('Failed to stop timer', { error: updateError })
      return { error: 'Failed to stop timer' }
    }

    logger.info('Timer stopped', {
      entry_id: entryId,
      helper_id: helperProfile.id,
      duration_minutes: totalMinutes,
    })

    return { success: true }
  } catch (error) {
    logger.error('Stop timer error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * ADD BREAK
 * Increment the break counter for a time entry
 */
export async function addBreak(entryId: string) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)

    const supabase = await createClient()

    // Get helper profile
    const { data: helperProfile } = await supabase
      .from('helper_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!helperProfile) {
      return { error: 'Helper profile not found' }
    }

    // Get current break count
    const { data: entry } = await supabase
      .from('time_tracking_logs')
      .select('break_count, helper_id')
      .eq('id', entryId)
      .maybeSingle()

    if (!entry) {
      return { error: 'Time entry not found' }
    }

    if (entry.helper_id !== helperProfile.id) {
      return { error: 'You do not have permission to update this entry' }
    }

    // Increment break count
    const { error: updateError } = await supabase
      .from('time_tracking_logs')
      .update({
        break_count: (entry.break_count || 0) + 1,
      })
      .eq('id', entryId)

    if (updateError) {
      logger.error('Failed to add break', { error: updateError })
      return { error: 'Failed to add break' }
    }

    return { success: true }
  } catch (error) {
    logger.error('Add break error', { error })
    return { error: 'An unexpected error occurred' }
  }
}
