'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth-middleware'
import { handleServerActionError } from '@/lib/errors'
import { sanitizeHTML } from '@/lib/sanitize'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { UserRole } from '@/lib/constants'
import { logger } from '@/lib/logger'

/**
 * GET HELPER REVIEWS
 * Fetch all reviews/ratings for the authenticated helper from job_ratings table
 */
export async function getHelperReviews() {
  try {
    const { user } = await requireAuth(UserRole.HELPER)

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

    // Get ratings from job_ratings table (where customers submit ratings)
    // First try with inner join, if no results, try without to debug
    const { data: ratings, error } = await supabase
      .from('job_ratings')
      .select(`
        id,
        rating,
        review,
        punctuality_rating,
        quality_rating,
        behaviour_rating,
        would_recommend,
        tip_amount,
        created_at,
        request_id,
        helper_id,
        customer_id,
        service_requests(id, title, category_id),
        profiles!job_ratings_customer_id_fkey(full_name, email, avatar_url)
      `)
      .eq('helper_id', helperProfile.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Failed to fetch helper ratings', { error, helperId: helperProfile.id })
      return { error: 'Failed to load ratings' }
    }
    
    // Log for debugging if no ratings found
    if (!ratings || ratings.length === 0) {
      logger.info('No ratings found for helper', { helperId: helperProfile.id, userId: user.id })
    }

    type RatingWithRelations = {
      id: string
      rating: number
      review: string | null
      punctuality_rating: number | null
      quality_rating: number | null
      behaviour_rating: number | null
      would_recommend: boolean | null
      tip_amount: number | null
      created_at: string
      request_id: string
      helper_id: string
      customer_id: string
      service_requests: { id: string; title: string | null; category_id: string | null } | null
      profiles: { full_name: string | null; email: string; avatar_url: string | null } | null
    }

    // Transform data for frontend
    const transformedReviews = (ratings as unknown as RatingWithRelations[])?.map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.review,
      punctuality_rating: r.punctuality_rating,
      quality_rating: r.quality_rating,
      behaviour_rating: r.behaviour_rating,
      would_recommend: r.would_recommend,
      tip_amount: r.tip_amount,
      created_at: r.created_at,
      customer_name: r.profiles?.full_name || 'Anonymous',
      customer_email: r.profiles?.email || '',
      customer_avatar: r.profiles?.avatar_url || null,
      service_title: r.service_requests?.title || 'Service',
      request_id: r.request_id,
      response: null, // Job ratings don't have responses yet
    })) || []

    return { data: { reviews: transformedReviews } }
  } catch (error) {
    logger.error('Get helper reviews error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * RESPOND TO REVIEW
 * Create a response to a customer review
 */
export async function respondToReview(reviewId: string, responseText: string) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)

    // Validate input
    if (!responseText || responseText.trim().length === 0) {
      return { error: 'Response text is required' }
    }

    if (responseText.length > 500) {
      return { error: 'Response must be 500 characters or less' }
    }

    // Rate limit responses
    await rateLimit('respond-to-review', user.id, RATE_LIMITS.CREATE_REVIEW)

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

    // Verify the review belongs to this helper
    const { data: review } = await supabase
      .from('reviews')
      .select('helper_id')
      .eq('id', reviewId)
      .maybeSingle()

    if (!review || review.helper_id !== helperProfile.id) {
      return { error: 'Review not found or unauthorized' }
    }

    // Check if response already exists
    const { data: existingResponse } = await supabase
      .from('review_responses')
      .select('id')
      .eq('review_id', reviewId)
      .maybeSingle()

    if (existingResponse) {
      return { error: 'You have already responded to this review' }
    }

    // Sanitize response text
    const sanitizedResponse = sanitizeHTML(responseText.trim())

    // Create response
    const { error: insertError } = await supabase
      .from('review_responses')
      .insert({
        review_id: reviewId,
        helper_id: helperProfile.id,
        response_text: sanitizedResponse,
      })

    if (insertError) {
      logger.error('Failed to create review response', { error: insertError })
      return { error: 'Failed to submit response' }
    }

    logger.info('Review response created', {
      review_id: reviewId,
      helper_id: helperProfile.id,
    })

    revalidatePath('/helper/ratings')

    return { success: true }
  } catch (error) {
    logger.error('Respond to review error', { error })
    return { error: 'An unexpected error occurred' }
  }
}
