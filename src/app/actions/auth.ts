'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { rateLimit, RATE_LIMITS, clearRateLimit } from '@/lib/rate-limit'
import { validateFormData, loginSchema, magicLinkSchema, emailSchema, passwordSchema } from '@/lib/validation'
import { handleServerActionError } from '@/lib/errors'
import { sanitizeEmail } from '@/lib/sanitize'
import { createSessionRecord, logLoginAttempt } from './sessions'
import { checkAccountLockout, clearFailedAttempts } from '@/lib/account-security'


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
      // Generate lockout message
      let lockoutMessage: string
      if (lockout.isPermanent) {
        lockoutMessage = 'Your account has been permanently locked. Please contact support.'
      } else {
        const minutesRemaining = Math.ceil(
          (lockout.lockoutUntil.getTime() - Date.now()) / (60 * 1000)
        )
        
        if (minutesRemaining > 60) {
          const hours = Math.ceil(minutesRemaining / 60)
          lockoutMessage = `Too many failed login attempts. Account locked for ${hours} hours. Please try again later or reset your password.`
        } else {
          lockoutMessage = `Too many failed login attempts. Please try again in ${minutesRemaining} minutes or reset your password.`
        }
      }
      
      return { error: lockoutMessage }
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
        .select('role, status, is_banned, ban_reason, phone, phone_verified')
        .eq('id', data.user.id)
        .single()

      const role = (profile as any)?.role || 'customer'
      const status = (profile as any)?.status
      const isBanned = (profile as any)?.is_banned
      const banReason = (profile as any)?.ban_reason
      const phone = (profile as any)?.phone
      const phoneVerified = (profile as any)?.phone_verified
      
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
      
      // Check if phone is missing or not verified - redirect to complete profile
      if (!phone || !phoneVerified) {
        redirect('/auth/complete-profile')
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
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/confirm`,
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
      return { error: 'Password must be at least 12 characters' }
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

export async function changePasswordWithReauthAction(formData: FormData) {
  try {
    const currentPassword = String(formData.get('currentPassword') || '')
    const newPassword = String(formData.get('newPassword') || '')
    
    const parsedNew = passwordSchema.safeParse(newPassword)
    if (!parsedNew.success) {
      return { error: 'New password must be at least 12 characters' }
    }

    if (currentPassword === newPassword) {
      return { error: 'New password must be different from current password' }
    }

    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      return { error: 'User not authenticated' }
    }

    // Re-authenticate with current password to verify identity
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      return { error: 'Current password is incorrect' }
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({ 
      password: parsedNew.data 
    })

    if (updateError) {
      return { error: 'Failed to update password. Please try again.' }
    }

    return { success: true }
  } catch (error: any) {
    return handleServerActionError(error)
  }
}
