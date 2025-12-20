'use server'

import { createClient } from '@/lib/supabase/server'

export async function getHelperDashboardStats() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Get helper profile - create if doesn't exist
    let { data: helperProfile, error: profileError } = await supabase
      .from('helper_profiles')
      .select('id, is_approved, verification_status')
      .eq('user_id', user.id)
      .maybeSingle()

    // Auto-create helper profile if it doesn't exist
    if (!helperProfile && !profileError) {
      const { data: newProfile, error: createError } = await supabase
        .from('helper_profiles')
        .insert({
          user_id: user.id,
          verification_status: 'pending',
          is_approved: false,
        })
        .select('id, is_approved, verification_status')
        .single()

      if (createError) {
        console.error('Failed to create helper profile:', createError)
        return { error: 'Failed to initialize helper profile' }
      }

      helperProfile = newProfile
    }

    if (profileError || !helperProfile) {
      return { error: 'Failed to load helper profile' }
    }

    const helperId = helperProfile.id

    // Get earnings data
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    // Today's earnings - Try helper_earnings table first, fallback to completed service_requests
    let todayTotal = 0
    let weekTotal = 0
    let monthTotal = 0
    let pendingTotal = 0

    // Try helper_earnings table (new system) - wrapped in try-catch for safety
    try {
      const { data: helperEarningsToday } = await supabase
        .from('helper_earnings')
        .select('amount')
        .eq('helper_id', user.id)
        .gte('earned_at', today.toISOString())

      const { data: helperEarningsWeek } = await supabase
        .from('helper_earnings')
        .select('amount')
        .eq('helper_id', user.id)
        .gte('earned_at', weekAgo.toISOString())

      const { data: helperEarningsMonth } = await supabase
        .from('helper_earnings')
        .select('amount')
        .eq('helper_id', user.id)
        .gte('earned_at', monthAgo.toISOString())

      const { data: helperEarningsPending } = await supabase
        .from('helper_earnings')
        .select('amount')
        .eq('helper_id', user.id)
        .eq('status', 'pending')

      if (helperEarningsToday && helperEarningsToday.length > 0) {
        todayTotal = helperEarningsToday.reduce((sum, t) => sum + Number(t.amount || 0), 0)
        weekTotal = helperEarningsWeek?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0
        monthTotal = helperEarningsMonth?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0
        pendingTotal = helperEarningsPending?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0
      }
    } catch (earningsError) {
      console.log('helper_earnings table query failed, using fallback:', earningsError)
    }

    // Fallback: Calculate from completed service_requests if no helper_earnings data
    if (todayTotal === 0) {
      try {
        // Run all earnings queries in parallel
        const [completedToday, completedWeek, completedMonth] = await Promise.all([
          supabase
            .from('service_requests')
            .select('estimated_price')
            .eq('assigned_helper_id', user.id)
            .eq('status', 'completed')
            .gte('work_completed_at', today.toISOString()),
          supabase
            .from('service_requests')
            .select('estimated_price')
            .eq('assigned_helper_id', user.id)
            .eq('status', 'completed')
            .gte('work_completed_at', weekAgo.toISOString()),
          supabase
            .from('service_requests')
            .select('estimated_price')
            .eq('assigned_helper_id', user.id)
            .eq('status', 'completed')
            .gte('work_completed_at', monthAgo.toISOString())
        ])

        todayTotal = completedToday.data?.reduce((sum, r) => sum + (r.estimated_price || 0), 0) || 0
        weekTotal = completedWeek.data?.reduce((sum, r) => sum + (r.estimated_price || 0), 0) || 0
        monthTotal = completedMonth.data?.reduce((sum, r) => sum + (r.estimated_price || 0), 0) || 0
      } catch {}
    }

    // Run all job statistics, rating, and job list queries in parallel
    const [
      activeJobsResult,
      completedJobsResult,
      pendingJobsResult,
      totalJobsResult,
      ratingDataResult,
      recentJobsResult,
      upcomingJobsResult
    ] = await Promise.all([
      // Jobs statistics - use assigned_helper_id (stores user.id)
      // Exclude images from all dashboard queries to reduce egress
      supabase
        .from('service_requests')
        .select('id')
        .eq('assigned_helper_id', user.id)
        .in('status', ['assigned', 'open'])
        .not('broadcast_status', 'eq', 'completed'),
      supabase
        .from('service_requests')
        .select('id')
        .eq('assigned_helper_id', user.id)
        .eq('status', 'completed'),
      supabase
        .from('service_requests')
        .select('id')
        .eq('assigned_helper_id', user.id)
        .eq('broadcast_status', 'accepted')
        .is('work_started_at', null),
      supabase
        .from('service_requests')
        .select('id')
        .eq('assigned_helper_id', user.id),
      // Rating statistics - helper_rating_summary uses user.id (profiles.id), not helper_profiles.id
      supabase
        .from('helper_rating_summary')
        .select('average_rating, total_reviews')
        .eq('helper_id', user.id)
        .maybeSingle(),
      // Recent jobs (last 5) - use assigned_helper_id
      supabase
        .from('service_requests')
        .select(`
          id,
          title,
          status,
          work_completed_at,
          estimated_price,
          customer:customer_id(full_name)
        `)
        .eq('assigned_helper_id', user.id)
        .in('status', ['completed', 'cancelled'])
        .order('work_completed_at', { ascending: false })
        .limit(5),
      // Upcoming/Active jobs (next 5) - use assigned_helper_id
      supabase
        .from('service_requests')
        .select(`
          id,
          title,
          created_at,
          service_address,
          customer:customer_id(full_name)
        `)
        .eq('assigned_helper_id', user.id)
        .in('broadcast_status', ['accepted'])
        .eq('status', 'assigned')
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    const activeJobs = activeJobsResult.data
    const completedJobs = completedJobsResult.data
    const pendingJobs = pendingJobsResult.data
    const totalJobs = totalJobsResult.data
    const ratingData = ratingDataResult.data
    const recentJobs = recentJobsResult.data
    const upcomingJobs = upcomingJobsResult.data

    type JobData = {
      id: string
      title: string | null
      status: string
      work_completed_at: string | null
      estimated_price: number | null
      customer: { full_name: string | null } | { full_name: string | null }[] | null
    }

    type UpcomingJobData = {
      id: string
      title: string | null
      created_at: string | null
      service_address: string | null
      customer: { full_name: string | null } | { full_name: string | null }[] | null
    }

    return {
      stats: {
        earnings: {
          today: todayTotal,
          thisWeek: weekTotal,
          thisMonth: monthTotal,
          pending: pendingTotal,
        },
        jobs: {
          active: activeJobs?.length || 0,
          completed: completedJobs?.length || 0,
          pending: pendingJobs?.length || 0,
          total: totalJobs?.length || 0,
        },
        rating: {
          average: ratingData?.average_rating || 0,
          totalReviews: ratingData?.total_reviews || 0,
        },
        verification: {
          isApproved: helperProfile.is_approved || false,
          status: helperProfile.verification_status || 'pending',
        },
        recentJobs: recentJobs?.map((job: JobData) => {
          const customerName = Array.isArray(job.customer) 
            ? job.customer[0]?.full_name 
            : job.customer?.full_name
          return {
            id: job.id,
            title: job.title || 'Service Request',
            customer_name: customerName || 'Customer',
            status: job.status,
            amount: job.estimated_price || 0,
            scheduled_time: job.work_completed_at || new Date().toISOString(),
          }
        }) || [],
        upcomingJobs: upcomingJobs?.map((job: UpcomingJobData) => {
          const customerName = Array.isArray(job.customer) 
            ? job.customer[0]?.full_name 
            : job.customer?.full_name
          return {
            id: job.id,
            title: job.title || 'Service Request',
            customer_name: customerName || 'Customer',
            scheduled_time: job.created_at || new Date().toISOString(),
            location: job.service_address || 'Location not specified',
          }
        }) || [],
      },
    }
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return { error: 'Failed to load dashboard statistics' }
  }
}
