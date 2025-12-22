import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * Optimized helper dashboard API - single request for all data
 * Reduces multiple auth checks and DB roundtrips to ONE
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    
    // Date calculations
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    // Single parallel fetch for ALL dashboard data
    const [
      // User profile check
      userProfileResult,
      // Helper profile (includes availability)
      helperProfileResult,
      // Earnings - today
      earningsTodayResult,
      // Earnings - week
      earningsWeekResult,
      // Earnings - month
      earningsMonthResult,
      // Active jobs count
      activeJobsResult,
      // Completed jobs count
      completedJobsResult,
      // Rating
      ratingResult,
      // Recent jobs (last 5)
      recentJobsResult,
      // Active assigned job (for job card)
      assignedJobResult,
    ] = await Promise.all([
      // User profile
      adminClient
        .from('profiles')
        .select('phone, phone_verified')
        .eq('id', user.id)
        .single(),
      // Helper profile with availability
      adminClient
        .from('helper_profiles')
        .select('id, is_approved, verification_status, address, service_categories, is_available_now, is_on_job')
        .eq('user_id', user.id)
        .maybeSingle(),
      // Earnings today (from service_requests)
      adminClient
        .from('service_requests')
        .select('estimated_price')
        .eq('assigned_helper_id', user.id)
        .eq('status', 'completed')
        .gte('work_completed_at', today.toISOString()),
      // Earnings week
      adminClient
        .from('service_requests')
        .select('estimated_price')
        .eq('assigned_helper_id', user.id)
        .eq('status', 'completed')
        .gte('work_completed_at', weekAgo.toISOString()),
      // Earnings month
      adminClient
        .from('service_requests')
        .select('estimated_price')
        .eq('assigned_helper_id', user.id)
        .eq('status', 'completed')
        .gte('work_completed_at', monthAgo.toISOString()),
      // Active jobs
      adminClient
        .from('service_requests')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_helper_id', user.id)
        .in('status', ['assigned', 'open'])
        .not('broadcast_status', 'eq', 'completed'),
      // Completed jobs
      adminClient
        .from('service_requests')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_helper_id', user.id)
        .eq('status', 'completed'),
      // Rating
      adminClient
        .from('helper_rating_summary')
        .select('average_rating, total_reviews')
        .eq('helper_id', user.id)
        .maybeSingle(),
      // Recent jobs
      adminClient
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
      // Current assigned job
      adminClient
        .from('service_requests')
        .select(`
          id,
          title,
          description,
          service_address,
          latitude,
          longitude,
          status,
          broadcast_status,
          estimated_price,
          customer:customer_id(full_name, phone)
        `)
        .eq('assigned_helper_id', user.id)
        .eq('status', 'assigned')
        .maybeSingle(),
    ])

    const userProfile = userProfileResult.data
    const helperProfile = helperProfileResult.data

    // Check if profile setup is complete
    const needsPhoneVerification = !userProfile?.phone || !userProfile?.phone_verified
    const needsOnboarding = !helperProfile?.address || !helperProfile?.service_categories?.length

    if (needsPhoneVerification) {
      return NextResponse.json({ redirect: '/auth/complete-signup' })
    }

    if (needsOnboarding) {
      return NextResponse.json({ redirect: '/helper/onboarding' })
    }

    // Calculate earnings
    const todayTotal = earningsTodayResult.data?.reduce((sum: number, r: any) => sum + (r.estimated_price || 0), 0) || 0
    const weekTotal = earningsWeekResult.data?.reduce((sum: number, r: any) => sum + (r.estimated_price || 0), 0) || 0
    const monthTotal = earningsMonthResult.data?.reduce((sum: number, r: any) => sum + (r.estimated_price || 0), 0) || 0

    // Transform recent jobs
    const recentJobs = (recentJobsResult.data || []).map((job: any) => {
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
    })

    // Transform active job
    let activeJob = null
    if (assignedJobResult.data) {
      const job = assignedJobResult.data as any
      const customer = Array.isArray(job.customer) ? job.customer[0] : job.customer
      activeJob = {
        id: job.id,
        title: job.title || 'Service Request',
        description: job.description || '',
        location_address: job.service_address || '',
        latitude: job.latitude,
        longitude: job.longitude,
        status: job.status,
        amount: job.estimated_price || 0,
        customer_name: customer?.full_name || 'Customer',
        customer_phone: customer?.phone || null,
      }
    }

    return NextResponse.json({
      stats: {
        earnings: {
          today: todayTotal,
          thisWeek: weekTotal,
          thisMonth: monthTotal,
          pending: 0,
        },
        jobs: {
          active: activeJobsResult.count || 0,
          completed: completedJobsResult.count || 0,
          pending: 0,
          total: (activeJobsResult.count || 0) + (completedJobsResult.count || 0),
        },
        rating: {
          average: ratingResult.data?.average_rating || 0,
          totalReviews: ratingResult.data?.total_reviews || 0,
        },
        verification: {
          isApproved: helperProfile?.is_approved || false,
          status: helperProfile?.verification_status || 'pending',
        },
        recentJobs,
        upcomingJobs: [],
      },
      isAvailableNow: helperProfile?.is_available_now || false,
      activeJob,
      userId: user.id,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
