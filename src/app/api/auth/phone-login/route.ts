import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      )
    }

    let admin
    try {
      admin = createAdminClient()
    } catch {
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    // Lookup via profiles (fast + role-safe)
    const { data: profile, error: profileLookupError } = await admin
      .from('profiles')
      .select('email')
      .eq('phone', phone)
      .maybeSingle()

    if (profileLookupError) {
      console.error('Failed to lookup profile:', profileLookupError)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }

    const phoneEmail = profile?.email || `${phone}@phone.helparo.in`

    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate session using admin API
    const { data: sessionData, error: sessionError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: phoneEmail
    })

    if (sessionError || !sessionData) {
      console.error('Failed to generate session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Exchange the magic link token for a session
    const { data: { session }, error: exchangeError } = await supabase.auth.verifyOtp({
      token_hash: sessionData.properties.hashed_token,
      type: 'magiclink'
    })

    if (exchangeError || !session) {
      console.error('Failed to exchange token:', exchangeError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Phone login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
