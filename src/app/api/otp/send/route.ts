import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    // Firebase handles OTP sending and verification on client side
    // This API just validates the phone number
    return NextResponse.json({ 
      success: true,
      message: 'Phone validated. Ready for Firebase OTP.',
      phone: cleanPhone.slice(-4).padStart(10, '*'), // Masked phone
      expiresIn: 600
    })

  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
