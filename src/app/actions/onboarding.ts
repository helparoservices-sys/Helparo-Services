'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'
import { UserRole } from '@/lib/constants'
import { handleServerActionError } from '@/lib/errors'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'

/**
 * Complete helper onboarding - save profile and notify admin
 */
export async function completeHelperOnboarding(data: {
  service_categories: string[]
  skills: string[]
  skills_specialization?: string
  experience_years: number
  hourly_rate: number
  address: string
  pincode: string
  service_radius_km?: number
  service_areas?: string[]
  service_area_ids: string[]
  latitude?: number
  longitude?: number
  working_hours?: any
  is_available_now?: boolean
  emergency_availability?: boolean
  bank_account?: {
    account_holder_name?: string
    account_number?: string
    ifsc_code?: string
    bank_name?: string
    branch_name?: string
    upi_id?: string
  }
}) {
  try {
    const { user, profile } = await requireAuth(UserRole.HELPER)
    await rateLimit('complete-onboarding', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()

    // 1. Save helper profile
    // Convert skills_specialization string to array if needed
    let skillsSpecArray: string[] = []
    if (data.skills_specialization) {
      if (typeof data.skills_specialization === 'string') {
        // Split by comma and clean up
        skillsSpecArray = data.skills_specialization
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      } else if (Array.isArray(data.skills_specialization)) {
        skillsSpecArray = data.skills_specialization
      }
    }

    const { error: profileError } = await supabase
      .from('helper_profiles')
      .upsert({
        user_id: user.id,
        service_categories: data.service_categories,
        skills: data.skills,
        skills_specialization: skillsSpecArray,
        experience_years: data.experience_years,
        years_of_experience: data.experience_years, // Sync duplicate field
        hourly_rate: data.hourly_rate,
        address: data.address,
        pincode: data.pincode,
        service_radius_km: data.service_radius_km || 10,
        service_radius: data.service_radius_km || 10, // Sync duplicate field
        service_areas: data.service_areas || [],
        service_area_ids: data.service_area_ids,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        working_hours: data.working_hours || {
          monday: { available: true, start: '09:00', end: '18:00' },
          tuesday: { available: true, start: '09:00', end: '18:00' },
          wednesday: { available: true, start: '09:00', end: '18:00' },
          thursday: { available: true, start: '09:00', end: '18:00' },
          friday: { available: true, start: '09:00', end: '18:00' },
          saturday: { available: true, start: '09:00', end: '18:00' },
          sunday: { available: false, start: '09:00', end: '18:00' }
        },
        is_available_now: data.is_available_now ?? true,
        emergency_availability: data.emergency_availability ?? false,
        verification_status: 'pending',
        is_approved: false,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (profileError) throw profileError

    // 2. Save bank account if provided
    logger.info('Bank account data received', { 
      hasBankAccount: !!data.bank_account,
      hasAccountNumber: !!data.bank_account?.account_number,
      hasUpiId: !!data.bank_account?.upi_id,
      bankAccountData: data.bank_account ? {
        account_holder_name: data.bank_account.account_holder_name,
        has_account_number: !!data.bank_account.account_number,
        has_ifsc: !!data.bank_account.ifsc_code,
        has_bank_name: !!data.bank_account.bank_name,
        has_upi: !!data.bank_account.upi_id
      } : null
    })

    if (data.bank_account?.account_number || data.bank_account?.upi_id) {
      const bankData = {
        helper_id: user.id,
        account_holder_name: data.bank_account.account_holder_name || profile.full_name || '',
        account_number: data.bank_account.account_number || null,
        ifsc_code: data.bank_account.ifsc_code || null,
        bank_name: data.bank_account.bank_name || null,
        branch_name: data.bank_account.branch_name || null,
        upi_id: data.bank_account.upi_id || null,
        is_primary: true,
        status: 'pending_verification'
      }

      logger.info('Attempting to save bank account', { bankData })

      // Check if bank account already exists for this helper
      const { data: existingBank } = await supabase
        .from('helper_bank_accounts')
        .select('id')
        .eq('helper_id', user.id)
        .eq('is_primary', true)
        .single()

      let bankError, bankResult

      if (existingBank) {
        // Update existing bank account
        const result = await supabase
          .from('helper_bank_accounts')
          .update(bankData)
          .eq('id', existingBank.id)
          .select()
        bankError = result.error
        bankResult = result.data
        logger.info('Updating existing bank account', { existingBankId: existingBank.id })
      } else {
        // Insert new bank account
        const result = await supabase
          .from('helper_bank_accounts')
          .insert(bankData)
          .select()
        bankError = result.error
        bankResult = result.data
        logger.info('Inserting new bank account')
      }

      if (bankError) {
        logger.error('Bank account save failed', { error: bankError, userId: user.id })
      } else {
        logger.info('Bank account saved successfully', { bankResult, userId: user.id })
      }
    } else {
      logger.warn('Bank account not saved - no account number or UPI ID provided', { 
        userId: user.id,
        bankAccount: data.bank_account 
      })
    }

    // 3. Create notification for admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        title: 'New Helper Onboarding Complete',
        message: `${profile.full_name || 'A helper'} has completed onboarding and is ready for verification.`,
        type: 'verification_pending',
        action_url: `/admin/helpers/${user.id}`,
        related_user_id: user.id,
        priority: 'high'
      }))

      await supabase.from('notifications').insert(notifications)
    }

    logger.info('Helper onboarding completed', { userId: user.id })
    revalidatePath('/helper/dashboard')
    revalidatePath('/admin/helpers')
    
    return { 
      success: true, 
      message: 'Onboarding complete! Our team will verify your details. This may take 24-48 hours.' 
    }
  } catch (error) {
    logger.error('Complete helper onboarding error', { error })
    return handleServerActionError(error)
  }
}

/**
 * Approve or reject helper verification
 */
export async function verifyHelper(input: {
  helperId: string
  action: 'approve' | 'reject'
  rejectionReason?: string
}) {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)
    await rateLimit('verify-helper', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()

    const isApproved = input.action === 'approve'
    const status = isApproved ? 'approved' : 'rejected'

    // 1. Update helper profile
    const { error: profileError } = await supabase
      .from('helper_profiles')
      .update({
        verification_status: status,
        is_approved: isApproved,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        rejection_reason: input.rejectionReason || null
      })
      .eq('user_id', input.helperId)

    if (profileError) throw profileError

    // 2. Update verification documents status
    await supabase
      .from('verification_documents')
      .update({
        status: isApproved ? 'approved' : 'rejected',
        rejection_reason: input.rejectionReason || null,
        verified_by: user.id,
        verified_at: new Date().toISOString()
      })
      .eq('helper_id', input.helperId)

    // 3. Update profile verification status
    await supabase
      .from('profiles')
      .update({ is_verified: isApproved })
      .eq('id', input.helperId)

    // 4. Get helper details for notification
    const { data: helperProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', input.helperId)
      .single()

    // 5. Create notification for helper
    const notificationTitle = isApproved 
      ? '🎉 Verification Approved!' 
      : '❌ Verification Rejected'
    
    const notificationMessage = isApproved
      ? 'Congratulations! Your helper profile has been approved. You can now start accepting service requests.'
      : `Your verification was rejected. Reason: ${input.rejectionReason || 'Please contact support for details.'}`

    await supabase.from('notifications').insert({
      user_id: input.helperId,
      title: notificationTitle,
      message: notificationMessage,
      type: isApproved ? 'verification_approved' : 'verification_rejected',
      action_url: '/helper/verification',
      priority: 'high'
    })

    // 6. Send email notification
    if (helperProfile?.email) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: helperProfile.email,
            subject: notificationTitle,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: ${isApproved ? '#10b981' : '#ef4444'};">${notificationTitle}</h2>
                <p>Hi ${helperProfile.full_name || 'Helper'},</p>
                <p>${notificationMessage}</p>
                ${isApproved ? `
                  <p>You can now:</p>
                  <ul>
                    <li>View service requests in your area</li>
                    <li>Submit bids and get hired</li>
                    <li>Earn money by providing services</li>
                  </ul>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/helper/dashboard" 
                     style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                    Go to Dashboard
                  </a>
                ` : `
                  <p>Please update your documents and resubmit for verification.</p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/helper/verification" 
                     style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                    Update Documents
                  </a>
                `}
                <p>Best regards,<br>Helparo Team</p>
              </div>
            `
          })
        })
      } catch (emailError) {
        logger.warn('Failed to send verification email', { error: emailError })
      }
    }

    logger.info('Helper verification updated', { 
      helperId: input.helperId, 
      action: input.action, 
      adminId: user.id 
    })
    
    revalidatePath('/admin/helpers')
    revalidatePath(`/admin/helpers/${input.helperId}`)
    
    return { 
      success: true, 
      message: `Helper ${isApproved ? 'approved' : 'rejected'} successfully. Email notification sent.` 
    }
  } catch (error) {
    logger.error('Verify helper error', { error })
    return handleServerActionError(error)
  }
}

/**
 * Get helper onboarding status
 */
export async function getHelperOnboardingStatus() {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    const supabase = await createClient()

    const { data: helperProfile } = await supabase
      .from('helper_profiles')
      .select('*, profiles!inner(full_name, email, is_verified)')
      .eq('user_id', user.id)
      .single()

    const { data: documents } = await supabase
      .from('verification_documents')
      .select('*')
      .eq('helper_id', user.id)

    const { data: bankAccount } = await supabase
      .from('helper_bank_accounts')
      .select('*')
      .eq('helper_id', user.id)
      .eq('is_primary', true)
      .single()

    return {
      data: {
        profile: helperProfile,
        documents: documents || [],
        bankAccount
      }
    }
  } catch (error) {
    logger.error('Get helper onboarding status error', { error })
    return handleServerActionError(error)
  }
}
