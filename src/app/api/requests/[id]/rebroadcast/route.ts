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

// Type definitions
interface ServiceRequest {
  id: string
  customer_id: string
  category_id: string
  title: string
  description: string
  service_address: string
  service_location_lat: number
  service_location_lng: number
  estimated_price: number
  urgency_level: string
  assigned_helper_id: string | null
  status: string
  broadcast_status: string
  category: {
    id: string
    name: string
    slug: string
    parent_id: string | null
  } | null
}

interface HelperProfile {
  id: string
  user_id: string
  is_available_now: boolean
  is_online: boolean
  is_on_job: boolean
  emergency_availability: boolean
  current_location_lat: number | null
  current_location_lng: number | null
  service_categories: string[] | null
  profiles: { full_name: string; phone: string } | null
  distance_km?: number
  category_match?: boolean
}

interface CustomerProfile {
  full_name: string
  phone: string
}

/**
 * Re-broadcast API - Called when a helper cancels an assigned job
 * This resets the job to broadcasting state and notifies all relevant helpers again
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔄 Re-broadcast API called')
  
  try {
    const { id: requestId } = await params
    const supabase = await createClient()
    
    // Get the service request
    const { data: serviceRequestData, error: fetchError } = await supabase
      .from('service_requests')
      .select(`
        id,
        customer_id,
        category_id,
        title,
        description,
        service_address,
        service_location_lat,
        service_location_lng,
        estimated_price,
        urgency_level,
        assigned_helper_id,
        status,
        broadcast_status,
        category:category_id(id, name, slug, parent_id)
      `)
      .eq('id', requestId)
      .single()

    const serviceRequest = serviceRequestData as unknown as ServiceRequest | null

    if (fetchError || !serviceRequest) {
      console.error('❌ Service request not found:', fetchError)
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 })
    }

    // Verify that the job can be re-broadcasted (was assigned but not started)
    if (serviceRequest.broadcast_status === 'completed') {
      return NextResponse.json({ error: 'Cannot re-broadcast a completed job' }, { status: 400 })
    }

    console.log('📋 Re-broadcasting job:', {
      id: serviceRequest.id,
      status: serviceRequest.status,
      broadcast_status: serviceRequest.broadcast_status,
      previous_helper: serviceRequest.assigned_helper_id
    })

    // Get customer profile for notifications
    const { data: customerProfileData } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', serviceRequest.customer_id)
      .single()

    const customerProfile = customerProfileData as CustomerProfile | null

    // Get category info
    const category = serviceRequest.category
    const finalCategoryId = category?.id || serviceRequest.category_id
    const finalCategoryName = category?.name || 'Service'
    const categorySlug = category?.slug || ''
    const categoryParentId = category?.parent_id || null

    // Reset the service request to broadcasting state
    const supabase2 = await createClient() // Fresh client to avoid type inference issues
    const updatePayload = {
      status: 'open',
      broadcast_status: 'broadcasting',
      assigned_helper_id: null,
      helper_accepted_at: null,
      work_started_at: null,
      broadcast_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // Reset 30 mins expiry
      updated_at: new Date().toISOString()
    }
    
    const updateResult = await supabase2
      .from('service_requests')
      .update(updatePayload)
      .eq('id', requestId)

    if (updateResult.error) {
      console.error('❌ Failed to update service request:', updateResult.error)
      return NextResponse.json({ error: 'Failed to reset job status' }, { status: 500 })
    }

    // Delete old broadcast notifications for this request
    await supabase2
      .from('broadcast_notifications')
      .delete()
      .eq('request_id', requestId)

    console.log('✅ Cleared old broadcast notifications')

    // Find relevant helpers (same logic as original broadcast)
    const serviceLat = serviceRequest.service_location_lat
    const serviceLng = serviceRequest.service_location_lng
    const BROADCAST_RADIUS_KM = 25

    // Get all approved, online helpers who are NOT on a job
    const { data: relevantHelpersData, error: helpersError } = await supabase
      .from('helper_profiles')
      .select(`
        id,
        user_id,
        is_available_now,
        is_online,
        is_on_job,
        emergency_availability,
        current_location_lat,
        current_location_lng,
        service_categories,
        profiles:user_id(full_name, phone)
      `)
      .eq('is_approved', true)
      .eq('is_on_job', false) // Only helpers NOT on a job
      .or('is_available_now.eq.true,is_online.eq.true') // Online helpers

    if (helpersError) {
      console.error('❌ Error fetching helpers:', helpersError)
      return NextResponse.json({ error: 'Failed to fetch helpers' }, { status: 500 })
    }

    const relevantHelpers = (relevantHelpersData || []) as unknown as HelperProfile[]

    console.log(`👥 Found ${relevantHelpers.length} potential helpers`)

    // Filter helpers by distance and category
    let filteredHelpers = relevantHelpers.filter(helper => {
      // Skip if no location
      if (!helper.current_location_lat || !helper.current_location_lng) {
        // Still include but with distance 0 (for testing)
        helper.distance_km = 0
        helper.category_match = false
        return true
      }

      // Calculate distance
      const distance = calculateDistanceKm(
        serviceLat,
        serviceLng,
        helper.current_location_lat,
        helper.current_location_lng
      )

      // Check if within radius
      if (distance > BROADCAST_RADIUS_KM) {
        console.log(`❌ Helper ${helper.id} too far: ${distance.toFixed(1)}km`)
        return false
      }

      // Check category match
      const categories = helper.service_categories || []
      const categoryMatch = categories.some(cat => {
        if (cat === finalCategoryId) return true
        if (categoryParentId && cat === categoryParentId) return true
        if (categorySlug && cat.toLowerCase() === categorySlug.toLowerCase()) return true
        if (categorySlug && cat.toLowerCase().includes(categorySlug.split('-')[0].toLowerCase())) return true
        if (finalCategoryName && cat.toLowerCase().includes(finalCategoryName.toLowerCase().split(' ')[0])) return true
        return false
      })

      helper.distance_km = distance
      helper.category_match = categoryMatch

      return true // Include ALL helpers within radius
    })

    // Sort helpers: Category match first, then by distance
    filteredHelpers.sort((a, b) => {
      const aMatch = a.category_match ? 1 : 0
      const bMatch = b.category_match ? 1 : 0
      if (aMatch === bMatch) {
        return (a.distance_km || 0) - (b.distance_km || 0)
      }
      return bMatch - aMatch
    })

    // FALLBACK: If no helpers found within radius, notify ALL approved helpers not on job
    if (filteredHelpers.length === 0 && relevantHelpers.length > 0) {
      console.log(`⚠️ No helpers found within radius. Notifying ALL ${relevantHelpers.length} available helpers.`)
      filteredHelpers = relevantHelpers.map(helper => {
        helper.distance_km = 0
        helper.category_match = false
        return helper
      })
    }

    console.log(`📢 ${filteredHelpers.length} helpers will be re-notified`)

    // Create broadcast notifications for all relevant helpers
    const broadcastNotifications: any[] = []
    const notifications: any[] = []
    const customerName = customerProfile?.full_name || 'A customer'

    if (filteredHelpers.length > 0) {
      for (const helper of filteredHelpers) {
        const distanceKm = helper.distance_km || 0

        // Create broadcast_notifications entry for real-time popup
        broadcastNotifications.push({
          request_id: requestId,
          helper_id: helper.id,
          status: 'sent',
          distance_km: distanceKm.toFixed(2),
          sent_at: new Date().toISOString()
        })

        // Also create regular notification for push
        notifications.push({
          user_id: helper.user_id,
          request_id: requestId,
          channel: 'push',
          title: `🔔 Job Available Again: ${finalCategoryName}!`,
          body: `${customerName} needs help! ₹${serviceRequest.estimated_price} • ${distanceKm > 0 ? distanceKm.toFixed(1) + 'km away' : 'Near you'}`,
          data: {
            type: 'job_rebroadcast',
            request_id: requestId,
            category: finalCategoryName,
            estimated_price: serviceRequest.estimated_price,
            urgency: serviceRequest.urgency_level,
            customer_name: customerName,
            address: serviceRequest.service_address,
            distance_km: distanceKm.toFixed(1)
          },
          status: 'queued'
        })
      }

      // Insert broadcast notifications (for real-time)
      if (broadcastNotifications.length > 0) {
        const { error: broadcastError } = await supabase
          .from('broadcast_notifications')
          .insert(broadcastNotifications as any)

        if (broadcastError) {
          console.error('Error creating broadcast notifications:', broadcastError)
        } else {
          console.log(`✅ Created ${broadcastNotifications.length} broadcast notifications`)
        }
      }

      // Insert regular notifications (for push)
      if (notifications.length > 0) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications as any)

        if (notifError) {
          console.error('Error creating notifications:', notifError)
        }
      }
    }

    // Notify customer that job is being re-broadcasted
    await supabase
      .from('notifications')
      .insert({
        user_id: serviceRequest.customer_id,
        request_id: requestId,
        channel: 'push',
        title: '🔄 Finding Another Helper',
        body: `Your ${finalCategoryName} request is being sent to ${filteredHelpers.length} helpers. You'll receive responses soon!`,
        data: {
          type: 'job_rebroadcast',
          request_id: requestId,
          helpers_notified: filteredHelpers.length
        },
        status: 'queued'
      } as any)

    console.log('✅ Re-broadcast completed successfully')

    return NextResponse.json({
      success: true,
      message: `Job re-broadcasted to ${filteredHelpers.length} helpers`,
      helpersNotified: filteredHelpers.length
    })

  } catch (error: any) {
    console.error('❌ Re-broadcast API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to re-broadcast request' },
      { status: 500 }
    )
  }
}
