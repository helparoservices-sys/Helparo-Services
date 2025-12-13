import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Calculate distance between two coordinates (Haversine formula)
function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Generate random offset for helpers without location (for demo purposes)
function generateRandomOffset(baseLat: number, baseLng: number, maxKm: number = 5): { lat: number, lng: number } {
  const randomDistance = Math.random() * maxKm
  const randomAngle = Math.random() * 2 * Math.PI
  const latOffset = (randomDistance / 111) * Math.cos(randomAngle)
  const lngOffset = (randomDistance / (111 * Math.cos(baseLat * Math.PI / 180))) * Math.sin(randomAngle)
  return {
    lat: baseLat + latOffset,
    lng: baseLng + lngOffset
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const categoryId = searchParams.get('categoryId') || null
    const radiusKm = parseFloat(searchParams.get('radius') || '15') // Default 15km radius

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude required' }, { status: 400 })
    }

    console.log('🔍 Fetching nearby helpers for:', { lat, lng, categoryId, radiusKm })

    const supabase = await createClient()

    // Fetch approved helpers with their current location - using only essential columns
    const { data: helpers, error } = await supabase
      .from('helper_profiles')
      .select(`
        id,
        user_id,
        current_location_lat,
        current_location_lng,
        is_online,
        is_on_job,
        service_categories,
        profiles!helper_profiles_user_id_fkey (
          full_name,
          avatar_url
        )
      `)
      .eq('is_approved', true)
      .eq('verification_status', 'approved')

    if (error) {
      console.error('Error fetching helpers:', error)
      return NextResponse.json({ error: 'Failed to fetch helpers' }, { status: 500 })
    }

    console.log(`📍 Found ${helpers?.length || 0} approved helpers total`)

    // Filter helpers by distance and category
    const nearbyHelpers = (helpers || [])
      .map(helper => {
        // Use actual location if available, otherwise generate random nearby location for demo
        let helperLat = helper.current_location_lat
        let helperLng = helper.current_location_lng
        let hasRealLocation = true

        if (!helperLat || !helperLng) {
          // Generate random location within 5km for helpers without location (demo purposes)
          const randomLoc = generateRandomOffset(lat, lng, 5)
          helperLat = randomLoc.lat
          helperLng = randomLoc.lng
          hasRealLocation = false
        }

        // Calculate distance
        const distance = calculateDistanceKm(lat, lng, helperLat, helperLng)

        // Skip if beyond radius
        if (distance > radiusKm) {
          return null
        }

        // If category specified, filter by it (skip filter if no categories set)
        if (categoryId && helper.service_categories && (helper.service_categories as string[]).length > 0) {
          const categories = helper.service_categories as string[]
          if (!categories.includes(categoryId)) {
            return null
          }
        }

        return {
          id: helper.id,
          lat: helperLat,
          lng: helperLng,
          name: (helper.profiles as any)?.full_name || 'Helper',
          avatar: (helper.profiles as any)?.avatar_url || null,
          rating: 4.5, // Default rating for display
          jobsCompleted: 0,
          isOnline: hasRealLocation ? (helper.is_online || false) : true, // Show as online for demo
          isOnJob: helper.is_on_job || false,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
          hasRealLocation
        }
      })
      .filter((h): h is NonNullable<typeof h> => h !== null)
      .sort((a, b) => a.distance - b.distance) // Sort by nearest first
      .slice(0, 20) // Limit to 20 nearest helpers

    console.log(`✅ Returning ${nearbyHelpers.length} nearby helpers`)

    return NextResponse.json({
      helpers: nearbyHelpers,
      count: nearbyHelpers.length,
      searchRadius: radiusKm,
      totalApproved: helpers?.length || 0
    })

  } catch (error: any) {
    console.error('❌ Nearby helpers API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}