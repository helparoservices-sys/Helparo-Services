import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/helpers/instant
 * Fetch available helpers with instant booking enabled
 * Query params: category_id, lat, lng, radius (in km)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const searchParams = request.nextUrl.searchParams
    
    const categoryId = searchParams.get('category_id')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = parseInt(searchParams.get('radius') || '25') // Default 25km

    // Validate user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Base query for instant booking helpers
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

    // Filter by category if provided
    if (categoryId) {
      query = query.contains('service_categories', [categoryId])
    }

    const { data: helpers, error } = await query

    if (error) {
      console.error('Error fetching instant helpers:', error)
      return NextResponse.json({ error: 'Failed to fetch helpers' }, { status: 500 })
    }

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

    // Sort by: auto_accept first, then by response time, then by price
    filteredHelpers.sort((a, b) => {
      if (a.auto_accept_enabled && !b.auto_accept_enabled) return -1
      if (!a.auto_accept_enabled && b.auto_accept_enabled) return 1
      
      if (a.response_time_minutes !== b.response_time_minutes) {
        return (a.response_time_minutes || 999) - (b.response_time_minutes || 999)
      }
      
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
