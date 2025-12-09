import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, countryCode = '+91' } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '')
    
    if (cleanPhone.length !== 10) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    // Validate phone pattern (Indian numbers start with 6-9)
    if (!/^[6-9]/.test(cleanPhone)) {
      return NextResponse.json({ error: 'Invalid Indian phone number' }, { status: 400 })
    }

    // Block obviously fake numbers
    const invalidPatterns = [
      /^(.)\1{9}$/, // All same digits
      /^1234567890$/,
      /^0123456789$/,
      /^9876543210$/,
    ]
    for (const pattern of invalidPatterns) {
      if (pattern.test(cleanPhone)) {
        return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 })
      }
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if phone already exists for another user
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('phone', cleanPhone)
      .neq('id', user.id)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json({ 
        error: 'This phone number is already registered with another account',
        code: 'PHONE_EXISTS'
      }, { status: 409 })
    }

    // Generate OTP and store for verification
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete any existing unverified OTP for this user
    await supabase
      .from('phone_verifications')
      .delete()
      .eq('user_id', user.id)
      .is('verified_at', null)

    // Store OTP in database (Firebase will send SMS, we verify against our stored OTP)
    const { error: insertError } = await supabase
      .from('phone_verifications')
      .insert({
        user_id: user.id,
        phone: cleanPhone,
        country_code: countryCode,
        otp_code: otp,
        otp_expires_at: expiresAt.toISOString(),
        attempts: 0
      })

    if (insertError) {
      console.error('Insert OTP error:', insertError)
      return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 })
    }

    // Return success - Firebase will handle actual SMS sending on the client side
    // The client will use Firebase Phone Auth, but we verify against our stored OTP
    return NextResponse.json({ 
      success: true,
      message: 'Ready to send OTP via Firebase',
      phone: cleanPhone.slice(-4).padStart(10, '*'), // Masked phone
      expiresIn: 600, // 10 minutes in seconds
      // For development without Firebase, include the OTP
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp })
    })

  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
