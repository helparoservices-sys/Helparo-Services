import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  console.log('🎯 Accept Job API called')
  
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { requestId, helperLat, helperLng } = body

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    // Verify the helper profile belongs to this user
    const { data: helperProfile } = await supabase
      .from('helper_profiles')
      .select('id, user_id, current_location_lat, current_location_lng, is_on_job')
      .eq('user_id', user.id)
      .single()

    if (!helperProfile) {
      console.log('❌ Helper profile not found for user:', user.id)
      return NextResponse.json({ error: 'Helper profile not found' }, { status: 404 })
    }

    // Do not allow a helper to accept a new job while already working
    if ((helperProfile as any).is_on_job === true) {
      return NextResponse.json(
        { error: 'You are currently on a job and cannot accept a new one.' },
        { status: 409 }
      )
    }

    // Use fresh location from client if provided, otherwise fall back to stored location
    const finalHelperLat = helperLat || helperProfile.current_location_lat || null
    const finalHelperLng = helperLng || helperProfile.current_location_lng || null
    
    console.log('✅ Helper profile:', helperProfile.id, 'Location (fresh/stored):', finalHelperLat, finalHelperLng)

    // Check if the request is still open for acceptance
    const { data: serviceRequest, error: requestError } = await supabase
      .from('service_requests')
      .select('id, status, broadcast_status, assigned_helper_id, customer_id')
      .eq('id', requestId)
      .single()

    console.log('📋 Service request lookup:', { serviceRequest, requestError })

    if (requestError || !serviceRequest) {
      console.log('❌ Request not found:', requestId, requestError)
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Check if already accepted by someone else
    if (serviceRequest.assigned_helper_id) {
      console.log('❌ Job already assigned to:', serviceRequest.assigned_helper_id)
      return NextResponse.json(
        { error: 'This job has already been accepted by another helper' },
        { status: 409 }
      )
    }

    // Check if request is still in broadcasting status
    if (serviceRequest.broadcast_status !== 'broadcasting') {
      console.log('❌ Job not in broadcasting status:', serviceRequest.broadcast_status)
      return NextResponse.json(
        { error: 'This job is no longer available' },
        { status: 409 }
      )
    }

    console.log('✅ Request is available, accepting...')

    // Accept the job - Use user.id (not helper_profiles.id) because foreign key references profiles(id)
    // The assigned_helper_id foreign key points to profiles.id which is the auth user id
    console.log('📝 Assigning to user.id:', user.id, '(helper_profile.id:', helperProfile.id, ')')
    console.log('📍 Setting helper location:', finalHelperLat, finalHelperLng)
    
    const { data: updatedRequest, error: updateError } = await supabase
      .from('service_requests')
      .update({
        assigned_helper_id: user.id, // Use auth user id, not helper_profiles.id
        status: 'assigned',
        broadcast_status: 'accepted',
        helper_accepted_at: new Date().toISOString(),
        // Use fresh location from client, or stored location as fallback
        helper_location_lat: finalHelperLat,
        helper_location_lng: finalHelperLng,
        helper_location_updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()

    console.log('📝 Update result:', { updatedRequest, updateError })

    if (updateError) {
      console.error('❌ Update failed:', updateError)
      return NextResponse.json(
        { error: 'Failed to accept job: ' + updateError.message },
        { status: 500 }
      )
    }

    if (!updatedRequest) {
      return NextResponse.json(
        { error: 'Job not found after update' },
        { status: 404 }
      )
    }

    // Update broadcast_notifications status for this helper
    await supabase
      .from('broadcast_notifications')
      .update({ 
        status: 'accepted',
        responded_at: new Date().toISOString()
      })
      .eq('request_id', requestId)
      .eq('helper_id', helperProfile.id)

    // Mark other helpers' notifications as expired
    await supabase
      .from('broadcast_notifications')
      .update({ status: 'expired' })
      .eq('request_id', requestId)
      .neq('helper_id', helperProfile.id)

    // Set helper as on_job
    await supabase
      .from('helper_profiles')
      .update({ is_on_job: true })
      .eq('id', helperProfile.id)

    // Get customer and helper details for contact sharing
    const { data: customerProfile } = await supabase
      .from('profiles')
      .select('full_name, phone, email')
      .eq('id', serviceRequest.customer_id)
      .single()

    const { data: helperUserProfile } = await supabase
      .from('profiles')
      .select('full_name, phone, email')
      .eq('id', user.id)
      .single()

    // Notify the customer that a helper accepted
    await supabase
      .from('notifications')
      .insert({
        user_id: serviceRequest.customer_id,
        request_id: requestId,
        channel: 'push',
        title: '🎉 Helper Found!',
        body: `${helperUserProfile?.full_name || 'A helper'} has accepted your request and is on the way!`,
        data: {
          type: 'helper_accepted',
          request_id: requestId,
          helper_name: helperUserProfile?.full_name,
          helper_phone: helperUserProfile?.phone
        },
        status: 'queued'
      })

    // SEND ACTUAL FCM PUSH TO CUSTOMER - so they see update instantly without polling
    const { data: customerTokens } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', serviceRequest.customer_id)
      .eq('is_active', true)

    if (customerTokens && customerTokens.length > 0) {
      const tokens = customerTokens.map(t => t.token)
      await sendPushNotification(tokens, {
        title: '🎉 Helper Found!',
        body: `${helperUserProfile?.full_name || 'A helper'} has accepted your request!`,
        data: {
          type: 'helper_accepted',
          request_id: requestId,
          click_action: `/customer/requests/${requestId}/track`
        }
      })
      console.log('📱 FCM sent to customer:', tokens.length, 'devices')
    }

    // Also notify the helper so their dashboard subscription triggers
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        request_id: requestId,
        channel: 'push',
        title: '✅ Job Accepted',
        body: `You have successfully accepted the job: ${customerProfile?.full_name || 'Customer'}'s request`,
        data: {
          type: 'job_accepted_by_me',
          request_id: requestId,
          customer_name: customerProfile?.full_name,
          customer_phone: customerProfile?.phone
        },
        status: 'read' // Already shown toast, mark as read
      })

    return NextResponse.json({
      success: true,
      message: 'Job accepted successfully!',
      requestId: requestId,
      customer: {
        name: customerProfile?.full_name,
        phone: customerProfile?.phone
      },
      helper: {
        name: helperUserProfile?.full_name,
        phone: helperUserProfile?.phone
      }
    })

  } catch (error) {
    console.error('❌ Accept Job API Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to accept job' },
      { status: 500 }
    )
  }
}
