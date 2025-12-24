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
  try {
    // Auth + rate-limit
    const { user } = await requireAuth()
    await rateLimit('add-review-photos', user.id, RATE_LIMITS.CREATE_REVIEW)

    const supabase = await createClient()

    // Verify review ownership
    const { data: review, error: reviewErr } = await supabase
      .from('reviews')
      .select('customer_id')
      .eq('id', reviewId)
      .single()

    if (reviewErr) throw reviewErr
    if (review?.customer_id !== user.id) {
      return { error: 'Unauthorized' }
    }

    // Sanitize photo urls
    const photos = photoUrls.map(url => ({
      review_id: reviewId,
      photo_url: sanitizeText(url)
    }))

    const { data, error } = await supabase
      .from('review_photos')
      .insert(photos)
      .select()

    if (error) throw error

    revalidatePath('/customer/requests')
    logger.info('Added review photos', { userId: user.id, reviewId, count: photos.length })
    return { success: true, photos: data }
  } catch (error: any) {
    logger.error('Add review photos error', { error })
    return handleServerActionError(error)
  }
}

export async function getHelperReviews(helperId: string, limit = 10, offset = 0) {
  const supabase = await createClient()

  try {
    // Public endpoint - rate limit by helperId to avoid scraping
    await rateLimit('get-helper-reviews', helperId, RATE_LIMITS.API_MODERATE)

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
    logger.error('Get helper reviews error', { error })
    return handleServerActionError(error)
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
    logger.error('Update helper rating summary error', { error })
    return handleServerActionError(error)
  }
}

export async function getHelperRatingSummary(helperId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('helper_rating_summary')
      .select('helper_id, average_rating, total_reviews, five_star, four_star, three_star, two_star, one_star')
      .eq('helper_id', helperId)
      .maybeSingle()

    if (error) throw error

    return { success: true, summary: data }
  } catch (error: any) {
    logger.error('Get helper rating summary error', { error })
    return handleServerActionError(error)
  }
}

export async function reportReview(reviewId: string, reason: string) {
  try {
    const { user } = await requireAuth()
    await rateLimit('report-review', user.id, RATE_LIMITS.API_STRICT)

    const supabase = await createClient()

    // Sanitize reason
    const safeReason = sanitizeText(reason)

    // Mark review as flagged (admin will review)
    const { error } = await supabase
      .from('reviews')
      .update({
        is_flagged: true,
        flag_reason: safeReason
      })
      .eq('id', reviewId)

    if (error) throw error

    logger.info('Review flagged', { userId: user.id, reviewId })
    return { success: true }
  } catch (error: any) {
    logger.error('Flag review error', { error })
    return handleServerActionError(error)
  }
}

// ============================================
// ADMIN ACTIONS
// ============================================

export async function approveReview(reviewId: string) {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)
    await rateLimit('admin-approve-review', user.id, RATE_LIMITS.ADMIN_BAN)

    const supabase = await createClient()

    const { error } = await supabase
      .from('reviews')
      .update({ is_moderated: false, is_flagged: false })
      .eq('id', reviewId)

    if (error) throw error

    revalidatePath('/admin/reviews')
    logger.info('Review approved by admin', { adminId: user.id, reviewId })
    return { success: true }
  } catch (error: any) {
    logger.error('Approve review error', { error })
    return handleServerActionError(error)
  }
}

export async function hideReview(reviewId: string) {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)
    await rateLimit('admin-hide-review', user.id, RATE_LIMITS.ADMIN_BAN)

    const supabase = await createClient()

    const { error } = await supabase
      .from('reviews')
      .update({ is_moderated: true })
      .eq('id', reviewId)

    if (error) throw error

    revalidatePath('/admin/reviews')
    logger.info('Review hidden by admin', { adminId: user.id, reviewId })
    return { success: true }
  } catch (error: any) {
    logger.error('Hide review error', { error })
    return handleServerActionError(error)
  }
}

export async function getReportedReviews() {
  try {
    const { user } = await requireAuth(UserRole.ADMIN)
    await rateLimit('admin-get-reported-reviews', user.id, RATE_LIMITS.ADMIN_APPROVE)

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        review_text,
        is_flagged,
        is_moderated,
        flag_reason,
        created_at,
        updated_at,
        customer:customer_id(full_name, avatar_url),
        helper:helper_id(full_name, avatar_url),
        request:request_id(id, category_id)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    // Get category names for each request
    const reviewsWithCategories = await Promise.all(
      (data || []).map(async (review: any) => {
        if (review.request?.category_id) {
          const { data: category } = await supabase
            .from('service_categories')
            .select('name')
            .eq('id', review.request.category_id)
            .single()
          
          return {
            ...review,
            booking: {
              id: review.request?.id,
              category_name: category?.name || 'Unknown'
            }
          }
        }
        return {
          ...review,
          booking: {
            id: review.request?.id,
            category_name: 'Unknown'
          }
        }
      })
    )

    return { success: true, reviews: reviewsWithCategories }
  } catch (error: any) {
    logger.error('Get reported reviews error', { error })
    return handleServerActionError(error)
  }
}
