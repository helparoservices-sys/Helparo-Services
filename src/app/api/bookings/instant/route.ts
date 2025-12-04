import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * POST /api/bookings/instant
 * Create an instant booking with auto-assigned helper
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Validate user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      helper_id,
      category_id,
      description,
      service_address,
      city,
      state,
      pincode,
      location_lat,
      location_lng,
      price,
      duration_minutes,
    } = body

    // Validate required fields
    if (!helper_id || !category_id || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify helper has instant booking enabled
    const { data: helper, error: helperError } = await supabase
      .from('helper_profiles')
      .select('id, instant_booking_enabled, auto_accept_enabled')
      .eq('id', helper_id)
      .eq('instant_booking_enabled', true)
      .eq('is_approved', true)
      .single()

    if (helperError || !helper) {
      return NextResponse.json(
        { error: 'Helper not available for instant booking' },
        { status: 400 }
      )
    }

    // Create service request with instant booking type
    const { data: serviceRequest, error: requestError } = await supabase
      .from('service_requests')
      .insert({
        customer_id: session.user.id,
        category_id,
        title: `Instant Booking - ${new Date().toLocaleString()}`,
        description: description || 'Instant booking service',
        service_address,
        city,
        state,
        pincode,
        latitude: location_lat,
        longitude: location_lng,
        booking_type: 'instant',
        assigned_helper_id: helper_id,
        instant_booking_confirmed_at: helper.auto_accept_enabled ? new Date().toISOString() : null,
        status: helper.auto_accept_enabled ? 'assigned' : 'pending',
      })
      .select()
      .single()

    if (requestError || !serviceRequest) {
      console.error('Error creating service request:', requestError)
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    // If auto-accept is enabled, create assignment immediately
    if (helper.auto_accept_enabled) {
      const { error: assignmentError } = await supabase
        .from('service_assignments')
        .insert({
          request_id: serviceRequest.id,
          helper_id: helper_id,
          status: 'accepted',
          quoted_price: price,
          estimated_duration_minutes: duration_minutes,
        })

      if (assignmentError) {
        console.error('Error creating assignment:', assignmentError)
        // Continue anyway - manual intervention can fix this
      }
    }

    // TODO: Send notifications to helper

    return NextResponse.json({
      success: true,
      booking_id: serviceRequest.id,
      auto_confirmed: helper.auto_accept_enabled,
    })

  } catch (error) {
    console.error('Instant booking API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
