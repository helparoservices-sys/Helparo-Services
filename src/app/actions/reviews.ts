'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth-middleware'
import { validateFormData, createReviewSchema, addReviewPhotosSchema } from '@/lib/validation'
import { handleServerActionError } from '@/lib/errors'
import { sanitizeHTML, sanitizeText } from '@/lib/sanitize'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { UserRole } from '@/lib/constants'
import { logger } from '@/lib/logger'

/**
 * Server Actions for Reviews & Ratings (Migration 020)
 * Tables: reviews, review_photos, helper_rating_summary
 */

// ============================================
// REVIEWS
// ============================================

export async function createReview(formData: FormData) {
  try {
    const { user } = await requireAuth()

    // Validate input
    const validation = validateFormData(formData, createReviewSchema)
    if (!validation.success) {
      return { error: validation.error }
    }

    const {
      service_request_id,
      helper_id,
      rating,
      comment,
      punctuality,
      quality,
      communication,
      professionalism
    } = validation.data

    // Sanitize comment (XSS protection)
    const sanitizedComment = sanitizeHTML(comment)

    // Rate limit reviews
    await rateLimit('create-review', user.id, RATE_LIMITS.CREATE_REVIEW)

    const supabase = await createClient()

    // Check if review already exists
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('service_request_id', service_request_id)
      .eq('customer_id', user.id)
      .maybeSingle()

    if (existing) {
      return { error: 'You have already submitted a review for this service' }
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        service_request_id,
        helper_id,
        customer_id: user.id,
        rating,
        comment: sanitizedComment,
        punctuality_rating: punctuality,
        quality_rating: quality,
        communication_rating: communication,
        professionalism_rating: professionalism
      })
      .select()
      .single()

    if (reviewError) throw reviewError

    // Update helper rating summary
    await updateHelperRatingSummary(helper_id)

    revalidatePath('/customer/requests')
    revalidatePath(`/helper/${helper_id}`)
    
    logger.info('Review created', { userId: user.id, helperId: helper_id, rating })
    return { success: true, review }
  } catch (error: any) {
    logger.error('Create review error', { error })
    return handleServerActionError(error)
  }
}

export async function addReviewPhotos(reviewId: string, photoUrls: string[]) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Verify review ownership
    const { data: review } = await supabase
      .from('reviews')
      .select('customer_id')
      .eq('id', reviewId)
      .single()

    if (review?.customer_id !== user.id) {
      return { error: 'Unauthorized' }
    }

    // Insert photos
    const photos = photoUrls.map(url => ({
      review_id: reviewId,
      photo_url: url
    }))

    const { data, error } = await supabase
      .from('review_photos')
      .insert(photos)
      .select()

    if (error) throw error

    revalidatePath('/customer/requests')
    return { success: true, photos: data }
  } catch (error: any) {
    console.error('Add review photos error:', error)
    return { error: error.message }
  }
}

export async function getHelperReviews(helperId: string, limit = 10, offset = 0) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        customer:profiles!reviews_customer_id_fkey(
          full_name,
          avatar_url
        ),
        photos:review_photos(
          id,
          photo_url
        )
      `)
      .eq('helper_id', helperId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return { success: true, reviews: data }
  } catch (error: any) {
    console.error('Get helper reviews error:', error)
    return { error: error.message }
  }
}

export async function updateHelperRatingSummary(helperId: string) {
  const supabase = await createClient()

  try {
    // Calculate aggregated ratings
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating, punctuality_rating, quality_rating, communication_rating, professionalism_rating')
      .eq('helper_id', helperId)
      .eq('is_visible', true)

    if (!reviews || reviews.length === 0) return { success: true }

    const totalReviews = reviews.length
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    const avgPunctuality = reviews.reduce((sum, r) => sum + (r.punctuality_rating || 0), 0) / totalReviews
    const avgQuality = reviews.reduce((sum, r) => sum + (r.quality_rating || 0), 0) / totalReviews
    const avgCommunication = reviews.reduce((sum, r) => sum + (r.communication_rating || 0), 0) / totalReviews
    const avgProfessionalism = reviews.reduce((sum, r) => sum + (r.professionalism_rating || 0), 0) / totalReviews

    // Count rating distribution
    const ratingDistribution = {
      five_star: reviews.filter(r => r.rating === 5).length,
      four_star: reviews.filter(r => r.rating === 4).length,
      three_star: reviews.filter(r => r.rating === 3).length,
      two_star: reviews.filter(r => r.rating === 2).length,
      one_star: reviews.filter(r => r.rating === 1).length
    }

    // Upsert summary
    const { error } = await supabase
      .from('helper_rating_summary')
      .upsert({
        helper_id: helperId,
        total_reviews: totalReviews,
        average_rating: avgRating,
        punctuality_avg: avgPunctuality,
        quality_avg: avgQuality,
        communication_avg: avgCommunication,
        professionalism_avg: avgProfessionalism,
        ...ratingDistribution
      }, {
        onConflict: 'helper_id'
      })

    if (error) throw error

    revalidatePath(`/helper/${helperId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Update helper rating summary error:', error)
    return { error: error.message }
  }
}

export async function getHelperRatingSummary(helperId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('helper_rating_summary')
      .select('*')
      .eq('helper_id', helperId)
      .maybeSingle()

    if (error) throw error

    return { success: true, summary: data }
  } catch (error: any) {
    console.error('Get helper rating summary error:', error)
    return { error: error.message }
  }
}

export async function reportReview(reviewId: string, reason: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Mark review as reported (admin will review)
    const { error } = await supabase
      .from('reviews')
      .update({
        is_reported: true,
        report_reason: reason,
        reported_at: new Date().toISOString(),
        reported_by: user.id
      })
      .eq('id', reviewId)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Report review error:', error)
    return { error: error.message }
  }
}

// ============================================
// ADMIN ACTIONS
// ============================================

export async function hideReview(reviewId: string) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    const { error } = await supabase
      .from('reviews')
      .update({ is_visible: false })
      .eq('id', reviewId)

    if (error) throw error

    revalidatePath('/admin/reviews')
    return { success: true }
  } catch (error: any) {
    console.error('Hide review error:', error)
    return { error: error.message }
  }
}

export async function getReportedReviews() {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        customer:profiles!reviews_customer_id_fkey(full_name, email),
        helper:profiles!reviews_helper_id_fkey(full_name, email),
        reported_by_user:profiles!reviews_reported_by_fkey(full_name, email)
      `)
      .eq('is_reported', true)
      .order('reported_at', { ascending: false })

    if (error) throw error

    return { success: true, reviews: data }
  } catch (error: any) {
    console.error('Get reported reviews error:', error)
    return { error: error.message }
  }
}
