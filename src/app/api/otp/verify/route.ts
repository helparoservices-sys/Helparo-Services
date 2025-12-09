import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, otp } = body

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 })
    }

    // Clean inputs
    const cleanPhone = phone.replace(/\D/g, '')
    const cleanOtp = otp.trim()

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json({ error: 'Invalid OTP format' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check again if phone already exists for another user
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', cleanPhone)
      .neq('id', user.id)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json({ 
        error: 'This phone number is already registered with another account',
        code: 'PHONE_EXISTS'
      }, { status: 409 })
    }

    // Get the verification record
    const { data: verification, error: verifyError } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('phone', cleanPhone)
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (verifyError || !verification) {
      return NextResponse.json({ 
        error: 'No pending verification found. Please request a new OTP.',
        code: 'NO_PENDING_OTP'
      }, { status: 400 })
    }

    // Check if OTP expired
    if (new Date(verification.otp_expires_at) < new Date()) {
      // Delete expired OTP
      await supabase
        .from('phone_verifications')
        .delete()
        .eq('id', verification.id)

      return NextResponse.json({ 
        error: 'OTP has expired. Please request a new one.',
        code: 'OTP_EXPIRED'
      }, { status: 400 })
    }

    // Check max attempts
    if (verification.attempts >= verification.max_attempts) {
      // Delete the verification after max attempts
      await supabase
        .from('phone_verifications')
        .delete()
        .eq('id', verification.id)

      return NextResponse.json({ 
        error: 'Maximum attempts exceeded. Please request a new OTP.',
        code: 'MAX_ATTEMPTS'
      }, { status: 400 })
    }

    // Increment attempt count
    await supabase
      .from('phone_verifications')
      .update({ attempts: verification.attempts + 1 })
      .eq('id', verification.id)

    // Verify OTP
    if (verification.otp_code !== cleanOtp) {
      const remainingAttempts = verification.max_attempts - verification.attempts - 1
      return NextResponse.json({ 
        error: `Invalid OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
        code: 'INVALID_OTP',
        remainingAttempts
      }, { status: 400 })
    }

    // OTP is correct! Mark as verified
    await supabase
      .from('phone_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verification.id)

    // Update user profile with verified phone
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        phone: cleanPhone,
        country_code: verification.country_code,
        phone_verified: true,
        phone_verified_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // Get updated profile for redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    return NextResponse.json({ 
      success: true,
      message: 'Phone number verified successfully!',
      role: profile?.role || 'customer'
    })

  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
