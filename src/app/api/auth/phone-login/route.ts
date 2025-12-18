import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Find the user's auth account using phone email pattern
    const phoneEmail = `${phone}@phone.helparo.in`
    
    // Get the user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('Failed to list users:', listError)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }

    const user = users?.find(u => u.email === phoneEmail)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate session using admin API
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
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

    // Set the session cookies
    const cookieStore = await cookies()
    
    // Exchange the magic link token for a session
    const { data: { session }, error: exchangeError } = await supabase.auth.verifyOtp({
      token_hash: sessionData.properties.hashed_token,
      type: 'email'
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
