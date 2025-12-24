import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Debug endpoint to check why a helper is not receiving notifications
 * GET /api/debug/helper-notification-check?userId=xxx
 * 
 * NO EGRESS IMPACT - Only reads minimal data for debugging
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Missing userId parameter',
        usage: '/api/debug/helper-notification-check?userId=YOUR_USER_ID'
      }, { status: 400 })
    }

    const supabase = createAdminClient()
    const issues: string[] = []
    const checks: Record<string, any> = {}

    // 1. Check if user exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json({
        error: 'User not found',
        userId
      }, { status: 404 })
    }

    checks.profile = {
      found: true,
      name: profile.full_name,
      role: profile.role
    }

    // 2. Check helper profile
    const { data: helperProfile } = await supabase
      .from('helper_profiles')
      .select('id, user_id, is_online, is_on_job, is_approved, verification_status, service_categories, latitude, longitude, service_radius_km')
      .eq('user_id', userId)
      .single()

    if (!helperProfile) {
      issues.push('❌ No helper_profile found for this user')
      checks.helperProfile = { found: false }
    } else {
      checks.helperProfile = {
        found: true,
        is_online: helperProfile.is_online,
        is_on_job: helperProfile.is_on_job,
        is_approved: helperProfile.is_approved,
        verification_status: helperProfile.verification_status,
        has_location: !!(helperProfile.latitude && helperProfile.longitude),
        latitude: helperProfile.latitude,
        longitude: helperProfile.longitude,
        service_radius_km: helperProfile.service_radius_km,
        service_categories: helperProfile.service_categories || []
      }

      // Check issues
      if (!helperProfile.is_approved) {
        issues.push('❌ Helper is NOT approved (is_approved=false)')
      }
      if (helperProfile.verification_status !== 'approved') {
        issues.push(`❌ verification_status is "${helperProfile.verification_status}" (must be "approved")`)
      }
      if (!helperProfile.is_online) {
        issues.push('⚠️ Helper is OFFLINE (is_online=false) - will NOT receive job notifications')
      }
      if (helperProfile.is_on_job) {
        issues.push('⚠️ Helper is marked as ON A JOB (is_on_job=true)')
      }
      if (!helperProfile.latitude || !helperProfile.longitude) {
        issues.push('❌ Helper has NO service location set (latitude/longitude missing)')
      }
      if (!helperProfile.service_categories || helperProfile.service_categories.length === 0) {
        issues.push('❌ Helper has NO service_categories - will NOT receive ANY job notifications')
      }
    }

    // 3. Check FCM device token
    const { data: tokens } = await supabase
      .from('device_tokens')
      .select('id, token, is_active, last_seen_at')
      .eq('user_id', userId)

    if (!tokens || tokens.length === 0) {
      issues.push('❌ NO device token found - Helper will NOT receive push notifications')
      checks.deviceTokens = { found: false, count: 0 }
    } else {
      const activeTokens = tokens.filter(t => t.is_active)
      checks.deviceTokens = {
        found: true,
        total: tokens.length,
        active: activeTokens.length,
        lastSeen: activeTokens[0]?.last_seen_at
      }

      if (activeTokens.length === 0) {
        issues.push('❌ Device tokens exist but NONE are active (is_active=false)')
      }
    }

    // 4. Check recent notifications sent to this user
    const { data: recentNotifs } = await supabase
      .from('notifications')
      .select('id, title, created_at, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    checks.recentNotifications = {
      count: recentNotifs?.length || 0,
      latest: recentNotifs?.slice(0, 3).map(n => ({
        title: n.title,
        created: n.created_at,
        status: n.status
      }))
    }

    // 5. Check if helper has received any broadcast notifications
    if (helperProfile) {
      const { data: broadcasts } = await supabase
        .from('broadcast_notifications')
        .select('id, request_id, status, sent_at')
        .eq('helper_id', helperProfile.id)
        .order('sent_at', { ascending: false })
        .limit(5)

      checks.broadcastNotifications = {
        count: broadcasts?.length || 0,
        latest: broadcasts?.slice(0, 3)
      }

      if (!broadcasts || broadcasts.length === 0) {
        issues.push('⚠️ No broadcast_notifications found for this helper')
      }
    }

    // 6. List available categories for reference
    const { data: categories } = await supabase
      .from('service_categories')
      .select('id, name, slug')
      .limit(20)

    checks.availableCategories = categories?.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug
    }))

    // Summary
    const canReceiveNotifications = 
      helperProfile?.is_approved && 
      helperProfile?.verification_status === 'approved' &&
      helperProfile?.is_online &&
      !helperProfile?.is_on_job &&
      helperProfile?.latitude &&
      helperProfile?.longitude &&
      helperProfile?.service_categories?.length > 0 &&
      tokens && tokens.some(t => t.is_active)

    return NextResponse.json({
      userId,
      canReceiveNotifications,
      issueCount: issues.length,
      issues,
      checks,
      recommendation: issues.length > 0 
        ? 'Fix the issues above for helper to receive notifications'
        : 'Helper should be able to receive notifications. Check Vercel logs for broadcast API errors.'
    })

  } catch (error: any) {
    console.error('Debug check error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
