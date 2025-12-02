'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth-middleware'
import { handleServerActionError } from '@/lib/errors'
import { sanitizeText } from '@/lib/sanitize'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { UserRole } from '@/lib/constants'
import { logger } from '@/lib/logger'

/**
 * Server Actions for Smart Matching (Migration 021)
 * Tables: helper_statistics, helper_specializations
 */

// ============================================
// HELPER STATISTICS
// ============================================

export async function updateHelperStatistics(helperId: string) {
  try {
    // Internal function - typically called by system
    const supabase = await createClient()

    // Get completed jobs count
    const { count: completedJobs } = await supabase
      .from('service_requests')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_helper_id', helperId)
      .eq('status', 'completed')

    // Get average response time (in minutes)
    const { data: applications } = await supabase
      .from('request_applications')
      .select('created_at, service_request:service_requests!inner(created_at)')
      .eq('helper_id', helperId)
      .eq('status', 'accepted')
      .limit(100)

    let avgResponseTime = 0
    if (applications && applications.length > 0) {
      const responseTimes = applications.map((app: any) => {
        const requestTime = new Date(app.service_request.created_at).getTime()
        const applyTime = new Date(app.created_at).getTime()
        return (applyTime - requestTime) / (1000 * 60) // minutes
      })
      avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    }

    // Get completion rate
    const { count: totalAssigned } = await supabase
      .from('service_requests')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_helper_id', helperId)
      .in('status', ['completed', 'cancelled'])

    const completionRate = totalAssigned ? (completedJobs || 0) / totalAssigned * 100 : 0

    // Get acceptance rate
    const { count: totalApplications } = await supabase
      .from('request_applications')
      .select('*', { count: 'exact', head: true })
      .eq('helper_id', helperId)

    const { count: acceptedApplications } = await supabase
      .from('request_applications')
      .select('*', { count: 'exact', head: true })
      .eq('helper_id', helperId)
      .eq('status', 'accepted')

    const acceptanceRate = totalApplications ? (acceptedApplications || 0) / totalApplications * 100 : 0

    // Get average rating
    const { data: ratingSummary } = await supabase
      .from('helper_rating_summary')
      .select('average_rating, total_reviews')
      .eq('helper_id', helperId)
      .maybeSingle()

    // Get last active timestamp
    const { data: lastActivity } = await supabase
      .from('request_applications')
      .select('created_at')
      .eq('helper_id', helperId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Calculate quality score (0-100)
    const qualityScore = (
      (ratingSummary?.average_rating || 0) * 20 + // 0-100 from 0-5 rating
      completionRate * 0.3 + // 0-30 from completion rate
      Math.min(acceptanceRate * 0.2, 20) // 0-20 from acceptance rate
    ) / 1.5 // normalize to 0-100

    // Upsert statistics
    const { error } = await supabase
      .from('helper_statistics')
      .upsert({
        helper_id: helperId,
        total_jobs_completed: completedJobs || 0,
        average_response_time: Math.round(avgResponseTime),
        completion_rate: Math.round(completionRate * 100) / 100,
        acceptance_rate: Math.round(acceptanceRate * 100) / 100,
        average_rating: ratingSummary?.average_rating || 0,
        total_reviews: ratingSummary?.total_reviews || 0,
        quality_score: Math.round(qualityScore * 100) / 100,
        last_active: lastActivity?.created_at || new Date().toISOString()
      }, {
        onConflict: 'helper_id'
      })

    if (error) throw error

    revalidatePath(`/helper/${helperId}`)
    logger.info('Helper statistics updated', { helperId })
    return { success: true }
  } catch (error: any) {
    logger.error('Update helper statistics error', { error })
    return handleServerActionError(error)
  }
}

export async function getHelperStatistics(helperId: string) {
  const supabase = await createClient()

  try {
    await rateLimit('get-helper-statistics', helperId, RATE_LIMITS.API_MODERATE)

    const { data, error } = await supabase
      .from('helper_statistics')
      .select('*')
      .eq('helper_id', helperId)
      .maybeSingle()

    if (error) throw error

    return { success: true, statistics: data }
  } catch (error: any) {
    logger.error('Get helper statistics error', { error })
    return handleServerActionError(error)
  }
}

// ============================================
// HELPER SPECIALIZATIONS
// ============================================

export async function addHelperSpecialization(formData: FormData) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)
    await rateLimit('add-specialization', user.id, RATE_LIMITS.API_MODERATE)

    const categoryId = sanitizeText(formData.get('category_id') as string)
    const yearsOfExperience = parseInt(formData.get('years_of_experience') as string)
    const certifications = sanitizeText(formData.get('certifications') as string)

    if (!categoryId || isNaN(yearsOfExperience)) {
      return { error: 'Invalid input data' }
    }

    const supabase = await createClient()

    // Check if specialization already exists
    const { data: existing } = await supabase
      .from('helper_specializations')
      .select('id')
      .eq('helper_id', user.id)
      .eq('category_id', categoryId)
      .maybeSingle()

    if (existing) {
      return { error: 'Specialization already exists' }
    }

    const { data, error } = await supabase
      .from('helper_specializations')
      .insert({
        helper_id: user.id,
        category_id: categoryId,
        years_of_experience: yearsOfExperience,
        certifications: certifications ? certifications.split(',').map(c => c.trim()) : []
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/helper/services')
    logger.info('Helper specialization added', { userId: user.id, categoryId })
    return { success: true, specialization: data }
  } catch (error: any) {
    logger.error('Add helper specialization error', { error })
    return handleServerActionError(error)
  }
}

export async function updateHelperSpecialization(formData: FormData) {
  try {
    const { user } = await requireAuth()
    await rateLimit('update-specialization', user.id, RATE_LIMITS.API_MODERATE)

    const specializationId = sanitizeText(formData.get('specialization_id') as string)
    const yearsOfExperience = parseInt(formData.get('years_of_experience') as string)
    const certifications = sanitizeText(formData.get('certifications') as string)
    const isVerified = formData.get('is_verified') === 'true'

    if (!specializationId || isNaN(yearsOfExperience)) {
      return { error: 'Invalid input data' }
    }

    const supabase = await createClient()

    // Verify ownership or admin
    const { data: specialization } = await supabase
      .from('helper_specializations')
      .select('helper_id')
      .eq('id', specializationId)
      .single()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (specialization?.helper_id !== user.id && profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    const updateData: any = {
      years_of_experience: yearsOfExperience,
      certifications: certifications ? certifications.split(',').map(c => c.trim()) : []
    }

    // Only admin can verify
    if (profile?.role === 'admin' && isVerified !== undefined) {
      updateData.is_verified = isVerified
      if (isVerified) {
        updateData.verified_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('helper_specializations')
      .update(updateData)
      .eq('id', specializationId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/helper/services')
    revalidatePath('/admin/verification')
    logger.info('Helper specialization updated', { userId: user.id, specializationId })
    return { success: true, specialization: data }
  } catch (error: any) {
    logger.error('Update helper specialization error', { error })
    return handleServerActionError(error)
  }
}

export async function getHelperSpecializations(helperId: string) {
  const supabase = await createClient()

  try {
    await rateLimit('get-helper-specializations', helperId, RATE_LIMITS.API_MODERATE)

    const { data, error } = await supabase
      .from('helper_specializations')
      .select(`
        *,
        category:service_categories(
          id,
          name,
          icon
        )
      `)
      .eq('helper_id', helperId)
      .order('years_of_experience', { ascending: false })

    if (error) throw error

    return { success: true, specializations: data }
  } catch (error: any) {
    logger.error('Get helper specializations error', { error })
    return handleServerActionError(error)
  }
}

export async function deleteHelperSpecialization(specializationId: string) {
  try {
    const { user } = await requireAuth()
    await rateLimit('delete-specialization', user.id, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()

    // Verify ownership
    const { data: specialization } = await supabase
      .from('helper_specializations')
      .select('helper_id')
      .eq('id', specializationId)
      .single()

    if (specialization?.helper_id !== user.id) {
      return { error: 'Unauthorized' }
    }

    const { error } = await supabase
      .from('helper_specializations')
      .delete()
      .eq('id', specializationId)

    if (error) throw error

    revalidatePath('/helper/services')
    logger.info('Helper specialization deleted', { userId: user.id, specializationId })
    return { success: true }
  } catch (error: any) {
    logger.error('Delete helper specialization error', { error })
    return handleServerActionError(error)
  }
}

// ============================================
// SMART MATCHING ALGORITHM
// ============================================

export async function findBestMatchingHelpers(serviceRequestId: string, limit = 10) {
  try {
    // Public/internal function - rate limit by request ID
    await rateLimit('find-matching-helpers', serviceRequestId, RATE_LIMITS.API_MODERATE)

    const supabase = await createClient()

    // Get service request details
    const { data: request } = await supabase
      .from('service_requests')
      .select('category_id, latitude, longitude, urgency_level')
      .eq('id', serviceRequestId)
      .single()

    if (!request) {
      return { error: 'Service request not found' }
    }

    // Find helpers with matching services and good statistics
    const { data: helpers, error } = await supabase
      .from('helper_services')
      .select(`
        helper_id,
        is_available,
        profiles!inner(
          id,
          full_name,
          latitude,
          longitude
        ),
        statistics:helper_statistics(
          quality_score,
          average_rating,
          completion_rate,
          average_response_time,
          last_active
        ),
        specializations:helper_specializations!inner(
          years_of_experience,
          is_verified
        )
      `)
      .eq('category_id', request.category_id)
      .eq('is_available', true)
      .eq('is_active', true)

    if (error) throw error
    if (!helpers || helpers.length === 0) {
      return { success: true, matches: [] }
    }

    // Calculate match score for each helper
    const matches = helpers.map((helper: any) => {
      const stats = helper.statistics?.[0] || {}
      const specialization = helper.specializations?.[0] || {}
      const profile = helper.profiles
      
      // Distance score (closer is better)
      const distance = calculateDistance(
        request.latitude,
        request.longitude,
        profile.latitude,
        profile.longitude
      )
      const distanceScore = Math.max(0, 100 - distance) // 100 points for 0km, 0 points for 100km+

      // Quality score from statistics
      const qualityScore = stats?.quality_score || 0

      // Experience score
      const experienceScore = Math.min((specialization?.years_of_experience || 0) * 10, 50)

      // Verification bonus
      const verificationBonus = specialization?.is_verified ? 20 : 0

      // Activity score (recently active is better)
      const lastActive = stats?.last_active ? new Date(stats.last_active) : new Date(0)
      const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
      const activityScore = Math.max(0, 30 - daysSinceActive)

      // Calculate total match score
      const matchScore = 
        distanceScore * 0.3 +
        qualityScore * 0.3 +
        experienceScore * 0.2 +
        activityScore * 0.1 +
        verificationBonus * 0.1

      return {
        helper_id: helper.helper_id,
        helper_name: profile.full_name,
        match_score: Math.round(matchScore * 100) / 100,
        distance: Math.round(distance * 10) / 10,
        quality_score: stats?.quality_score || 0,
        average_rating: stats?.average_rating || 0,
        completion_rate: stats?.completion_rate || 0,
        years_of_experience: specialization?.years_of_experience || 0,
        is_verified: specialization?.is_verified || false
      }
    })

    // Sort by match score and return top matches
    matches.sort((a, b) => b.match_score - a.match_score)
    
    logger.info('Matching helpers found', { serviceRequestId, matchCount: matches.length })
    return { success: true, matches: matches.slice(0, limit) }
  } catch (error: any) {
    logger.error('Find best matching helpers error', { error })
    return handleServerActionError(error)
  }
}

/**
 * Search helpers directly by filters (WITHOUT needing a service request)
 * For "Find Helpers" page
 */
export async function searchHelpersByFilters(filters: {
  serviceCategory: string
  customerLat?: number
  customerLng?: number
  maxDistance?: number
  minRating?: number
  limit?: number
}) {
  try {
    const supabase = await createClient()
    
    const { serviceCategory, customerLat, customerLng, maxDistance = 50, minRating = 0, limit = 20 } = filters

    console.log('🔍 searchHelpersByFilters called with:', {
      serviceCategory,
      customerLat,
      customerLng,
      maxDistance,
      minRating,
      limit
    })

    // Build query to find helpers with matching service
    let query = supabase
      .from('helper_profiles')
      .select(`
        id,
        user_id,
        service_categories,
        skills,
        years_of_experience,
        hourly_rate,
        latitude,
        longitude,
        address,
        service_radius_km,
        service_areas,
        is_available_now,
        emergency_availability,
        total_jobs_completed,
        response_rate_percent,
        completion_rate_percent,
        profiles!inner (
          id,
          full_name,
          email,
          phone,
          avatar_url
        )
      `)
      .eq('is_approved', true)
      .eq('is_available_now', true)
      .contains('service_categories', [serviceCategory])

    const { data: helpers, error } = await query

    console.log('📊 Database query result:', {
      helpersCount: helpers?.length || 0,
      error: error?.message,
      firstHelper: helpers?.[0] ? 'Found helpers' : 'No helpers'
    })

    if (error) throw error
    if (!helpers || helpers.length === 0) {
      return { success: true, helpers: [] }
    }

    // Calculate match scores and filter by distance
    const matchedHelpers = helpers
      .map((helper: any) => {
        let matchScore = 0
        let distance = 0

        // 1. Service category match (base score)
        matchScore += 30

        // 2. Distance scoring (if customer location provided)
        if (customerLat && customerLng && helper.latitude && helper.longitude) {
          distance = calculateDistance(customerLat, customerLng, helper.latitude, helper.longitude)
          
          if (distance <= 5) matchScore += 25
          else if (distance <= 10) matchScore += 15
          else if (distance <= 20) matchScore += 8
          else if (distance <= maxDistance) matchScore += 3
          else return null // Too far, exclude
        }

        // 3. Experience bonus
        if (helper.years_of_experience >= 10) matchScore += 15
        else if (helper.years_of_experience >= 5) matchScore += 10
        else if (helper.years_of_experience >= 2) matchScore += 5

        // 4. Rating bonus (calculate from completion rate as proxy)
        const estimatedRating = (helper.completion_rate_percent || 0) / 20 // 0-100 -> 0-5
        if (estimatedRating < minRating) return null // Filter out low ratings
        
        if (estimatedRating >= 4.5) matchScore += 15
        else if (estimatedRating >= 4.0) matchScore += 10
        else if (estimatedRating >= 3.5) matchScore += 5

        // 5. Availability bonus
        if (helper.is_available_now) matchScore += 10
        if (helper.emergency_availability) matchScore += 5

        // 6. Jobs completed bonus
        if (helper.total_jobs_completed >= 50) matchScore += 10
        else if (helper.total_jobs_completed >= 20) matchScore += 5
        else if (helper.total_jobs_completed >= 5) matchScore += 2

        return {
          helper_id: helper.id, // Use helper profile ID, not user_id
          match_score: Math.min(matchScore, 100),
          helper: {
            id: helper.id, // Use helper profile ID, not user_id
            full_name: helper.profiles.full_name,
            email: helper.profiles.email,
            phone: helper.profiles.phone,
            avatar_url: helper.profiles.avatar_url,
            hourly_rate: helper.hourly_rate,
            years_of_experience: helper.years_of_experience,
            skills: helper.skills,
            address: helper.address,
            service_areas: helper.service_areas,
            total_bookings: helper.total_jobs_completed,
            rating: estimatedRating,
            response_rate: helper.response_rate_percent,
            completion_rate: helper.completion_rate_percent,
          },
          matching_factors: {
            specialization_match: true,
            location_proximity: distance,
            availability_match: helper.is_available_now,
            rating_bonus: estimatedRating >= 4.0 ? 10 : 0,
            experience_bonus: helper.years_of_experience >= 5 ? 10 : 0,
            emergency_available: helper.emergency_availability,
          }
        }
      })
      .filter(Boolean) // Remove nulls (filtered out helpers)
      .sort((a: any, b: any) => b.match_score - a.match_score)
      .slice(0, limit)

    logger.info('Helpers search completed', { category: serviceCategory, found: matchedHelpers.length })
    return { success: true, helpers: matchedHelpers }
  } catch (error: any) {
    logger.error('Search helpers error', { error })
    return handleServerActionError(error)
  }
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
