import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

/**
 * DEBUG ONLY - Reset all helpers' is_on_job status
 * GET: Check status of all helpers
 * GET with ?reset=true: Reset all is_on_job to false AND re-notify for active broadcasts
 * POST: Reset all is_on_job to false
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const shouldReset = searchParams.get('reset') === 'true'
    let rebroadcastResult = null
    
    // If reset=true, do the reset first
    if (shouldReset) {
      const { data: resetData, error: resetError } = await supabase
        .from('helper_profiles')
        .update({ is_on_job: false })
        .eq('is_on_job', true)
        .select('id')
      
      if (resetError) {
        return NextResponse.json({ error: resetError.message }, { status: 500 })
      }
      
      console.log(`🔄 Reset ${resetData?.length || 0} helpers' is_on_job to false`)
      
      // Also re-notify helpers for any active broadcasting jobs
      const { data: activeJobs } = await supabase
        .from('service_requests')
        .select('id, customer_id, category_id, service_location_lat, service_location_lng, estimated_price, urgency_level, title, service_address')
        .eq('broadcast_status', 'broadcasting')
        .is('assigned_helper_id', null)
      
      if (activeJobs && activeJobs.length > 0) {
        console.log(`🔄 Found ${activeJobs.length} active broadcasting job(s), re-notifying helpers...`)
        
        // Get all approved helpers
        const { data: helpers } = await supabase
          .from('helper_profiles')
          .select(`
            id,
            user_id,
            service_radius_km,
            latitude,
            longitude,
            is_on_job,
            profiles:user_id(full_name)
          `)
          .eq('is_approved', true)
          .eq('verification_status', 'approved')
          .eq('is_on_job', false)
        
        let totalNotified = 0
        
        for (const job of activeJobs) {
          // Filter helpers by distance
          const nearbyHelpers = helpers?.filter(h => {
            if (!h.latitude || !h.longitude || !job.service_location_lat || !job.service_location_lng) return true // Include if no location
            const distance = calculateDistanceKm(job.service_location_lat, job.service_location_lng, h.latitude, h.longitude)
            return distance <= (h.service_radius_km || 15)
          }) || []
          
          // Delete existing notifications for this job (to avoid duplicates)
          await supabase
            .from('broadcast_notifications')
            .delete()
            .eq('request_id', job.id)
            .in('status', ['sent', 'pending'])
          
          // Create new broadcast notifications
          const notifications = nearbyHelpers.map(h => {
            const distance = (h.latitude && h.longitude && job.service_location_lat && job.service_location_lng)
              ? calculateDistanceKm(job.service_location_lat, job.service_location_lng, h.latitude, h.longitude)
              : 0
            return {
              request_id: job.id,
              helper_id: h.id,
              status: 'sent',
              distance_km: distance.toFixed(2),
              sent_at: new Date().toISOString()
            }
          })
          
          if (notifications.length > 0) {
            const { error: notifError } = await supabase
              .from('broadcast_notifications')
              .insert(notifications)
            
            if (!notifError) {
              totalNotified += notifications.length
              console.log(`✅ Notified ${notifications.length} helpers for job ${job.id}`)
            } else {
              console.error(`❌ Failed to notify helpers for job ${job.id}:`, notifError)
            }
          }
        }
        
        rebroadcastResult = {
          activeJobs: activeJobs.length,
          totalNotified
        }
      }
    }
    
    const { data: helpers, error } = await supabase
      .from('helper_profiles')
      .select(`
        id,
        user_id,
        is_on_job,
        is_online,
        is_available_now,
        is_approved,
        profiles:user_id(full_name)
      `)
      .eq('is_approved', true)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      didReset: shouldReset,
      message: shouldReset ? 'Reset completed - all helpers can now receive notifications!' : 'Add ?reset=true to reset all is_on_job flags',
      rebroadcast: rebroadcastResult,
      helpers: helpers?.map(h => ({
        id: h.id,
        name: (h.profiles as any)?.full_name || 'Unknown',
        is_on_job: h.is_on_job,
        is_online: h.is_online,
        is_available_now: h.is_available_now
      }))
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = createAdminClient()
    
    // Reset all helpers' is_on_job to false
    const { data, error } = await supabase
      .from('helper_profiles')
      .update({ is_on_job: false })
      .eq('is_on_job', true)
      .select('id')
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: `Reset ${data?.length || 0} helpers' is_on_job status to false`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
