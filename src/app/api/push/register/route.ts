import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { userId, token, platform } = await request.json()
    
    if (!userId || !token) {
      return NextResponse.json({ error: 'Missing userId or token' }, { status: 400 })
    }

    // Use admin client to bypass RLS (server-side API doesn't have auth.uid())
    const supabase = createAdminClient()
    
    // Upsert the device token
    const { error } = await supabase
      .from('device_tokens')
      .upsert(
        { 
          user_id: userId, 
          token, 
          provider: 'fcm',
          device_type: platform || 'android',
          is_active: true,
          last_seen_at: new Date().toISOString()
        },
        { onConflict: 'token' }
      )

    if (error) {
      console.error('Failed to save device token:', error)
      return NextResponse.json({ error: 'Failed to save token', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push register error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
