import { createAdminClient } from '@/lib/supabase/admin'
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

    let admin
    try {
      admin = createAdminClient()
    } catch {
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      )
    }

    // Check if phone already exists
    const { data: existingProfile } = await admin
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

    const { data: authData, error: createError } = await admin.auth.admin.createUser({
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

    // Update profile (the auth trigger already creates a profile row)
    const { error: profileError } = await admin
      .from('profiles')
      .update({
        phone: phone,
        role: role,
        full_name: '',
        email: phoneEmail,
        country_code: '+91',
        phone_verified: true,
        phone_verified_at: new Date().toISOString()
      })
      .eq('id', authData.user.id)

    if (profileError) {
      console.error('Failed to update profile:', profileError)
      // Cleanup: delete the auth user if profile update fails
      await admin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      )
    }

    // Create a Supabase session cookie for the browser
    // (UI uses phone OTP via Firebase; this server-side sign-in just establishes Supabase auth.)
    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: phoneEmail,
      password: tempPassword,
    })

    if (signInError) {
      console.error('Failed to create session:', signInError)
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
