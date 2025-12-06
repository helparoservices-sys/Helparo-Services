import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/helpers/instant
 * Fetch available helpers with instant booking enabled
 * Query params: category_id, lat, lng, radius (in km)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    
    const categoryId = searchParams.get('category_id')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = parseInt(searchParams.get('radius') || '25') // Default 25km

    // Validate user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.error('❌ No session found - user not authenticated')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', session.user.email)

    // Base query for instant booking helpers (include both online and offline)
    let query = supabase
      .from('helper_profiles')
      .select(`
        id,
        user_id,
        hourly_rate,
        service_radius,
        instant_booking_enabled,
        instant_booking_price,
        instant_booking_duration_minutes,
        available_time_slots,
        auto_accept_enabled,
        response_time_minutes,
        service_categories,
        skills,
        experience_years,
        is_available_now,
        profiles:user_id (
          id,
          full_name,
          avatar_url,
          phone
        )
      `)
      .eq('instant_booking_enabled', true)
      .eq('is_approved', true)
      .eq('verification_status', 'approved')

    console.log('🔍 Instant Booking Query Params:', { categoryId, lat, lng })

    // Filter by category if provided
    if (categoryId) {
      query = query.contains('service_categories', [categoryId])
      console.log('📂 Filtering by category:', categoryId)
    }

    const { data: helpers, error } = await query

    if (error) {
      console.error('Error fetching instant helpers:', error)
      return NextResponse.json({ error: 'Failed to fetch helpers' }, { status: 500 })
    }

    console.log('📋 Instant Booking Query Results:', {
      categoryId,
      totalHelpers: helpers?.length || 0,
      helpers: helpers?.map(h => ({
        name: h.profiles?.full_name,
        categories: h.service_categories?.length || 0,
        categoryIds: h.service_categories,
        price: h.instant_booking_price,
        enabled: h.instant_booking_enabled,
        approved: h.is_approved
      }))
    })

    // If location provided, filter by service radius
    let filteredHelpers = helpers || []
    
    if (lat && lng && helpers) {
      const userLat = parseFloat(lat)
      const userLng = parseFloat(lng)
      
      // Note: For production, you'd calculate actual distance using PostGIS or similar
      // This is a simplified version
      filteredHelpers = helpers.filter(helper => {
        // For now, include all helpers within the search radius
        // In production, add location columns to helper_profiles and calculate distance
        return true
      })
    }

    // Sort by: Available now first, then auto_accept, then response time, then price
    filteredHelpers.sort((a, b) => {
      // Priority 1: Available now (online helpers first)
      if (a.is_available_now && !b.is_available_now) return -1
      if (!a.is_available_now && b.is_available_now) return 1
      
      // Priority 2: Auto accept enabled
      if (a.auto_accept_enabled && !b.auto_accept_enabled) return -1
      if (!a.auto_accept_enabled && b.auto_accept_enabled) return 1
      
      // Priority 3: Response time
      if (a.response_time_minutes !== b.response_time_minutes) {
        return (a.response_time_minutes || 999) - (b.response_time_minutes || 999)
      }
      
      // Priority 4: Price
      return (a.instant_booking_price || 0) - (b.instant_booking_price || 0)
    })

    return NextResponse.json({ 
      data: filteredHelpers,
      count: filteredHelpers.length 
    })

  } catch (error: any) {
    console.error('Instant helpers API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
