import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const requestId = params.id

    console.log('📋 Fetching job details for:', requestId)

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('👤 User:', user.id)

    // Fetch the service request
    const { data: serviceRequest, error: requestError } = await supabase
      .from('service_requests')
      .select(`
        id,
        customer_id,
        title,
        description,
        status,
        broadcast_status,
        service_address,
        address_line1,
        estimated_price,
        payment_method,
        start_otp,
        end_otp,
        urgency_level,
        service_location_lat,
        service_location_lng,
        latitude,
        longitude,
        helper_location_lat,
        helper_location_lng,
        created_at,
        helper_accepted_at,
        work_started_at,
        work_completed_at,
        assigned_helper_id,
        category:category_id (name, icon)
      `)
      .eq('id', requestId)
      .single()

    if (requestError) {
      console.error('❌ Error fetching request:', requestError)
      return NextResponse.json({ error: 'Request not found', details: requestError.message }, { status: 404 })
    }

    // Verify the user is the customer or assigned helper
    const isCustomer = serviceRequest.customer_id === user.id
    
    // Check if user is the assigned helper (assigned_helper_id stores user.id from profiles table)
    const isHelper = serviceRequest.assigned_helper_id === user.id

    if (!isCustomer && !isHelper) {
      console.log('❌ Access denied. Customer:', serviceRequest.customer_id, 'Helper:', serviceRequest.assigned_helper_id, 'User:', user.id)
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Fetch assigned helper details if exists
    let assignedHelper = null
    if (serviceRequest.assigned_helper_id) {
      // assigned_helper_id is now user_id (from profiles), so look up helper profile by user_id
      const { data: helper } = await supabase
        .from('helper_profiles')
        .select(`
          id,
          user_id,
          avg_rating,
          total_jobs_completed
        `)
        .eq('user_id', serviceRequest.assigned_helper_id)
        .single()

      if (helper) {
        // Get profile info
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, avatar_url')
          .eq('id', helper.user_id)
          .single()

        assignedHelper = {
          ...helper,
          profile: profile || { full_name: 'Helper', phone: '', avatar_url: null }
        }
      }
    }

    // Fetch customer details
    let customer = null
    if (serviceRequest.customer_id) {
      const { data: customerProfile } = await supabase
        .from('profiles')
        .select('id, full_name, phone, avatar_url')
        .eq('id', serviceRequest.customer_id)
        .single()
      
      customer = customerProfile
    }

    // Build response
    const response = {
      ...serviceRequest,
      assigned_helper: assignedHelper,
      customer: customer,
      category: Array.isArray(serviceRequest.category) 
        ? serviceRequest.category[0] 
        : serviceRequest.category
    }

    console.log('✅ Job details fetched successfully')
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
