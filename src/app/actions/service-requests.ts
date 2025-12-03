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
    const sanitizedAddress = validatedData.service_address ? sanitizeText(validatedData.service_address) : null
    const sanitizedCity = validatedData.city ? sanitizeText(validatedData.city) : null
    const sanitizedState = validatedData.state ? sanitizeText(validatedData.state) : null
    const sanitizedPincode = validatedData.pincode ? sanitizeText(validatedData.pincode) : null
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
        service_address: sanitizedAddress,
        service_city: sanitizedCity,
        service_state: sanitizedState,
        service_pincode: sanitizedPincode,
        city: sanitizedCity, // Keep for backward compatibility
        country: sanitizedCountry,
        budget_min: validatedData.budget_min || null,
        budget_max: validatedData.budget_max || null,
        service_location_lat: validatedData.latitude || null,
        service_location_lng: validatedData.longitude || null,
        latitude: validatedData.latitude || null, // Keep for backward compatibility
        longitude: validatedData.longitude || null, // Keep for backward compatibility
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

/**
 * GET SERVICE REQUESTS FOR HELPER
 * ✅ Authentication required (helper role)
 * ✅ Returns only open requests
 * ✅ Includes bid information
 * ✅ Distance calculation
 */
export async function getHelperServiceRequests() {
  try {
    const { user } = await requireAuth(UserRole.HELPER)

    const supabase = await createClient()

    // Get helper profile
    const { data: helperProfile } = await supabase
      .from('helper_profiles')
      .select('id, latitude, longitude')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!helperProfile) {
      return { error: 'Helper profile not found' }
    }

    // Get all open service requests
    const { data: requests, error } = await supabase
      .from('service_requests')
      .select(`
        id,
        title,
        description,
        category_id,
        service_address,
        service_city,
        scheduled_time,
        budget_min,
        budget_max,
        status,
        created_at,
        service_location_lat,
        service_location_lng,
        profiles:customer_id(full_name),
        service_categories(name),
        request_applications(id, helper_id, bid_amount, status, cover_note)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Failed to fetch service requests', { error })
      return { error: 'Failed to load service requests' }
    }

    type RequestWithRelations = {
      id: string
      title: string | null
      description: string | null
      category_id: string | null
      service_address: string | null
      service_city: string | null
      scheduled_time: string | null
      budget_min: number | null
      budget_max: number | null
      status: string
      created_at: string
      service_location_lat: number | null
      service_location_lng: number | null
      profiles: { full_name: string | null } | null
      service_categories: { name: string | null } | null
      request_applications: Array<{
        id: string
        helper_id: string
        bid_amount: number
        status: string
        cover_note: string | null
      }> | null
    }

    // Transform requests
    const transformedRequests = (requests as RequestWithRelations[]).map(req => {
      // Calculate distance if both coordinates available
      let distance = null
      if (
        helperProfile.latitude &&
        helperProfile.longitude &&
        req.service_location_lat &&
        req.service_location_lng
      ) {
        const R = 6371 // Earth's radius in km
        const dLat = ((req.service_location_lat - helperProfile.latitude) * Math.PI) / 180
        const dLon = ((req.service_location_lng - helperProfile.longitude) * Math.PI) / 180
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((helperProfile.latitude * Math.PI) / 180) *
            Math.cos((req.service_location_lat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        distance = R * c
      }

      // Find helper's application if exists
      const myApplication = req.request_applications?.find(app => app.helper_id === helperProfile.id)

      return {
        id: req.id,
        title: req.title || 'Untitled Request',
        description: req.description || '',
        category: req.service_categories?.name || 'Uncategorized',
        location_address: req.service_address || req.service_city || 'Location not specified',
        scheduled_time: req.scheduled_time,
        pricing_type: 'fixed',
        budget_min: req.budget_min,
        budget_max: req.budget_max,
        status: req.status,
        created_at: req.created_at,
        customer_name: req.profiles?.full_name || 'Unknown Customer',
        distance,
        bid_count: req.request_applications?.length || 0,
        my_bid: myApplication
          ? {
              id: myApplication.id,
              amount: myApplication.bid_amount,
              status: myApplication.status,
              message: myApplication.cover_note || '',
            }
          : null,
      }
    })

    return { requests: transformedRequests }
  } catch (error) {
    logger.error('Get helper service requests error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * SUBMIT BID ON SERVICE REQUEST
 * ✅ Authentication required (helper role)
 * ✅ Input validation
 * ✅ Rate limiting
 * ✅ Prevents duplicate bids
 */
export async function submitBid(data: {
  requestId: string
  amount: number
  message?: string
}) {
  try {
    const { user } = await requireAuth(UserRole.HELPER)

    // Rate limiting: 20 bids per hour
    const rateLimitResult = await checkRateLimit(`submit-bid:${user.id}`, {
      maxRequests: 20,
      windowMs: 3600000,
    })
    if (!rateLimitResult.allowed) {
      return { error: 'Rate limit exceeded. Please try again later.' }
    }

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

    // Validate amount
    if (!data.amount || data.amount <= 0) {
      return { error: 'Invalid bid amount' }
    }

    // Check if request exists and is open
    const { data: request, error: requestError } = await supabase
      .from('service_requests')
      .select('id, status')
      .eq('id', data.requestId)
      .maybeSingle()

    if (requestError || !request) {
      return { error: 'Service request not found' }
    }

    if (request.status !== 'open') {
      return { error: 'This request is no longer accepting bids' }
    }

    // Check for existing bid
    const { data: existingBid } = await supabase
      .from('request_applications')
      .select('id')
      .eq('request_id', data.requestId)
      .eq('helper_id', helperProfile.id)
      .maybeSingle()

    if (existingBid) {
      return { error: 'You have already submitted a bid for this request' }
    }

    // Submit bid
    const { error: bidError } = await supabase.from('request_applications').insert({
      request_id: data.requestId,
      helper_id: helperProfile.id,
      bid_amount: data.amount,
      cover_note: data.message ? sanitizeText(data.message) : null,
      status: 'applied',
      created_at: new Date().toISOString(),
    })

    if (bidError) {
      logger.error('Failed to submit bid', { error: bidError })
      return { error: 'Failed to submit bid. Please try again.' }
    }

    logger.info('Bid submitted', {
      request_id: data.requestId,
      helper_id: helperProfile.id,
      amount: data.amount,
    })

    return { success: true }
  } catch (error) {
    logger.error('Submit bid error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * WITHDRAW BID
 * ✅ Authentication required (helper role)
 * ✅ Only pending bids can be withdrawn
 */
export async function withdrawBid(bidId: string) {
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

    // Check if bid exists and belongs to helper
    const { data: bid, error: bidError } = await supabase
      .from('request_applications')
      .select('id, status, helper_id')
      .eq('id', bidId)
      .maybeSingle()

    if (bidError || !bid) {
      return { error: 'Bid not found' }
    }

    if (bid.helper_id !== helperProfile.id) {
      return { error: 'You do not have permission to withdraw this bid' }
    }

    if (bid.status !== 'applied') {
      return { error: 'Only pending bids can be withdrawn' }
    }

    // Withdraw bid (soft delete - update status)
    const { error: updateError } = await supabase
      .from('request_applications')
      .update({
        status: 'withdrawn',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bidId)

    if (updateError) {
      logger.error('Failed to withdraw bid', { error: updateError })
      return { error: 'Failed to withdraw bid. Please try again.' }
    }

    logger.info('Bid withdrawn', {
      bid_id: bidId,
      helper_id: helperProfile.id,
    })

    return { success: true }
  } catch (error) {
    logger.error('Withdraw bid error', { error })
    return { error: 'An unexpected error occurred' }
  }
}

