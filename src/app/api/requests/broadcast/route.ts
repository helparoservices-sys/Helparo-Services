import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadBase64ToFirebaseAdmin } from '@/lib/firebase-admin'

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Timeout wrapper for async operations
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), ms)
    )
  ])
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
  console.log('🚀 Broadcast API called at:', new Date().toISOString())
  
  try {
    console.log('📌 Creating Supabase client...')
    const supabase = await createClient()
    
    // Check authentication
    console.log('📌 Checking authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.log('❌ Auth failed:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ User authenticated:', user.id)

    // Get customer profile
    console.log('📌 Fetching customer profile...')
    const { data: customerProfile } = await supabase
      .from('profiles')
      .select('full_name, phone, email')
      .eq('id', user.id)
      .single()
    console.log('✅ Profile fetched')

    console.log('📌 Parsing request body...')
    const body = await request.json()
    console.log('✅ Body parsed, category:', body.categoryId, 'price:', body.estimatedPrice)
    
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
      estimatedDuration,
      confidence,
      urgency,
      problemDuration,
      errorCode,
      preferredTime,
      paymentMethod = 'cash', // Default to cash like Rapido
      // AI estimation details for helper
      helperBrings,
      customerProvides,
      workOverview,
      materialsNeeded
    } = body

    // Map category to service_categories id (or use the slug)
    const categoryMapping: Record<string, string> = {
      // New catalog
      'home-services': 'Home Services',
      'cleaning-services': 'Cleaning Services',
      'beauty-wellness': 'Beauty & Wellness',
      'car-services': 'Car Services',
      'pest-control': 'Pest Control',
      'moving-packing': 'Moving & Packing',
      'tutoring-training': 'Tutoring & Training',
      'event-services': 'Event Services',
      'gardening-landscaping': 'Gardening & Landscaping',
      'pet-care': 'Pet Care',
      'computer-it-services': 'Computer & IT Services',
      'laundry-services': 'Laundry Services',

      // Legacy slugs for backward compatibility
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

    // =====================================================
    // PHASE 1: DUAL WRITE - Upload images to Firebase Storage
    // NEW jobs → Firebase URLs stored (reduce Supabase egress)
    // Fallback → base64 if Firebase fails (backward compatible)
    // OPTIMIZATION: Skip Firebase upload to speed up posting - use base64 directly
    // =====================================================
    let finalImages: string[] = []
    
    if (images && Array.isArray(images) && images.length > 0) {
      console.log(`📸 [PHASE-1] Images received: ${images.length}, storing as-is for speed`)
      // Store images as-is (base64 or URL) - Firebase upload would slow down posting
      finalImages = images
    } else {
      console.log('ℹ️ [PHASE-1] No images provided for this job')
    }

    // Create the service request with OTPs
    console.log('📌 Creating service request...')
    console.log('📌 Input data:', { 
      categoryId: finalCategoryId, 
      lat: locationLat, 
      lng: locationLng,
      price: estimatedPrice,
      imagesCount: finalImages?.length || 0
    })
    const startOtp = generateOTP()
    const endOtp = generateOTP()
    
    // Ensure lat/lng are numbers or null
    const safeLat = typeof locationLat === 'number' ? locationLat : null
    const safeLng = typeof locationLng === 'number' ? locationLng : null
    
    const { data: serviceRequest, error: requestError } = await supabase
      .from('service_requests')
      .insert({
        customer_id: user.id,
        category_id: finalCategoryId,
        title: `${finalCategoryName} Service Required`,
        description: description || '',
        address_line1: address || '',
        address_line2: `${flatNumber || ''} ${floor ? ', Floor: ' + floor : ''}`.trim() || null,
        landmark: landmark || null,
        latitude: safeLat,
        longitude: safeLng,
        service_location_lat: safeLat,
        service_location_lng: safeLng,
        service_address: `${flatNumber || ''}, ${address || 'Not specified'}`.trim(),
        images: finalImages || [],
        estimated_price: estimatedPrice || 0,
        urgency_level: urgency === 'emergency' ? 'urgent' : 'normal',
        status: 'open',
        broadcast_status: 'broadcasting',
        payment_method: paymentMethod || 'cash',
        start_otp: startOtp,
        end_otp: endOtp,
        broadcast_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        service_type_details: {
          ai_analysis: aiAnalysis || null,
          pricing_tier: selectedTier || null,
          problem_duration: problemDuration || null,
          error_code: errorCode || null,
          preferred_time: preferredTime || null,
          videos: videos || [],
          estimated_duration: estimatedDuration || null,
          confidence: confidence || null,
          helper_brings: helperBrings || [],
          customer_provides: customerProvides || [],
          work_overview: workOverview || '',
          materials_needed: materialsNeeded || []
        }
      })
      .select()
      .single()

    if (requestError) {
      console.error('❌ Error creating service request:', requestError)
      console.error('❌ Error details:', JSON.stringify(requestError, null, 2))
      return NextResponse.json(
        { error: `Failed to create service request: ${requestError.message}` },
        { status: 500 }
      )
    }
    console.log('✅ Service request created:', serviceRequest.id)

    // Run notification task with timeout (Vercel free tier = 10s limit)
    // Must complete before returning, fire-and-forget doesn't work on serverless
    const requestId = serviceRequest.id
    
    let helpersNotified = 0
    try {
      // Run with 8s timeout to stay within Vercel's 10s limit
      helpersNotified = await Promise.race([
        processBackgroundTasks(
          supabase,
          requestId,
          user.id,
          finalCategoryId,
          finalCategoryName,
          estimatedPrice || 0,
          urgency,
          address || '',
          safeLat || 0,
          safeLng || 0,
          description || '',
          customerProfile?.full_name || 'A customer',
          finalImages
        ),
        new Promise<number>((_, reject) => 
          setTimeout(() => reject(new Error('Notification timeout')), 8000)
        )
      ])
      console.log(`✅ Notifications sent to ${helpersNotified} helpers`)
    } catch (err: any) {
      console.log('⚠️ Notification task:', err.message, '- job created, helpers may not be notified')
      // Don't fail the request - job is created, notifications might just be slow
    }

    console.log('🎉 Returning success')
    return NextResponse.json({
      success: true,
      message: 'Request created! Finding helpers...',
      requestId: requestId,
      helpersNotified: helpersNotified
    })

  } catch (error: any) {
    console.error('❌ Broadcast API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to broadcast request' },
      { status: 500 }
    )
  }
}

/**
 * Background task processor - finds helpers and sends notifications
 * Returns number of helpers notified
 */
async function processBackgroundTasks(
  supabase: any,
  requestId: string,
  userId: string,
  categoryId: string,
  categoryName: string,
  estimatedPrice: number,
  urgency: string,
  address: string,
  locationLat: number,
  locationLng: number,
  description: string,
  customerName: string,
  images: string[]
): Promise<number> {
  console.log('🔄 Background tasks starting for request:', requestId)
  
  try {
    // 1. Upload images to Firebase (non-blocking, improves future reads)
    if (images && images.length > 0) {
      uploadImagesToFirebase(supabase, requestId, userId, images)
    }

    // 2. Find relevant helpers
    const { data: relevantHelpers } = await supabase
      .from('helper_profiles')
      .select(`
        id,
        user_id,
        service_categories,
        service_radius_km,
        latitude,
        longitude,
        is_online,
        is_on_job,
        profiles!helper_profiles_user_id_fkey (
          id,
          full_name
        )
      `)
      .eq('is_approved', true)
      .eq('verification_status', 'approved')
      .eq('is_online', true)
      .eq('is_on_job', false)

    if (!relevantHelpers || relevantHelpers.length === 0) {
      console.log('⚠️ No online helpers found')
      return 0
    }
    
    console.log(`✅ Found ${relevantHelpers.length} online helpers`)
    relevantHelpers.forEach((h: any) => {
      console.log(`  - Helper ${h.id}: user_id=${h.user_id}, location=${h.latitude},${h.longitude}, categories=${JSON.stringify(h.service_categories)}`)
    })

    // Get category slug for matching
    const { data: categoryInfo } = await supabase
      .from('service_categories')
      .select('slug, parent_id, name')
      .eq('id', categoryId)
      .single()

    const categorySlug = categoryInfo?.slug || ''
    const categoryNameFromDb = categoryInfo?.name || categoryName
    const NOTIFICATION_RADIUS_KM = 15

    console.log('🔍 Looking for helpers matching:', {
      categoryId,
      categorySlug,
      categoryName: categoryNameFromDb,
      location: { lat: locationLat, lng: locationLng }
    })

    // Filter helpers by distance and category
    const filteredHelpers = relevantHelpers.filter((helper: any) => {
      // Check distance
      if (locationLat && locationLng && helper.latitude && helper.longitude) {
        const distance = calculateDistanceKm(locationLat, locationLng, helper.latitude, helper.longitude)
        const maxRadius = helper.service_radius_km || NOTIFICATION_RADIUS_KM
        if (distance > maxRadius) {
          console.log(`❌ Helper ${helper.id} too far: ${distance.toFixed(1)}km > ${maxRadius}km`)
          return false
        }
        (helper as any).distance_km = distance
      } else {
        console.log(`❌ Helper ${helper.id} missing location data`)
        return false // Skip helpers without location
      }

      // Check category match - be more flexible
      const categories = helper.service_categories || []
      if (categories.length === 0) {
        console.log(`❌ Helper ${helper.id} has no service categories`)
        return false
      }
      
      // More flexible category matching
      const categoryMatch = categories.some((cat: string) => {
        if (!cat) return false
        const catLower = cat.toLowerCase().trim()
        const slugLower = (categorySlug || '').toLowerCase().trim()
        const nameLower = (categoryNameFromDb || '').toLowerCase().trim()
        
        // Match by: exact ID, slug, name contains, or common keywords
        const matches = cat === categoryId || 
               catLower === slugLower ||
               catLower.includes(slugLower) ||
               slugLower.includes(catLower) ||
               nameLower.includes(catLower) ||
               catLower.includes(nameLower.split(' ')[0]) // First word match
               
        if (matches) {
          console.log(`✅ Category match: helper has "${cat}", looking for "${categoryNameFromDb}"`)
        }
        return matches
      })
      
      if (!categoryMatch) {
        console.log(`❌ Helper ${helper.id} categories don't match:`, categories, 'vs', categoryNameFromDb)
      }
      
      return categoryMatch
    })

    console.log(`📢 Found ${filteredHelpers.length} matching helpers out of ${relevantHelpers.length} online`)

    // FALLBACK: If no category matches, notify nearest online helpers anyway
    // This ensures jobs always get visibility during testing/launch phase
    let helpersToNotify = filteredHelpers
    if (filteredHelpers.length === 0 && relevantHelpers.length > 0) {
      console.log('⚠️ No category matches, falling back to nearest helpers')
      // Sort by distance and take closest 5
      helpersToNotify = relevantHelpers
        .filter((h: any) => h.latitude && h.longitude && locationLat && locationLng)
        .map((h: any) => ({
          ...h,
          distance_km: calculateDistanceKm(locationLat, locationLng, h.latitude, h.longitude)
        }))
        .filter((h: any) => h.distance_km <= 25) // Within 25km
        .sort((a: any, b: any) => a.distance_km - b.distance_km)
        .slice(0, 5)
      console.log(`📢 Fallback: notifying ${helpersToNotify.length} nearest helpers`)
    }

    if (helpersToNotify.length === 0) {
      console.log('⚠️ No helpers available to notify')
      return 0
    }

    // 3. Create notifications (batch insert)
    const broadcastNotifications = helpersToNotify.map((helper: any) => ({
      request_id: requestId,
      helper_id: helper.id,
      status: 'sent',
      distance_km: ((helper as any).distance_km || 0).toFixed(2),
      sent_at: new Date().toISOString()
    }))

    const notifications = helpersToNotify.map((helper: any) => ({
      user_id: helper.user_id,
      request_id: requestId,
      channel: 'push',
      title: `🔔 New ${categoryNameFromDb} Job!`,
      body: `${customerName} needs help! ₹${estimatedPrice}`,
      data: { type: 'new_job_broadcast', request_id: requestId },
      status: 'queued'
    }))

    // Insert all notifications
    await Promise.all([
      supabase.from('broadcast_notifications').insert(broadcastNotifications),
      supabase.from('notifications').insert(notifications),
      supabase.from('notifications').insert({
        user_id: userId,
        request_id: requestId,
        channel: 'push',
        title: '✅ Request Posted!',
        body: `Notified ${helpersToNotify.length} helpers nearby`,
        data: { type: 'request_broadcasted', helpers_notified: helpersToNotify.length },
        status: 'queued'
      })
    ])

    // 4. Send FCM push notifications
    const helperUserIds = helpersToNotify.map((h: any) => h.user_id).filter(Boolean)
    if (helperUserIds.length > 0) {
      console.log(`📱 Sending FCM to ${helperUserIds.length} helpers:`, helperUserIds)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://helparo.in'
      
      // IMPORTANT: Await the FCM call to ensure it completes before function ends
      try {
        await fetch(`${baseUrl}/api/push/job-alert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            helperUserIds,
            jobId: requestId,
            title: `New ${categoryNameFromDb} Job!`,
            description,
            price: estimatedPrice,
            location: address,
            customerName,
            urgency: urgency || 'urgent',
            expiresInSeconds: 30
          })
        })
        console.log('✅ FCM request sent')
      } catch (err) {
        console.error('FCM error:', err)
      }
    } else {
      console.log('⚠️ No helper user IDs to send FCM to')
    }

    console.log('✅ Background tasks completed')
    return helpersToNotify.length
  } catch (error) {
    console.error('❌ Background task error:', error)
    return 0
  }
}

/**
 * Upload images to Firebase Storage in background
 * Updates the service request with Firebase URLs
 */
async function uploadImagesToFirebase(
  supabase: any,
  requestId: string,
  userId: string,
  images: string[]
) {
  try {
    const firebaseUrls: string[] = []
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      
      // Skip if already a URL
      if (image.startsWith('https://') || image.startsWith('http://')) {
        firebaseUrls.push(image)
        continue
      }
      
      // Upload base64 to Firebase
      if (image.startsWith('data:image')) {
        try {
          const timestamp = Date.now()
          const randomId = Math.random().toString(36).substring(2, 9)
          const path = `service-requests/${userId}/${timestamp}-${randomId}-${i}.jpg`
          
          const firebaseUrl = await uploadBase64ToFirebaseAdmin(image, path)
          firebaseUrls.push(firebaseUrl)
          console.log(`✅ Image ${i + 1} uploaded to Firebase`)
        } catch (err) {
          console.error(`❌ Firebase upload failed for image ${i + 1}:`, err)
          firebaseUrls.push(image) // Keep base64 as fallback
        }
      } else {
        firebaseUrls.push(image)
      }
    }

    // Update service request with Firebase URLs
    if (firebaseUrls.some(url => url.startsWith('https://storage.googleapis.com'))) {
      await supabase
        .from('service_requests')
        .update({ images: firebaseUrls })
        .eq('id', requestId)
      console.log('✅ Updated request with Firebase URLs')
    }
  } catch (error) {
    console.error('❌ Firebase upload process error:', error)
  }
}
