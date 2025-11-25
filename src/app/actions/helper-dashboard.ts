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

    // Today's earnings
    const { data: todayEarnings } = await supabase
      .from('transactions')
      .select('amount')
      .eq('helper_id', helperId)
      .eq('transaction_type', 'earning')
      .eq('status', 'completed')
      .gte('created_at', today.toISOString())

    // This week's earnings
    const { data: weekEarnings } = await supabase
      .from('transactions')
      .select('amount')
      .eq('helper_id', helperId)
      .eq('transaction_type', 'earning')
      .eq('status', 'completed')
      .gte('created_at', weekAgo.toISOString())

    // This month's earnings
    const { data: monthEarnings } = await supabase
      .from('transactions')
      .select('amount')
      .eq('helper_id', helperId)
      .eq('transaction_type', 'earning')
      .eq('status', 'completed')
      .gte('created_at', monthAgo.toISOString())

    // Pending earnings
    const { data: pendingEarnings } = await supabase
      .from('transactions')
      .select('amount')
      .eq('helper_id', helperId)
      .eq('transaction_type', 'earning')
      .eq('status', 'pending')

    // Jobs statistics
    const { data: activeJobs } = await supabase
      .from('service_requests')
      .select('id')
      .eq('helper_id', helperId)
      .in('status', ['accepted', 'in_progress'])

    const { data: completedJobs } = await supabase
      .from('service_requests')
      .select('id')
      .eq('helper_id', helperId)
      .eq('status', 'completed')

    const { data: pendingJobs } = await supabase
      .from('service_requests')
      .select('id')
      .eq('helper_id', helperId)
      .eq('status', 'pending')

    const { data: totalJobs } = await supabase
      .from('service_requests')
      .select('id')
      .eq('helper_id', helperId)

    // Rating statistics
    const { data: ratingData } = await supabase
      .from('helper_rating_summary')
      .select('average_rating, total_reviews')
      .eq('helper_id', helperId)
      .maybeSingle()

    // Recent jobs (last 5)
    const { data: recentJobs } = await supabase
      .from('service_requests')
      .select(`
        id,
        title,
        status,
        scheduled_time,
        pricing_option,
        profiles!customer_id(full_name)
      `)
      .eq('helper_id', helperId)
      .in('status', ['completed', 'cancelled'])
      .order('updated_at', { ascending: false })
      .limit(5)

    // Upcoming jobs (next 5)
    const { data: upcomingJobs } = await supabase
      .from('service_requests')
      .select(`
        id,
        title,
        scheduled_time,
        location_address,
        profiles!customer_id(full_name)
      `)
      .eq('helper_id', helperId)
      .in('status', ['accepted', 'pending'])
      .gte('scheduled_time', new Date().toISOString())
      .order('scheduled_time', { ascending: true })
      .limit(5)

    type JobData = {
      id: string
      title: string | null
      status: string
      scheduled_time: string | null
      pricing_option: Record<string, unknown> | null
      profiles: { full_name: string | null } | null
    }

    type UpcomingJobData = {
      id: string
      title: string | null
      scheduled_time: string | null
      location_address: string | null
      profiles: { full_name: string | null } | null
    }

    // Calculate totals
    const todayTotal = todayEarnings?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
    const weekTotal = weekEarnings?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
    const monthTotal = monthEarnings?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
    const pendingTotal = pendingEarnings?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0

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
        recentJobs: recentJobs?.map((job: JobData) => ({
          id: job.id,
          title: job.title || 'Untitled Job',
          customer_name: job.profiles?.full_name || 'Unknown Customer',
          status: job.status,
          amount: (job.pricing_option as { quoted_price?: number })?.quoted_price || 0,
          scheduled_time: job.scheduled_time || new Date().toISOString(),
        })) || [],
        upcomingJobs: upcomingJobs?.map((job: UpcomingJobData) => ({
          id: job.id,
          title: job.title || 'Untitled Job',
          customer_name: job.profiles?.full_name || 'Unknown Customer',
          scheduled_time: job.scheduled_time || new Date().toISOString(),
          location: job.location_address || 'Location not specified',
        })) || [],
      },
    }
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return { error: 'Failed to load dashboard statistics' }
  }
}
