import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated', authError }, { status: 401 })
    }
    
    // Get helper profile
    const { data: helperProfile, error: helperError } = await supabase
      .from('helper_profiles')
      .select('id, is_on_job, is_online, is_available_now')
      .eq('user_id', user.id)
      .single()
    
    if (helperError || !helperProfile) {
      return NextResponse.json({ error: 'Not a helper', helperError }, { status: 404 })
    }

    // Get user's profile to check role
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    // Get notifications using regular client WITH service_request join (to test RLS on both tables)
    const { data: rlsNotificationsWithJoin, error: rlsJoinError } = await supabase
      .from('broadcast_notifications')
      .select(`
        id,
        request_id,
        status,
        sent_at,
        service_request:request_id (id, status, title)
      `)
      .eq('helper_id', helperProfile.id)
      .in('status', ['sent', 'pending'])
      .order('sent_at', { ascending: false })
      .limit(5)
    
    // Get notifications using regular client (to test RLS)
    const { data: rlsNotifications, error: rlsError } = await supabase
      .from('broadcast_notifications')
      .select(`
        id,
        request_id,
        status,
        sent_at
      `)
      .eq('helper_id', helperProfile.id)
      .in('status', ['sent', 'pending'])
      .order('sent_at', { ascending: false })
      .limit(5)
    
    // Get notifications using admin client (bypass RLS)
    const { data: adminNotifications, error: adminError } = await adminSupabase
      .from('broadcast_notifications')
      .select(`
        id,
        request_id,
        status,
        sent_at,
        service_request:request_id (id, status, title)
      `)
      .eq('helper_id', helperProfile.id)
      .in('status', ['sent', 'pending'])
      .order('sent_at', { ascending: false })
      .limit(5)
    
    return NextResponse.json({
      userId: user.id,
      userRole: userProfile?.role || 'unknown',
      helperProfile,
      rlsNotifications: rlsNotifications || [],
      rlsError: rlsError?.message || null,
      rlsNotificationsWithJoin: rlsNotificationsWithJoin || [],
      rlsJoinError: rlsJoinError?.message || null,
      adminNotifications: adminNotifications || [],
      adminError: adminError?.message || null,
      rlsCount: rlsNotifications?.length || 0,
      rlsJoinCount: rlsNotificationsWithJoin?.length || 0,
      adminCount: adminNotifications?.length || 0,
      note: 'If rlsCount > 0 but rlsJoinCount = 0, the service_request RLS is blocking the JOIN'
    })
  } catch (error: any) {
    console.error('Debug my-notifications error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
