import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Debug endpoint to diagnose why helpers are not getting notifications
 * GET /api/debug/broadcast-test
 * 
 * This checks:
 * 1. Online helpers
 * 2. Their locations
 * 3. Their FCM tokens
 * 4. Their categories
 */
export async function GET(request: NextRequest) {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    diagnosis: []
  }

  try {
    const supabase = createAdminClient()

    // 1. Find ALL helper profiles (not just online)
    const { data: allHelpers, error: helpersError } = await supabase
      .from('helper_profiles')
      .select(`
        id,
        user_id,
        is_online,
        is_on_job,
        is_approved,
        verification_status,
        latitude,
        longitude,
        service_categories,
        service_radius_km
      `)
      .eq('is_approved', true)

    if (helpersError) {
      results.error = 'Failed to query helpers: ' + helpersError.message
      return NextResponse.json(results, { status: 500 })
    }

    results.totalApprovedHelpers = allHelpers?.length || 0
    results.helpers = []

    for (const helper of (allHelpers || [])) {
      const helperInfo: Record<string, any> = {
        id: helper.id,
        user_id: helper.user_id,
        is_online: helper.is_online,
        is_on_job: helper.is_on_job,
        verification_status: helper.verification_status,
        has_location: !!(helper.latitude && helper.longitude),
        location: helper.latitude && helper.longitude ? `${helper.latitude}, ${helper.longitude}` : 'NOT SET',
        categories: helper.service_categories || [],
        issues: []
      }

      // Check for issues
      if (!helper.is_online) {
        helperInfo.issues.push('NOT ONLINE')
      }
      if (helper.is_on_job) {
        helperInfo.issues.push('ON ANOTHER JOB')
      }
      if (!helper.latitude || !helper.longitude) {
        helperInfo.issues.push('NO LOCATION SET')
      }
      if (!helper.service_categories || helper.service_categories.length === 0) {
        helperInfo.issues.push('NO SERVICE CATEGORIES')
      }

      // Check FCM token
      const { data: tokens } = await supabase
        .from('device_tokens')
        .select('token, is_active, last_seen_at')
        .eq('user_id', helper.user_id)

      helperInfo.fcm_tokens = tokens?.length || 0
      helperInfo.active_tokens = tokens?.filter((t: any) => t.is_active).length || 0
      
      if (!tokens || tokens.length === 0) {
        helperInfo.issues.push('NO FCM TOKEN REGISTERED')
      } else if (!tokens.some((t: any) => t.is_active)) {
        helperInfo.issues.push('NO ACTIVE FCM TOKEN')
      }

      helperInfo.canReceiveNotifications = helperInfo.issues.length === 0

      results.helpers.push(helperInfo)
    }

    // Summary
    results.summary = {
      totalApproved: results.totalApprovedHelpers,
      online: results.helpers.filter((h: any) => h.is_online).length,
      withLocation: results.helpers.filter((h: any) => h.has_location).length,
      withFcmToken: results.helpers.filter((h: any) => h.fcm_tokens > 0).length,
      canReceiveNotifications: results.helpers.filter((h: any) => h.canReceiveNotifications).length
    }

    return NextResponse.json(results)
  } catch (error: any) {
    results.error = error.message
    return NextResponse.json(results, { status: 500 })
  }
}
