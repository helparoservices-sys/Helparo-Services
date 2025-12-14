'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'
import { handleServerActionError } from '@/lib/errors'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { UserRole } from '@/lib/constants'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'

/**
 * Toggle helper availability status
 */
export async function toggleHelperAvailability(isAvailable: boolean, latitude?: number, longitude?: number) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    await rateLimit('toggle-availability', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()

    // Build update object
    const updateData: Record<string, any> = {
      is_available_now: isAvailable,
      is_online: isAvailable, // Also update is_online for broadcast queries
      updated_at: new Date().toISOString()
    }
    
    // If going online and location provided, update current location
    if (isAvailable && latitude && longitude) {
      updateData.current_location_lat = latitude
      updateData.current_location_lng = longitude
      updateData.location_updated_at = new Date().toISOString()
      logger.info('Helper going online with location', { userId: user.id, lat: latitude, lng: longitude })
    }

    const { error } = await supabase
      .from('helper_profiles')
      .update(updateData)
      .eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/helper/dashboard')
    revalidatePath('/customer/find-helpers')
    
    logger.info('Helper availability toggled', { userId: user.id, isAvailable })
    return { success: true, isAvailable }
  } catch (error: any) {
    logger.error('Toggle availability error', { error })
    return handleServerActionError(error)
  }
}

/**
 * Update helper's current location
 */
export async function updateHelperLocation(latitude: number, longitude: number) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)

    const supabase = await createClient()

    const { error } = await supabase
      .from('helper_profiles')
      .update({
        current_location_lat: latitude,
        current_location_lng: longitude,
        location_updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (error) throw error

    logger.info('Helper location updated', { userId: user.id, lat: latitude, lng: longitude })
    return { success: true }
  } catch (error: any) {
    logger.error('Update location error', { error })
    return handleServerActionError(error)
  }
}

/**
 * Toggle helper emergency availability
 */
export async function toggleEmergencyAvailability(isAvailable: boolean) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    await rateLimit('toggle-emergency', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()

    const { error } = await supabase
      .from('helper_profiles')
      .update({
        emergency_availability: isAvailable,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/helper/dashboard')
    revalidatePath('/customer/find-helpers')
    
    logger.info('Helper emergency availability toggled', { userId: user.id, isAvailable })
    return { success: true, isAvailable }
  } catch (error: any) {
    logger.error('Toggle emergency availability error', { error })
    return handleServerActionError(error)
  }
}

/**
 * Get helper availability status
 */
export async function getHelperAvailability() {
  try {
    const { user } = await requireAuth(UserRole.HELPER)

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('helper_profiles')
      .select('is_available_now, emergency_availability')
      .eq('user_id', user.id)
      .single()

    if (error) throw error

    const availabilityData = {
      success: true, 
      isAvailableNow: data?.is_available_now ?? false,
      emergencyAvailable: data?.emergency_availability ?? false
    }

    console.log('📊 Helper availability from DB:', {
      user_id: user.id,
      raw_data: data,
      returned: availabilityData
    })

    return availabilityData
  } catch (error: any) {
    logger.error('Get helper availability error', { error })
    return handleServerActionError(error)
  }
}
