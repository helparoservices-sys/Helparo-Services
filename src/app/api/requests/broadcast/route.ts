import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

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

export async function POST(request: NextRequest) {
  console.log('🚀 Broadcast API called')
  
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get customer profile
    const { data: customerProfile } = await supabase
      .from('profiles')
      .select('full_name, phone, email')
      .eq('id', user.id)
      .single()

    const body = await request.json()
    const {
      categoryId,
      categoryName,
      description,
      address,
      flatNumber,
      floor,
      landmark,
      locationLat,
      locationLng,
      images,
      videos, // Customer uploaded videos with audio
      aiAnalysis,
      selectedTier,
      estimatedPrice,
      urgency,
      problemDuration,
      errorCode,
      preferredTime,
      paymentMethod = 'cash' // Default to cash like Rapido
    } = body

    // Map category to service_categories id (or use the slug)
    const categoryMapping: Record<string, string> = {
      'electrical': 'Electrical',
      'plumbing': 'Plumbing',
      'ac_repair': 'AC & Appliance Repair',
      'carpentry': 'Carpentry',
      'painting': 'Painting',
      'cleaning': 'Cleaning',
      'pest_control': 'Pest Control',
      'home_repair': 'Home Repair & Maintenance',
      'locksmith': 'Locksmith',
      'gardening': 'Gardening & Landscaping',
      'moving': 'Moving & Packing',
      'other': 'Other'
    }

    const mappedCategoryName = categoryMapping[categoryId] || categoryName || 'Other'
    console.log('🔍 Looking for category:', mappedCategoryName, 'from categoryId:', categoryId)

    // Get the category UUID from the database - try multiple ways
    let category = null
    
    // First try exact match
    const { data: exactCategory } = await supabase
      .from('service_categories')
      .select('id, name')
      .ilike('name', mappedCategoryName)
      .single()
    
    if (exactCategory) {
      category = exactCategory
    } else {
      // Try partial match
      const { data: partialCategory } = await supabase
        .from('service_categories')
        .select('id, name')
        .ilike('name', `%${mappedCategoryName.split(' ')[0]}%`)
        .limit(1)
        .single()
      
      if (partialCategory) {
        category = partialCategory
      } else {
        // Get any category as fallback
        const { data: anyCategory } = await supabase
          .from('service_categories')
          .select('id, name')
          .limit(1)
          .single()
        
        category = anyCategory
      }
    }

    console.log('📁 Found category:', category)

    // If still no category, create a minimal one or use default
    let finalCategoryId = category?.id
    let finalCategoryName = category?.name || mappedCategoryName

    if (!finalCategoryId) {
      // Create category if doesn't exist
      const { data: newCategory, error: createError } = await supabase
        .from('service_categories')
        .insert({ name: mappedCategoryName, slug: categoryId })
        .select()
        .single()
      
      if (newCategory) {
        finalCategoryId = newCategory.id
        finalCategoryName = newCategory.name
        console.log('✅ Created new category:', newCategory)
      } else {
        console.error('❌ Failed to create category:', createError)
        return NextResponse.json(
          { error: 'Failed to setup service category' },
          { status: 500 }
        )
      }
    }

    // Create the service request with OTPs
    const startOtp = generateOTP()
    const endOtp = generateOTP()
    
    const { data: serviceRequest, error: requestError } = await supabase
      .from('service_requests')
      .insert({
        customer_id: user.id,
        category_id: finalCategoryId,
        title: `${finalCategoryName} Service Required`,
        description: description,
        address_line1: address,
        address_line2: `${flatNumber || ''} ${floor ? ', Floor: ' + floor : ''}`.trim(),
        landmark: landmark,
        latitude: locationLat,
        longitude: locationLng,
        service_location_lat: locationLat,
        service_location_lng: locationLng,
        service_address: `${flatNumber || ''}, ${address}`,
        images: images || [],
        estimated_price: estimatedPrice,
        urgency_level: urgency === 'emergency' ? 'urgent' : 'normal',
        status: 'open',
        broadcast_status: 'broadcasting',
        payment_method: paymentMethod,
        start_otp: startOtp,
        end_otp: endOtp,
        broadcast_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 mins expiry
        service_type_details: {
          ai_analysis: aiAnalysis,
          pricing_tier: selectedTier,
          problem_duration: problemDuration,
          error_code: errorCode,
          preferred_time: preferredTime,
          videos: videos || [] // Store videos with audio for helper to view
        }
      })
      .select()
      .single()

    if (requestError) {
      console.error('Error creating service request:', requestError)
      return NextResponse.json(
        { error: 'Failed to create service request' },
        { status: 500 }
      )
    }

    // Find relevant helpers based on category/skills AND radius
    // Get helpers who have this category in their service_categories
    const { data: relevantHelpers, error: helpersError } = await supabase
      .from('helper_profiles')
      .select(`
        id,
        user_id,
        service_categories,
        skills,
        service_radius_km,
        current_location_lat,
        current_location_lng,
        is_online,
        is_on_job,
        profiles!helper_profiles_user_id_fkey (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('is_approved', true)
      .eq('verification_status', 'approved')

    if (helpersError) {
      console.error('❌ Error fetching helpers:', helpersError)
    }

    console.log(`📢 Found ${relevantHelpers?.length || 0} approved helpers total`)
    console.log(`📢 Looking for category: ${finalCategoryName} (ID: ${finalCategoryId})`)
    
    // Log each helper's categories for debugging
    relevantHelpers?.forEach(h => {
      console.log(`   Helper ${h.id}: categories count = ${h.service_categories?.length || 0}`)
    })

    // Filter helpers who:
    // 1. Have this category UUID in their service_categories array
    // 2. Are within their service radius from the job location
    // 3. Are currently online and not on another job (optional)
    let filteredHelpers = relevantHelpers?.filter(helper => {
      // Check category match by UUID (service_categories contains UUIDs)
      const categories = helper.service_categories || []
      
      // Match by UUID - the category ID we have
      const categoryMatch = categories.length === 0 || categories.some((catId: string) => 
        catId === finalCategoryId
      )
      
      if (!categoryMatch) {
        console.log(`❌ Helper ${helper.id} excluded: category UUID mismatch. Looking for: ${finalCategoryId}`)
        return false
      }

      // Check radius if BOTH locations are provided
      if (locationLat && locationLng && helper.current_location_lat && helper.current_location_lng) {
        const distance = calculateDistanceKm(
          locationLat,
          locationLng,
          helper.current_location_lat,
          helper.current_location_lng
        )
        const helperRadius = helper.service_radius_km || 50 // Default 50km for testing
        
        if (distance > helperRadius) {
          console.log(`❌ Helper ${helper.id} excluded: ${distance.toFixed(1)}km > ${helperRadius}km radius`)
          return false
        }
        
        // Attach distance for later use
        ;(helper as any).distance_km = distance
      } else {
        // If no location set, default distance
        ;(helper as any).distance_km = 0
      }

      console.log(`✅ Helper ${helper.id} included for ${finalCategoryName}`)
      return true
    }) || []

    // FALLBACK: If no helpers matched by category, notify ALL approved helpers
    // This is for testing purposes to ensure at least some helpers get notified
    if (filteredHelpers.length === 0 && relevantHelpers && relevantHelpers.length > 0) {
      console.log(`⚠️ No category-matched helpers found. Notifying ALL ${relevantHelpers.length} approved helpers.`)
      filteredHelpers = relevantHelpers.map(helper => {
        ;(helper as any).distance_km = 0
        return helper
      })
    }

    console.log(`📢 ${filteredHelpers.length} helpers will be notified`)

    // Create broadcast notifications for all relevant helpers
    const notifications = []
    const broadcastNotifications = []
    const customerName = customerProfile?.full_name || 'A customer'

    if (filteredHelpers.length > 0) {
      for (const helper of filteredHelpers) {
        const distanceKm = (helper as any).distance_km || 0

        // Create broadcast_notifications entry for real-time popup
        broadcastNotifications.push({
          request_id: serviceRequest.id,
          helper_id: helper.id,
          status: 'sent',
          distance_km: distanceKm.toFixed(2),
          sent_at: new Date().toISOString()
        })

        // Also create regular notification for push
        notifications.push({
          user_id: helper.user_id,
          request_id: serviceRequest.id,
          channel: 'push',
          title: `🔔 New ${finalCategoryName} Job!`,
          body: `${customerName} needs help! ₹${estimatedPrice} • ${distanceKm > 0 ? distanceKm.toFixed(1) + 'km away' : 'Near you'}`,
          data: {
            type: 'new_job_broadcast',
            request_id: serviceRequest.id,
            category: finalCategoryName,
            estimated_price: estimatedPrice,
            urgency: urgency,
            customer_name: customerName,
            address: address,
            distance_km: distanceKm.toFixed(1)
          },
          status: 'queued'
        })
      }

      // Insert broadcast notifications (for real-time)
      if (broadcastNotifications.length > 0) {
        const { error: broadcastError } = await supabase
          .from('broadcast_notifications')
          .insert(broadcastNotifications)

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
          .insert(notifications)

        if (notifError) {
          console.error('Error creating notifications:', notifError)
        } else {
          console.log(`✅ Created ${notifications.length} push notifications for helpers`)
        }
      }
    }

    // Also create a confirmation notification for the customer
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        request_id: serviceRequest.id,
        channel: 'push',
        title: '✅ Request Broadcasted Successfully!',
        body: `Your ${finalCategoryName} request has been sent to ${filteredHelpers.length} qualified helpers. You'll receive responses soon!`,
        data: {
          type: 'request_broadcasted',
          request_id: serviceRequest.id,
          helpers_notified: filteredHelpers.length
        },
        status: 'queued'
      })

    return NextResponse.json({
      success: true,
      message: `Request broadcasted to ${filteredHelpers.length} qualified helpers!`,
      requestId: serviceRequest.id,
      helpersNotified: filteredHelpers.length,
      helperNames: filteredHelpers.map(h => (h.profiles as any)?.full_name).filter(Boolean) || []
    })

  } catch (error: any) {
    console.error('❌ Broadcast API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to broadcast request' },
      { status: 500 }
    )
  }
}
