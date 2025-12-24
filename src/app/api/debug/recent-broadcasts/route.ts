import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Debug endpoint to check recent broadcast and why helpers weren't notified
 * GET /api/debug/recent-broadcasts?limit=5
 */
export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '5')
    
    const supabase = createAdminClient()

    // Get recent service requests with broadcast status
    const { data: requests, error } = await supabase
      .from('service_requests')
      .select(`
        id,
        title,
        status,
        broadcast_status,
        latitude,
        longitude,
        service_address,
        category_id,
        created_at,
        customer_id,
        profiles!service_requests_customer_id_fkey (
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // For each request, check how many helpers were notified
    const results = []
    
    for (const req of requests || []) {
      // Get category info
      const { data: category } = await supabase
        .from('service_categories')
        .select('name, slug')
        .eq('id', req.category_id)
        .single()

      // Get broadcast notifications for this request
      const { data: broadcasts } = await supabase
        .from('broadcast_notifications')
        .select('helper_id, status, distance_km')
        .eq('request_id', req.id)

      // Get all online, approved helpers with matching category
      const { data: potentialHelpers } = await supabase
        .from('helper_profiles')
        .select('id, user_id, service_categories, latitude, longitude, service_radius_km, is_online, is_approved')
        .eq('is_online', true)
        .eq('is_approved', true)

      // Calculate which helpers should have received it
      const helperAnalysis = potentialHelpers?.map(h => {
        const hasCategory = (h.service_categories || []).some((cat: string) => {
          const catLower = (cat || '').toLowerCase()
          const slugLower = (category?.slug || '').toLowerCase()
          const nameLower = (category?.name || '').toLowerCase()
          return cat === req.category_id || 
                 catLower === slugLower || 
                 nameLower.includes(catLower) ||
                 catLower.includes(nameLower.split(' ')[0].toLowerCase())
        })

        let distance = null
        if (req.latitude && req.longitude && h.latitude && h.longitude) {
          // Haversine formula
          const R = 6371
          const dLat = (h.latitude - req.latitude) * Math.PI / 180
          const dLng = (h.longitude - req.longitude) * Math.PI / 180
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(req.latitude * Math.PI / 180) * Math.cos(h.latitude * Math.PI / 180) *
                    Math.sin(dLng/2) * Math.sin(dLng/2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
          distance = R * c
        }

        const withinRadius = distance !== null && distance <= (h.service_radius_km || 15)
        const wasNotified = broadcasts?.some(b => b.helper_id === h.id)

        return {
          helper_id: h.id,
          categories: h.service_categories,
          hasCategory,
          distance_km: distance?.toFixed(1),
          service_radius_km: h.service_radius_km,
          withinRadius,
          wasNotified,
          shouldHaveBeenNotified: hasCategory && withinRadius,
          issue: !hasCategory ? 'NO_CATEGORY_MATCH' : 
                 !withinRadius ? `TOO_FAR (${distance?.toFixed(1)}km > ${h.service_radius_km}km)` : 
                 !wasNotified ? 'NOT_NOTIFIED_BUG' : 'OK'
        }
      })

      results.push({
        request_id: req.id,
        title: req.title,
        category: category?.name,
        category_slug: category?.slug,
        customer: (req.profiles as any)?.full_name,
        customer_location: {
          lat: req.latitude,
          lng: req.longitude,
          address: req.service_address
        },
        status: req.status,
        broadcast_status: req.broadcast_status,
        created_at: req.created_at,
        helpers_notified: broadcasts?.length || 0,
        potential_helpers: potentialHelpers?.length || 0,
        helper_analysis: helperAnalysis?.filter(h => h.hasCategory) // Only show relevant helpers
      })
    }

    return NextResponse.json({
      recent_requests: results,
      summary: {
        total_requests: results.length,
        requests_with_helpers: results.filter(r => r.helpers_notified > 0).length
      }
    })

  } catch (error: any) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
