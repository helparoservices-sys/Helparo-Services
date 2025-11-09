/**
 * SECURE SERVICE REQUEST ACTIONS
 * Server-side actions with validation, sanitization, rate limiting
 * Replaces unsafe direct Supabase calls
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-middleware'
import { UserRole } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rate-limit'
import { sanitizeHTML, sanitizeText } from '@/lib/sanitize'
import { createServiceRequestSchema } from '@/lib/validation'
import { createValidationError, handleServerActionError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { notifyNewMatches, findMatchingHelpers } from '@/lib/smart-matching'
import { z } from 'zod'

/**
 * CREATE SERVICE REQUEST - Secure version
 * ✅ Authentication required
 * ✅ Rate limited (max 10 requests per hour)
 * ✅ Input validation with Zod
 * ✅ Input sanitization (XSS prevention)
 * ✅ Structured logging
 * ✅ Smart helper matching
 */
export async function createServiceRequest(formData: z.infer<typeof createServiceRequestSchema>) {
  const { user } = await requireAuth(UserRole.CUSTOMER)
  
  // Rate limiting: 10 requests per hour per user
  const rateLimitResult = await checkRateLimit(`service-request:${user.id}`, { 
    maxRequests: 10, 
    windowMs: 3600000 
  })
  if (!rateLimitResult.allowed) {
    return { error: 'Rate limit exceeded. Please try again later.' }
  }

  try {
    // Validate input
    const validatedData = createServiceRequestSchema.parse(formData)

    // Sanitize text inputs (prevent XSS)
    const sanitizedTitle = sanitizeText(validatedData.title)
    const sanitizedDescription = sanitizeHTML(validatedData.description)
    const sanitizedCity = validatedData.city ? sanitizeText(validatedData.city) : null
    const sanitizedCountry = validatedData.country ? sanitizeText(validatedData.country) : null

    // Additional security checks
    if (validatedData.budget_min && validatedData.budget_max) {
      if (validatedData.budget_max < validatedData.budget_min) {
        return { error: 'Maximum budget must be greater than minimum budget' }
      }
    }

    const supabase = await createClient()

    // Insert into database
    const { data: request, error } = await supabase
      .from('service_requests')
      .insert({
        customer_id: user.id,
        category_id: validatedData.category_id,
        title: sanitizedTitle,
        description: sanitizedDescription,
        city: sanitizedCity,
        country: sanitizedCountry,
        budget_min: validatedData.budget_min || null,
        budget_max: validatedData.budget_max || null,
        latitude: validatedData.latitude || null,
        longitude: validatedData.longitude || null,
        status: 'open',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      logger.error('Failed to create service request', { error, user_id: user.id })
      return { error: 'Failed to create service request. Please try again.' }
    }

    logger.info('Service request created', {
      request_id: request.id,
      customer_id: user.id,
      category_id: validatedData.category_id,
      budget_range: validatedData.budget_min && validatedData.budget_max 
        ? `${validatedData.budget_min}-${validatedData.budget_max}` 
        : 'unspecified'
    })

    // 🚀 SMART MATCHING: Find and notify matching helpers
    if (validatedData.latitude && validatedData.longitude) {
      try {
        const matches = await findMatchingHelpers({
          service_type: validatedData.category_id,
          location: { lat: validatedData.latitude, lng: validatedData.longitude },
          urgency: 'flexible',
          budget_range: validatedData.budget_min && validatedData.budget_max 
            ? { min: validatedData.budget_min, max: validatedData.budget_max }
            : undefined,
        })

        if (matches.length > 0) {
          await notifyNewMatches(user.id, request.id, matches)
          logger.info('Smart matches found', {
            request_id: request.id,
            match_count: matches.length,
            top_match_score: matches[0]?.match_score,
          })
        }
      } catch (matchError) {
        // Don't fail the request if matching fails
        logger.error('Smart matching failed', { error: matchError, request_id: request.id })
      }
    }

    return { success: true, data: request }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    logger.error('Create service request error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * GET SERVICE CATEGORIES - Public
 * No auth required, but rate limited
 */
export async function getServiceCategories() {
  const rateLimitResult = await checkRateLimit('public:categories', { 
    maxRequests: 100, 
    windowMs: 60000 
  })
  if (!rateLimitResult.allowed) {
    return { error: 'Too many requests. Please try again later.' }
  }

  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('service_categories')
      .select('id, name, description, icon')
      .eq('is_active', true)
      .order('name')

    if (error) {
      return { error: 'Failed to load categories' }
    }

    return { success: true, data }
  } catch (error) {
    logger.error('Get categories error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * UPDATE SERVICE REQUEST STATUS
 * Only request owner can update
 */
export async function updateServiceRequestStatus(
  requestId: string, 
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('service_requests')
      .select('customer_id')
      .eq('id', requestId)
      .single()

    if (!existing || existing.customer_id !== user.id) {
      return { error: 'Request not found or unauthorized' }
    }

    const { data, error } = await supabase
      .from('service_requests')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) {
      logger.error('Failed to update request status', { error })
      return { error: 'Failed to update request status' }
    }

    logger.info('Service request status updated', {
      request_id: requestId,
      customer_id: user.id,
      new_status: status,
    })

    return { success: true, data }
  } catch (error) {
    logger.error('Update service request error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * DELETE SERVICE REQUEST
 * Only request owner can delete (soft delete)
 */
export async function deleteServiceRequest(requestId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('service_requests')
      .select('customer_id, status')
      .eq('id', requestId)
      .single()

    if (!existing || existing.customer_id !== user.id) {
      return { error: 'Request not found or unauthorized' }
    }

    if (existing.status === 'in_progress') {
      return { error: 'Cannot delete request that is in progress' }
    }

    const { error } = await supabase
      .from('service_requests')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString() 
      })
      .eq('id', requestId)

    if (error) {
      logger.error('Failed to delete request', { error })
      return { error: 'Failed to delete request' }
    }

    logger.info('Service request deleted', {
      request_id: requestId,
      customer_id: user.id,
    })

    return { success: true }
  } catch (error) {
    logger.error('Delete service request error', { error })
    return { error: 'An unexpected error occurred' }
  }
}
