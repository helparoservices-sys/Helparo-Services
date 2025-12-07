import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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
      aiAnalysis,
      selectedTier,
      estimatedPrice,
      urgency,
      problemDuration,
      errorCode,
      preferredTime
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

    // Create the service request
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
        service_type_details: {
          ai_analysis: aiAnalysis,
          pricing_tier: selectedTier,
          problem_duration: problemDuration,
          error_code: errorCode,
          preferred_time: preferredTime
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

    // Find relevant helpers based on category/skills
    // Get helpers who have this category in their service_categories
    const { data: relevantHelpers, error: helpersError } = await supabase
      .from('helper_profiles')
      .select(`
        id,
        user_id,
        service_categories,
        skills,
        profiles!helper_profiles_user_id_fkey (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('is_approved', true)
      .eq('verification_status', 'approved')

    console.log(`📢 Found ${relevantHelpers?.length || 0} helpers, filtering for category: ${finalCategoryName}`)

    // Filter helpers who have this category (case-insensitive check)
    const filteredHelpers = relevantHelpers?.filter(helper => {
      const categories = helper.service_categories || []
      return categories.some((cat: string) => 
        cat.toLowerCase() === finalCategoryName.toLowerCase() ||
        cat.toLowerCase().includes(finalCategoryName.toLowerCase()) ||
        finalCategoryName.toLowerCase().includes(cat.toLowerCase())
      )
    }) || []

    console.log(`📢 ${filteredHelpers.length} helpers match category ${finalCategoryName}`)

    // Create notifications for all relevant helpers
    const notifications = []
    const customerName = customerProfile?.full_name || 'A customer'

    if (filteredHelpers.length > 0) {
      for (const helper of filteredHelpers) {
        notifications.push({
          user_id: helper.user_id,
          request_id: serviceRequest.id,
          channel: 'push',
          title: `🔔 New ${finalCategoryName} Job Available!`,
          body: `${customerName} needs help with ${finalCategoryName.toLowerCase()}. Estimated: ₹${estimatedPrice}. Tap to view and apply!`,
          data: {
            type: 'new_job_broadcast',
            request_id: serviceRequest.id,
            category: finalCategoryName,
            estimated_price: estimatedPrice,
            urgency: urgency,
            customer_name: customerName,
            address: address
          },
          status: 'queued'
        })
      }

      // Insert all notifications
      if (notifications.length > 0) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications)

        if (notifError) {
          console.error('Error creating notifications:', notifError)
        } else {
          console.log(`✅ Created ${notifications.length} notifications for helpers`)
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
