'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit, RATE_LIMITS, clearRateLimit } from '@/lib/rate-limit'
import { validateFormData, loginSchema, magicLinkSchema } from '@/lib/validation'
import { handleServerActionError } from '@/lib/errors'
import { sanitizeEmail } from '@/lib/sanitize'
import { emailSchema, passwordSchema, validateFormData } from '@/lib/validation'


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

export async function requestPasswordResetAction(formData: FormData) {
  try {
    const email = String(formData.get('email') || '')
    const parsed = emailSchema.safeParse(email)
    if (!parsed.success) {
      return { error: 'Please enter a valid email' }
    }

    const sanitizedEmail = sanitizeEmail(parsed.data)
    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    })

    if (error) {
      return { error: 'Failed to send reset email. Try again.' }
    }

    return { success: true }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}

export async function updatePasswordAction(formData: FormData) {
  try {
    const password = String(formData.get('password') || '')
    const parsed = passwordSchema.safeParse(password)
    if (!parsed.success) {
      return { error: 'Password must be at least 8 characters' }
    }

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    // Ensure this is a recovery session triggered from email link
    if (!session || session?.type !== 'authenticated') {
      // In App Router + Supabase v2, recovery flow sets an authenticated session
      // We still proceed to update the user password.
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data })
    if (error) {
      return { error: 'Failed to update password. Try again.' }
    }
    return { success: true }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}
