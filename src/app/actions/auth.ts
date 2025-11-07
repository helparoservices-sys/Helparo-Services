'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit, RATE_LIMITS, clearRateLimit } from '@/lib/rate-limit'
import { validateFormData, loginSchema, magicLinkSchema } from '@/lib/validation'
import { handleServerActionError } from '@/lib/errors'
import { sanitizeEmail } from '@/lib/sanitize'
import { UserRole } from '@/lib/constants'

export async function loginAction(formData: FormData) {
  try {
    // Validate input
    const validation = validateFormData(formData, loginSchema)
    if (!validation.success) {
      return { error: validation.error }
    }
    
    const { email, password } = validation.data
    const sanitizedEmail = sanitizeEmail(email)
    
    // Rate limit login attempts by email
    await rateLimit('login', sanitizedEmail, RATE_LIMITS.LOGIN)
    
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password,
    })

    if (error) {
      return { error: 'Invalid email or password' }
    }

    if (data.user) {
      // Clear rate limit on successful login
      clearRateLimit('login', sanitizedEmail)
      
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const role = (profile as any)?.role || 'customer'
      
      // Server-side redirect
      redirect(`/${role}/dashboard`)
    }

    return { error: 'Login failed' }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

export async function sendMagicLinkAction(formData: FormData) {
  try {
    // Validate input
    const validation = validateFormData(formData, magicLinkSchema)
    if (!validation.success) {
      return { error: validation.error }
    }
    
    const { email } = validation.data
    const sanitizedEmail = sanitizeEmail(email)
    
    // Rate limit magic link requests
    await rateLimit('magic-link', sanitizedEmail, RATE_LIMITS.MAGIC_LINK)
    
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signInWithOtp({
      email: sanitizedEmail,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (error) {
      return { error: 'Failed to send magic link. Please try again.' }
    }

    return { success: true }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}
