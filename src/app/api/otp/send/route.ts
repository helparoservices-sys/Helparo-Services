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

    // Check rate limit
    const { data: rateLimit, error: rateLimitError } = await supabase
      .rpc('check_otp_rate_limit', {
        p_identifier: cleanPhone,
        p_identifier_type: 'phone',
        p_max_requests: 5,
        p_window_minutes: 15,
        p_block_minutes: 60
      })

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError)
      // Continue anyway if rate limit check fails
    } else if (rateLimit && rateLimit.length > 0) {
      const limit = rateLimit[0]
      if (limit.status === 'blocked') {
        const blockedUntil = new Date(limit.blocked_until)
        const minutesLeft = Math.ceil((blockedUntil.getTime() - Date.now()) / 60000)
        return NextResponse.json({ 
          error: `Too many attempts. Please try again in ${minutesLeft} minutes.`,
          code: 'BLOCKED',
          blockedUntil: limit.blocked_until
        }, { status: 429 })
      }
      if (limit.status === 'rate_limited') {
        return NextResponse.json({ 
          error: 'Too many OTP requests. Please wait before trying again.',
          code: 'RATE_LIMITED',
          resetAt: limit.reset_at
        }, { status: 429 })
      }
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete any existing unverified OTP for this user
    await supabase
      .from('phone_verifications')
      .delete()
      .eq('user_id', user.id)
      .is('verified_at', null)

    // Store OTP in database
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

    // Send OTP via Twilio directly
    const fullPhone = `${countryCode}${cleanPhone}`
    
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error('Twilio credentials not configured')
      // In development, log the OTP for testing
      console.log(`[DEV] OTP for ${fullPhone}: ${otp}`)
      return NextResponse.json({ 
        success: true,
        message: 'OTP sent successfully',
        phone: cleanPhone.slice(-4).padStart(10, '*'),
        expiresIn: 600,
        // Remove in production - this is for testing without Twilio
        ...(process.env.NODE_ENV === 'development' && { devOtp: otp })
      })
    }

    // Send SMS via Twilio API
    try {
      const twilioResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: fullPhone,
            From: twilioPhoneNumber,
            Body: `Your Helparo verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`,
          }),
        }
      )

      const twilioResult = await twilioResponse.json()

      if (!twilioResponse.ok) {
        console.error('Twilio error:', twilioResult)
        return NextResponse.json({ 
          error: 'Failed to send OTP. Please try again.',
          code: 'SMS_FAILED'
        }, { status: 500 })
      }

      console.log('SMS sent successfully:', twilioResult.sid)
    } catch (twilioError) {
      console.error('Twilio request error:', twilioError)
      return NextResponse.json({ 
        error: 'Failed to send OTP. Please try again.',
        code: 'SMS_FAILED'
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'OTP sent successfully',
      phone: cleanPhone.slice(-4).padStart(10, '*'), // Masked phone
      expiresIn: 600 // 10 minutes in seconds
    })

  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
