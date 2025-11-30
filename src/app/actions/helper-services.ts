'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth-middleware'
import { handleServerActionError } from '@/lib/errors'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { UserRole } from '@/lib/constants'
import { logger } from '@/lib/logger'

/**
 * GET HELPER SERVICES
 * Fetch all service categories and helper's selected services
 */
export async function getHelperServices() {
  try {
    const { user } = await requireAuth(UserRole.HELPER)

    const supabase = await createClient()

    // Get helper profile with onboarding data
    const { data: helperProfile, error: profileError } = await supabase
      .from('helper_profiles')
      .select('id, service_categories, skills_specialization, hourly_rate, experience_years, working_hours, service_areas, address, pincode, verification_status, is_approved')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError || !helperProfile) {
      logger.error('Failed to fetch helper profile', { error: profileError })
      return { error: 'Helper profile not found' }
    }

    // Check if helper is approved - only approved helpers can access My Services
    if (helperProfile.verification_status !== 'approved' || !helperProfile.is_approved) {
      return { error: 'Your account is pending verification. Please wait for admin approval.' }
    }

    // Get helper's services from helper_services table
    const { data: helperServices, error: servicesError } = await supabase
      .from('helper_services')
      .select('id, category_id, hourly_rate, is_available, experience_years')
      .eq('helper_id', helperProfile.id)

    if (servicesError) {
      logger.error('Failed to fetch helper services', { error: servicesError })
      return { error: 'Failed to load your services' }
    }

    return {
      data: {
        helperServices: helperServices || [],
        helperProfile: {
          service_categories: helperProfile.service_categories || [],
          skills: helperProfile.skills_specialization || [],
          hourly_rate: helperProfile.hourly_rate || 500,
          experience_years: helperProfile.experience_years || 0,
          working_hours: helperProfile.working_hours || {},
          service_areas: helperProfile.service_areas || [],
          address: helperProfile.address || '',
          pincode: helperProfile.pincode || '',
        },
      },
    }
  } catch (error) {
    logger.error('Get helper services error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * UPDATE HELPER SERVICES
 * Update helper's service offerings
 */
export async function updateHelperServices(
  services: Array<{
    category_id: string
    hourly_rate: number
    is_available: boolean
    experience_years: number
  }>
) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)

    // Validate input
    if (!Array.isArray(services)) {
      return { error: 'Invalid services data' }
    }

    // Validate each service
    for (const service of services) {
      if (!service.category_id) {
        return { error: 'Category ID is required for all services' }
      }
      if (service.hourly_rate < 100 || service.hourly_rate > 10000) {
        return { error: 'Hourly rate must be between ₹100 and ₹10,000' }
      }
      if (service.experience_years < 0 || service.experience_years > 50) {
        return { error: 'Experience years must be between 0 and 50' }
      }
    }

    // Rate limit updates
    await rateLimit('update-helper-services', user.id, RATE_LIMITS.API_RELAXED)

    const supabase = await createClient()

    // Get helper profile
    const { data: helperProfile } = await supabase
      .from('helper_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!helperProfile) {
      return { error: 'Helper profile not found' }
    }

    // Get existing services
    const { data: existingServices } = await supabase
      .from('helper_services')
      .select('id, category_id')
      .eq('helper_id', helperProfile.id)

    const existingCategoryIds = new Set(
      (existingServices || []).map(s => s.category_id)
    )
    const newCategoryIds = new Set(services.map(s => s.category_id))

    // Delete services that are no longer selected
    const categoriesToDelete = (existingServices || [])
      .filter(s => !newCategoryIds.has(s.category_id))
      .map(s => s.id)

    if (categoriesToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('helper_services')
        .delete()
        .in('id', categoriesToDelete)

      if (deleteError) {
        logger.error('Failed to delete services', { error: deleteError })
        return { error: 'Failed to update services' }
      }
    }

    // Upsert selected services
    for (const service of services) {
      const { error: upsertError } = await supabase
        .from('helper_services')
        .upsert(
          {
            helper_id: helperProfile.id,
            category_id: service.category_id,
            hourly_rate: service.hourly_rate,
            is_available: service.is_available,
            experience_years: service.experience_years,
          },
          {
            onConflict: 'helper_id,category_id',
          }
        )

      if (upsertError) {
        logger.error('Failed to upsert service', { error: upsertError })
        return { error: 'Failed to update services' }
      }
    }

    logger.info('Helper services updated', {
      helper_id: helperProfile.id,
      services_count: services.length,
    })

    revalidatePath('/helper/services')

    return { success: true }
  } catch (error) {
    logger.error('Update helper services error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * UPDATE HELPER PROFILE SERVICES
 * Update helper's profile data: service categories, skills, hourly rate, working hours, service areas
 */
export async function updateHelperProfileServices(data: {
  service_categories?: string[]
  skills?: string[]
  hourly_rate?: number
  experience_years?: number
  working_hours?: any
  service_areas?: string[]
}) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)

    // Rate limit updates
    await rateLimit('update-helper-profile', user.id, RATE_LIMITS.API_RELAXED)

    const supabase = await createClient()

    // Validate input
    if (data.hourly_rate !== undefined && (data.hourly_rate < 100 || data.hourly_rate > 10000)) {
      return { error: 'Hourly rate must be between ₹100 and ₹10,000' }
    }

    if (data.experience_years !== undefined && (data.experience_years < 0 || data.experience_years > 50)) {
      return { error: 'Experience years must be between 0 and 50' }
    }

    // Update helper profile
    const { error: updateError } = await supabase
      .from('helper_profiles')
      .update({
        service_categories: data.service_categories,
        skills_specialization: data.skills,
        hourly_rate: data.hourly_rate,
        experience_years: data.experience_years,
        working_hours: data.working_hours,
        service_areas: data.service_areas,
      })
      .eq('user_id', user.id)

    if (updateError) {
      logger.error('Failed to update helper profile', { error: updateError })
      return { error: 'Failed to update profile' }
    }

    logger.info('Helper profile services updated', { user_id: user.id })

    revalidatePath('/helper/services')

    return { success: true }
  } catch (error) {
    logger.error('Update helper profile services error', { error })
    return { error: 'An unexpected error occurred' }
  }
}
