'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'
import { UserRole } from '@/lib/constants'
import { logger } from '@/lib/logger'

/**
 * GET HELPER ASSIGNED JOBS
 * Returns all jobs assigned to the helper
 */
export async function getHelperAssignedJobs() {
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

    // Get assigned jobs - use user.id directly as assigned_helper_id stores user ID
    const { data: jobs, error } = await supabase
      .from('service_requests')
      .select(`
        id,
        booking_number,
        title,
        description,
        category_id,
        location_address,
        latitude,
        longitude,
        scheduled_time,
        status,
        created_at,
        updated_at,
        pricing_option,
        profiles:customer_id(full_name, phone),
        service_categories(name),
        time_tracking_logs(
          started_at,
          ended_at,
          total_minutes,
          is_active
        )
      `)
      .eq('assigned_helper_id', user.id)
      .in('status', ['accepted', 'in_progress', 'assigned'])
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Failed to fetch assigned jobs', { error })
      return { error: 'Failed to load assigned jobs' }
    }

    type JobWithRelations = {
      id: string
      booking_number: string | null
      title: string | null
      description: string | null
      category_id: string | null
      location_address: string | null
      latitude: number | null
      longitude: number | null
      scheduled_time: string | null
      status: string
      created_at: string
      updated_at: string
      pricing_option: Record<string, unknown> | null
      profiles: Array<{ full_name: string | null; phone: string | null }>
      service_categories: Array<{ name: string | null }>
      time_tracking_logs: Array<{
        started_at: string | null
        ended_at: string | null
        total_minutes: number
        is_active: boolean
      }>
    }

    // Transform jobs
    const transformedJobs = (jobs as unknown as JobWithRelations[]).map(job => {
      // Get customer profile (first item from array)
      const customer = job.profiles?.[0]
      const category = job.service_categories?.[0]

      // Get latest time tracking log
      const activeLog = job.time_tracking_logs?.find(log => log.is_active)
      const totalMinutes = job.time_tracking_logs?.reduce((sum, log) => sum + (log.total_minutes || 0), 0) || 0

      return {
        id: job.id,
        booking_number: job.booking_number,
        title: job.title || 'Untitled Job',
        description: job.description || '',
        category: category?.name || 'Uncategorized',
        customer_name: customer?.full_name || 'Unknown Customer',
        customer_phone: customer?.phone || null,
        location_address: job.location_address || 'Location not specified',
        latitude: job.latitude,
        longitude: job.longitude,
        scheduled_time: job.scheduled_time,
        status: job.status,
        amount: (job.pricing_option as { quoted_price?: number })?.quoted_price || 0,
        created_at: job.created_at,
        updated_at: job.updated_at,
        time_tracking: {
          started_at: activeLog?.started_at || null,
          ended_at: activeLog?.ended_at || null,
          total_minutes: totalMinutes,
          is_active: !!activeLog,
        },
      }
    })

    return { jobs: transformedJobs }
  } catch (error) {
    logger.error('Get assigned jobs error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * UPDATE JOB STATUS
 * Update status of an assigned job
 */
export async function updateJobStatus(jobId: string, newStatus: string) {
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

    // Validate status transition
    const validStatuses = ['accepted', 'in_progress', 'completed', 'cancelled']
    if (!validStatuses.includes(newStatus)) {
      return { error: 'Invalid status' }
    }

    // Check if job exists and belongs to helper
    const { data: job, error: jobError } = await supabase
      .from('service_requests')
      .select('id, status, helper_id')
      .eq('id', jobId)
      .maybeSingle()

    if (jobError || !job) {
      return { error: 'Job not found' }
    }

    if (job.helper_id !== helperProfile.id) {
      return { error: 'You do not have permission to update this job' }
    }

    // Update status
    const { error: updateError } = await supabase
      .from('service_requests')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    if (updateError) {
      logger.error('Failed to update job status', { error: updateError })
      return { error: 'Failed to update job status' }
    }

    logger.info('Job status updated', {
      job_id: jobId,
      helper_id: helperProfile.id,
      new_status: newStatus,
    })

    return { success: true }
  } catch (error) {
    logger.error('Update job status error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * START JOB TIMER
 * Start time tracking for a job
 */
export async function startJobTimer(jobId: string) {
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
    const { data: activeLog } = await supabase
      .from('time_tracking_logs')
      .select('id')
      .eq('request_id', jobId)
      .eq('is_active', true)
      .maybeSingle()

    if (activeLog) {
      return { error: 'Timer is already running for this job' }
    }

    // Create new time tracking log
    const { error: insertError } = await supabase
      .from('time_tracking_logs')
      .insert({
        request_id: jobId,
        helper_id: helperProfile.id,
        started_at: new Date().toISOString(),
        is_active: true,
        total_minutes: 0,
      })

    if (insertError) {
      logger.error('Failed to start job timer', { error: insertError })
      return { error: 'Failed to start timer' }
    }

    logger.info('Job timer started', {
      job_id: jobId,
      helper_id: helperProfile.id,
    })

    return { success: true }
  } catch (error) {
    logger.error('Start job timer error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * STOP JOB TIMER
 * Stop time tracking for a job and calculate duration
 */
export async function stopJobTimer(jobId: string) {
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

    // Find active timer
    const { data: activeLog, error: logError } = await supabase
      .from('time_tracking_logs')
      .select('id, started_at')
      .eq('request_id', jobId)
      .eq('helper_id', helperProfile.id)
      .eq('is_active', true)
      .maybeSingle()

    if (logError || !activeLog) {
      return { error: 'No active timer found for this job' }
    }

    // Calculate duration in minutes
    const endTime = new Date()
    const startTime = new Date(activeLog.started_at!)
    const durationMs = endTime.getTime() - startTime.getTime()
    const totalMinutes = Math.round(durationMs / 60000)

    // Update time tracking log
    const { error: updateError } = await supabase
      .from('time_tracking_logs')
      .update({
        ended_at: endTime.toISOString(),
        total_minutes: totalMinutes,
        is_active: false,
      })
      .eq('id', activeLog.id)

    if (updateError) {
      logger.error('Failed to stop job timer', { error: updateError })
      return { error: 'Failed to stop timer' }
    }

    logger.info('Job timer stopped', {
      job_id: jobId,
      helper_id: helperProfile.id,
      duration_minutes: totalMinutes,
    })

    return { success: true }
  } catch (error) {
    logger.error('Stop job timer error', { error })
    return { error: 'An unexpected error occurred' }
  }
}
