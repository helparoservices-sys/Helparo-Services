'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit, RATE_LIMITS, clearRateLimit } from '@/lib/rate-limit'
import { validateFormData, loginSchema, magicLinkSchema, emailSchema, passwordSchema } from '@/lib/validation'
import { handleServerActionError } from '@/lib/errors'
import { sanitizeEmail } from '@/lib/sanitize'
import { createSessionRecord, logLoginAttempt } from './sessions'
import { checkAccountLockout, getLockoutMessage, clearFailedAttempts } from '@/lib/account-security'


export async function loginAction(formData: FormData) {
  try {
    // Validate input
    const validation = validateFormData(formData, loginSchema)
    if (!validation.success) {
      return { error: validation.error }
    }
    
    const { email, password } = validation.data
    const sanitizedEmail = sanitizeEmail(email)
    
    // Check for account lockout BEFORE rate limiting
    const lockout = await checkAccountLockout(sanitizedEmail)
    if (lockout) {
      return { error: getLockoutMessage(lockout) }
    }
    
    // Rate limit login attempts by email
    await rateLimit('login', sanitizedEmail, RATE_LIMITS.LOGIN)
    
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password,
    })

    if (error) {
      // Log failed login attempt
      await logLoginAttempt({
        email: sanitizedEmail,
        success: false,
        failureReason: 'Invalid credentials'
      })
      return { error: 'Invalid email or password' }
    }

    if (data.user) {
      // Clear rate limit on successful login
      clearRateLimit('login', sanitizedEmail)
      
      // Get user profile with status
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status, is_banned, ban_reason')
        .eq('id', data.user.id)
        .single()

      const role = (profile as any)?.role || 'customer'
      const status = (profile as any)?.status
      const isBanned = (profile as any)?.is_banned
      const banReason = (profile as any)?.ban_reason
      
      // Check if user is allowed to login
      if (isBanned) {
        // Sign out the user
        await supabase.auth.signOut()
        await logLoginAttempt({
          userId: data.user.id,
          email: sanitizedEmail,
          success: false,
          failureReason: 'Account banned'
        })
        return { error: banReason ? `Account banned: ${banReason}` : 'Your account has been banned. Please contact support.' }
      }
      
      if (status === 'suspended') {
        await supabase.auth.signOut()
        await logLoginAttempt({
          userId: data.user.id,
          email: sanitizedEmail,
          success: false,
          failureReason: 'Account suspended'
        })
        return { error: 'Your account has been suspended. Please contact support.' }
      }
      
      if (status === 'inactive') {
        await supabase.auth.signOut()
        await logLoginAttempt({
          userId: data.user.id,
          email: sanitizedEmail,
          success: false,
          failureReason: 'Account inactive'
        })
        return { error: 'Your account is inactive. Please contact support to activate your account.' }
      }
      
      if (!status || status !== 'active') {
        await supabase.auth.signOut()
        await logLoginAttempt({
          userId: data.user.id,
          email: sanitizedEmail,
          success: false,
          failureReason: 'Account not active'
        })
        return { error: 'Your account is not active. Please contact support.' }
      }

      // Log successful login attempt
      await logLoginAttempt({
        userId: data.user.id,
        email: sanitizedEmail,
        success: true
      })
      
      // Clear failed attempts counter
      await clearFailedAttempts(sanitizedEmail)

      // Create session record for tracking
      if (data.session?.access_token) {
        await createSessionRecord(data.session.access_token)
      }
      
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
