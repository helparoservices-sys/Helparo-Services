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
 * Fetch all reviews for the authenticated helper
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

    // Get reviews with service request and customer details
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        service_requests!inner(id, title),
        profiles!reviews_customer_id_fkey(full_name, email),
        review_responses(response_text, created_at)
      `)
      .eq('helper_id', helperProfile.id)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Failed to fetch helper reviews', { error })
      return { error: 'Failed to load reviews' }
    }

    type ReviewWithRelations = {
      id: string
      rating: number
      comment: string | null
      created_at: string
      service_requests: Array<{ id: string; title: string | null }>
      profiles: Array<{ full_name: string | null; email: string }>
      review_responses: Array<{ response_text: string; created_at: string }>
    }

    // Transform data for frontend
    const transformedReviews = (reviews as unknown as ReviewWithRelations[])?.map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      customer_name: r.profiles?.[0]?.full_name || 'Anonymous',
      customer_email: r.profiles?.[0]?.email || '',
      service_title: r.service_requests?.[0]?.title || 'Service',
      response: r.review_responses?.[0] || null,
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
