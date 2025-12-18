import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { phone, role } = await request.json()

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      )
    }

    if (!role || !['customer', 'helper'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if phone already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 400 }
      )
    }

    // Create user with phone-based email
    const phoneEmail = `${phone}@phone.helparo.in`
    const tempPassword = `Phone_${phone}_${Date.now()}`

    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: phoneEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        phone: phone,
        role: role,
        full_name: '',
        signup_method: 'phone'
      }
    })

    if (createError || !authData.user) {
      console.error('Failed to create user:', createError)
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        phone: phone,
        role: role,
        full_name: '',
        email: phoneEmail
      })

    if (profileError) {
      console.error('Failed to create profile:', profileError)
      // Cleanup: delete the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      )
    }

    // Generate session
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: phoneEmail
    })

    if (sessionError || !sessionData) {
      console.error('Failed to generate session:', sessionError)
      return NextResponse.json(
        { error: 'Account created but login failed. Please try logging in.' },
        { status: 500 }
      )
    }

    // Exchange the magic link token for a session
    const { error: exchangeError } = await supabase.auth.verifyOtp({
      token_hash: sessionData.properties.hashed_token,
      type: 'email'
    })

    if (exchangeError) {
      console.error('Failed to exchange token:', exchangeError)
      return NextResponse.json(
        { error: 'Account created but login failed. Please try logging in.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Phone signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
