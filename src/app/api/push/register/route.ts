import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { userId, token, platform } = await request.json()
    
    if (!userId || !token) {
      return NextResponse.json({ error: 'Missing userId or token' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Upsert token (insert or update if exists)
    const { error } = await supabase
      .from('device_tokens')
      .upsert(
        { 
          user_id: userId, 
          token, 
          platform: platform || 'android',
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,token' }
      )

    if (error) {
      console.error('Failed to save device token:', error)
      return NextResponse.json({ error: 'Failed to save token' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push register error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
