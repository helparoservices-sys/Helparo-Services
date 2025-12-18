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
        service_address,
        latitude,
        longitude,
        preferred_date,
        preferred_time_start,
        preferred_time_end,
        status,
        broadcast_status,
        created_at,
        updated_at,
        estimated_price,
        work_started_at,
        work_completed_at,
        profiles:customer_id(full_name, phone),
        service_categories:category_id(name)
      `)
      .eq('assigned_helper_id', user.id)
      .in('status', ['assigned', 'completed'])
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
      service_address: string | null
      latitude: number | null
      longitude: number | null
      preferred_date: string | null
      preferred_time_start: string | null
      preferred_time_end: string | null
      status: string
      broadcast_status: string | null
      created_at: string
      updated_at: string
      estimated_price: number | null
      work_started_at: string | null
      work_completed_at: string | null
      profiles: { full_name: string | null; phone: string | null } | null
      service_categories: { name: string | null } | null
    }

    // Transform jobs
    const transformedJobs = ((jobs ?? []) as unknown as JobWithRelations[]).map(job => {
      // Get customer profile and category (could be object or array)
      const customer = Array.isArray(job.profiles) ? job.profiles[0] : job.profiles
      const category = Array.isArray(job.service_categories) ? job.service_categories[0] : job.service_categories

      // Format scheduled time from preferred_date and preferred_time_start
      let scheduledTime = null
      if (job.preferred_date) {
        scheduledTime = job.preferred_date
        if (job.preferred_time_start) {
          scheduledTime += ` ${job.preferred_time_start}`
          if (job.preferred_time_end) {
            scheduledTime += ` - ${job.preferred_time_end}`
          }
        }
      }

      // Calculate time tracking from work_started_at
      let totalMinutes = 0
      let isActive = false
      if (job.work_started_at) {
        const start = new Date(job.work_started_at).getTime()
        const end = job.work_completed_at ? new Date(job.work_completed_at).getTime() : Date.now()
        totalMinutes = Math.floor((end - start) / 60000)
        isActive = !job.work_completed_at && job.status === 'assigned'
      }

      return {
        id: job.id,
        booking_number: job.booking_number,
        title: job.title || 'Untitled Job',
        description: job.description || '',
        category: category?.name || 'Uncategorized',
        customer_name: customer?.full_name || 'Unknown Customer',
        customer_phone: customer?.phone || null,
        location_address: job.service_address || 'Location not specified',
        latitude: job.latitude,
        longitude: job.longitude,
        scheduled_time: scheduledTime,
        status: job.status,
        amount: job.estimated_price || 0,
        created_at: job.created_at,
        updated_at: job.updated_at,
        time_tracking: {
          started_at: job.work_started_at || null,
          ended_at: job.work_completed_at || null,
          total_minutes: totalMinutes,
          is_active: isActive,
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
    const { data: helperProfileRaw } = await supabase
      .from('helper_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const helperProfile = helperProfileRaw as unknown as { id: string } | null

    if (!helperProfile) {
      return { error: 'Helper profile not found' }
    }

    // Validate status transition
    const validStatuses = ['draft', 'open', 'assigned', 'completed', 'cancelled']
    if (!validStatuses.includes(newStatus)) {
      return { error: 'Invalid status' }
    }

    // Check if job exists and belongs to helper
    const { data: jobRaw, error: jobError } = await supabase
      .from('service_requests')
      .select('id, status, helper_id, assigned_helper_id')
      .eq('id', jobId)
      .maybeSingle()

    const job = jobRaw as unknown as {
      id: string
      status: string
      helper_id: string | null
      assigned_helper_id: string | null
    } | null

    if (jobError || !job) {
      return { error: 'Job not found' }
    }

    const assignedMatchesUser = job.assigned_helper_id === user.id
    const helperMatchesProfile = job.helper_id ? job.helper_id === helperProfile.id : false

    if (!assignedMatchesUser && !helperMatchesProfile) {
      return { error: 'You do not have permission to update this job' }
    }

    // Update status
    const { error: updateError } = await supabase
      .from('service_requests')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', jobId)

    if (updateError) {
      logger.error('Failed to update job status', { error: updateError })
      return { error: 'Failed to update job status' }
    }

    // If job is completed/cancelled, helper is no longer on a job
    if (newStatus === 'completed' || newStatus === 'cancelled') {
      await supabase
        .from('helper_profiles')
        .update({ is_on_job: false } as never)
        .eq('id', helperProfile.id)
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
    const { data: helperProfileRaw } = await supabase
      .from('helper_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const helperProfile = helperProfileRaw as unknown as { id: string } | null

    if (!helperProfile) {
      return { error: 'Helper profile not found' }
    }

    // Ensure the job belongs to the helper (by user id or helper profile)
    const { data: jobRaw, error: jobError } = await supabase
      .from('service_requests')
      .select('assigned_helper_id, helper_id')
      .eq('id', jobId)
      .maybeSingle()

    const job = jobRaw as unknown as {
      assigned_helper_id: string | null
      helper_id: string | null
    } | null

    if (jobError || !job) {
      return { error: 'Job not found' }
    }

    const assignedMatchesUser = job.assigned_helper_id === user.id
    const helperMatchesProfile = job.helper_id ? job.helper_id === helperProfile.id : false

    if (!assignedMatchesUser && !helperMatchesProfile) {
      return { error: 'You do not have permission to start this timer' }
    }

    // Check if there's already an active timer
    const { data: activeLogRaw } = await supabase
      .from('time_tracking_logs')
      .select('id')
      .eq('request_id', jobId)
      .eq('helper_id', helperProfile.id)
      .eq('is_active', true)
      .maybeSingle()

    const activeLog = activeLogRaw as unknown as { id: string } | null

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
      } as never)

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
    const { data: helperProfileRaw } = await supabase
      .from('helper_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const helperProfile = helperProfileRaw as unknown as { id: string } | null

    if (!helperProfile) {
      return { error: 'Helper profile not found' }
    }

    // Ensure the job belongs to the helper (by user id or helper profile)
    const { data: jobRaw, error: jobError } = await supabase
      .from('service_requests')
      .select('assigned_helper_id, helper_id')
      .eq('id', jobId)
      .maybeSingle()

    const job = jobRaw as unknown as {
      assigned_helper_id: string | null
      helper_id: string | null
    } | null

    if (jobError || !job) {
      return { error: 'Job not found' }
    }

    const assignedMatchesUser = job.assigned_helper_id === user.id
    const helperMatchesProfile = job.helper_id ? job.helper_id === helperProfile.id : false

    if (!assignedMatchesUser && !helperMatchesProfile) {
      return { error: 'You do not have permission to stop this timer' }
    }

    // Find active timer
    const { data: activeLogRaw, error: logError } = await supabase
      .from('time_tracking_logs')
      .select('id, started_at')
      .eq('request_id', jobId)
      .eq('helper_id', helperProfile.id)
      .eq('is_active', true)
      .maybeSingle()

    const activeLog = activeLogRaw as unknown as { id: string; started_at: string | null } | null

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
      } as never)
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
