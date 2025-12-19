import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * DEBUG ONLY - Check broadcast notifications for a request
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Get latest 10 broadcast notifications
    const { data: notifications, error } = await supabase
      .from('broadcast_notifications')
      .select(`
        id,
        request_id,
        helper_id,
        status,
        distance_km,
        sent_at,
        responded_at
      `)
      .order('sent_at', { ascending: false })
      .limit(10)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Also get the latest service requests in broadcasting status
    const { data: requests } = await supabase
      .from('service_requests')
      .select('id, title, status, broadcast_status, assigned_helper_id')
      .eq('broadcast_status', 'broadcasting')
      .order('created_at', { ascending: false })
      .limit(5)
    
    return NextResponse.json({
      notifications,
      activeRequests: requests
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
