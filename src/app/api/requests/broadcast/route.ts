import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadBase64ToFirebaseAdmin } from '@/lib/firebase-admin'

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
    // =====================================================
    let finalImages: string[] = []
    let firebaseUploadAttempted = false
    let firebaseConfigError: string | null = null
    
    if (images && Array.isArray(images) && images.length > 0) {
      console.log(`📸 [PHASE-1] Images received: ${images.length}`)
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        console.log(`📤 [PHASE-1] Uploading image ${i + 1}/${images.length}`)
        
        // Already a URL - keep as-is (safety check)
        if (image.startsWith('https://') || image.startsWith('http://')) {
          console.log(`⏭️ [PHASE-1] Image ${i + 1} is already a URL, skipping upload`)
          finalImages.push(image)
          continue
        }
        
        // Base64 image - upload to Firebase
        if (image.startsWith('data:image')) {
          firebaseUploadAttempted = true
          try {
            const timestamp = Date.now()
            const randomId = Math.random().toString(36).substring(2, 9)
            const path = `service-requests/${user.id}/${timestamp}-${randomId}-${i}.jpg`
            
            // Upload to Firebase Storage using Admin SDK - WILL THROW if misconfigured
            const firebaseUrl = await uploadBase64ToFirebaseAdmin(image, path)
            
            console.log(`✅ [PHASE-1] Firebase upload success: ${firebaseUrl.substring(0, 60)}...`)
            finalImages.push(firebaseUrl)
            
          } catch (uploadError: any) {
            // Capture configuration error for warning
            if (uploadError.message.includes('initialization failed')) {
              firebaseConfigError = uploadError.message
              console.error(`🚨 [PHASE-1] FIREBASE ADMIN NOT CONFIGURED:`, uploadError.message)
              console.error(`🚨 [PHASE-1] Add credentials to Vercel: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY`)
            }
            
            // FALLBACK: Store base64 if Firebase fails (backward compatible)
            console.error(`❌ [PHASE-1] Firebase upload failed, fallback to base64:`, uploadError.message)
            finalImages.push(image)
          }
        } else {
          // Unknown format - keep as-is
          console.log(`⚠️ [PHASE-1] Image ${i + 1} has unknown format, keeping as-is`)
          finalImages.push(image)
        }
      }
      
      const urlCount = finalImages.filter(img => img.startsWith('https://')).length
      const b64Count = finalImages.filter(img => img.startsWith('data:')).length
      console.log(`✅ [PHASE-1] Complete: ${urlCount} Firebase URLs, ${b64Count} base64 fallbacks`)
      
      // Log warning if Firebase was attempted but not configured
      if (firebaseUploadAttempted && urlCount === 0 && firebaseConfigError) {
        console.error(`🚨 [PHASE-1] WARNING: All images fell back to base64 due to Firebase misconfiguration`)
        console.error(`🚨 [PHASE-1] This will cause HIGH Supabase egress costs`)
        console.error(`🚨 [PHASE-1] Visit /api/debug/firebase-health to diagnose`)
      }
    } else {
      console.log('ℹ️ [PHASE-1] No images provided for this job')
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
        images: finalImages, // PHASE-1: Firebase URLs or base64 fallback
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
          videos: videos || [], // Store videos with audio for helper to view
          // AI estimation details for helper to view
          estimated_duration: estimatedDuration,
          confidence: confidence,
          helper_brings: helperBrings || [],
          customer_provides: customerProvides || [],
          work_overview: workOverview || '',
          materials_needed: materialsNeeded || []
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
    // NOTE: helper_profiles uses 'latitude'/'longitude' for predefined service location, NOT 'service_location_lat/lng'
    const { data: relevantHelpers, error: helpersError } = await supabase
      .from('helper_profiles')
      .select(`
        id,
        user_id,
        service_categories,
        skills,
        service_radius_km,
        latitude,
        longitude,
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

    const onlineHelpers = relevantHelpers?.filter(h => h.is_online) || []
    const offlineHelpers = relevantHelpers?.filter(h => !h.is_online) || []
    
    console.log(`📢 Found ${relevantHelpers?.length || 0} approved helpers total`)
    console.log(`📢 Online: ${onlineHelpers.length}, Offline: ${offlineHelpers.length}`)
    console.log(`📢 Looking for category: ${finalCategoryName} (ID: ${finalCategoryId})`)
    
    // Get the category slug for matching helpers who stored slugs instead of UUIDs
    const { data: categoryInfo } = await supabase
      .from('service_categories')
      .select('id, name, slug, parent_id')
      .eq('id', finalCategoryId)
      .single()
    
    const categorySlug = categoryInfo?.slug || ''
    const categoryParentId = categoryInfo?.parent_id || null
    
    console.log(`📢 Category slug: ${categorySlug}, parent: ${categoryParentId}`)
    
    // Log each helper's categories for debugging
    relevantHelpers?.forEach(h => {
      console.log(`   Helper ${h.id}: categories count = ${h.service_categories?.length || 0}`)
    })

    // Filter helpers who are within the search radius AND match the category
    // Only notify helpers who can actually do this type of work
    const NOTIFICATION_RADIUS_KM = 15 // Use predefined service location radius for matching
    
    // Get list of helpers who actually have active assigned jobs (not just is_on_job flag)
    // This helps recover from stuck states where is_on_job flag wasn't reset properly
    const { data: activeAssignments } = await supabase
      .from('service_requests')
      .select('assigned_helper_id')
      .in('status', ['assigned', 'in_progress'])
      .not('assigned_helper_id', 'is', null)
    
    const busyHelperUserIds = new Set((activeAssignments || []).map(a => a.assigned_helper_id))
    
    let filteredHelpers = relevantHelpers?.filter(helper => {
      // FIRST CHECK: Helper must be ONLINE to receive job notifications
      if (!helper.is_online) {
        console.log(`❌ Helper ${helper.id} excluded: is_online=false (helper is offline)`)
        return false
      }
      
      // Check if helper ACTUALLY has an active job (more reliable than is_on_job flag)
      const actuallyBusy = busyHelperUserIds.has(helper.user_id)
      
      if (actuallyBusy) {
        console.log(`❌ Helper ${helper.id} excluded: actually has an active assigned job`)
        return false
      }
      
      // If is_on_job flag says busy but no actual job, auto-fix the flag and include them
      if (helper.is_on_job && !actuallyBusy) {
        console.log(`⚠️ Helper ${helper.id}: is_on_job=true but no actual job found. Including and auto-fixing flag.`)
        // Fire-and-forget fix for the stuck flag
        supabase
          .from('helper_profiles')
          .update({ is_on_job: false })
          .eq('id', helper.id)
          .then(() => console.log(`✅ Auto-fixed is_on_job for helper ${helper.id}`))
          .catch(err => console.error(`Failed to auto-fix is_on_job for ${helper.id}:`, err))
      }

      // Check distance from customer location using predefined service location ONLY
      // helper_profiles stores service location in 'latitude' and 'longitude' columns
      let distance = 0
      const baseLat = helper.latitude
      const baseLng = helper.longitude

      if (locationLat && locationLng && baseLat && baseLng) {
        distance = calculateDistanceKm(
          locationLat,
          locationLng,
          baseLat,
          baseLng
        )
        
        // Use fixed notification radius - PRIMARY FILTER
        if (distance > (helper.service_radius_km || NOTIFICATION_RADIUS_KM)) {
          console.log(`❌ Helper ${helper.id} excluded: ${distance.toFixed(1)}km > ${(helper.service_radius_km || NOTIFICATION_RADIUS_KM)}km service radius`)
          return false
        }
        
        console.log(`✅ Helper ${helper.id}: ${distance.toFixed(1)}km within ${(helper.service_radius_km || NOTIFICATION_RADIUS_KM)}km radius (service location)`)
      } else {
        // No predefined service location: skip to avoid relying on stale live GPS
        console.log(`❌ Helper ${helper.id}: no latitude/longitude set, skipping for broadcast`)
        return false
      }

      // Check category match by UUID or slug - REQUIRED for notification
      const categories = helper.service_categories || []
      
      // STRICT MATCHING: Helpers MUST have specific categories defined
      // Helpers with NO categories will NOT receive ANY job notifications
      // This prevents plumbers from getting pet grooming jobs, etc.
      if (categories.length === 0) {
        console.log(`❌ Helper ${helper.id}: NO service_categories defined - skipping (must define skills to receive jobs)`)
        return false
      }
      
      // Log the helper's categories for debugging
      console.log(`🔍 Helper ${helper.id} categories: ${JSON.stringify(categories.slice(0, 5))}`)
      console.log(`🔍 Looking for: categoryId=${finalCategoryId}, slug=${categorySlug}, name=${finalCategoryName}, parent=${categoryParentId}`)
      
      // Check if helper's categories match the requested job category
      const categoryMatch = categories.some((cat: string) => {
        const catLower = (cat || '').toLowerCase()
        const slugLower = (categorySlug || '').toLowerCase()
        const nameLower = (finalCategoryName || '').toLowerCase()
        
        // Match by exact UUID
        if (cat === finalCategoryId) {
          console.log(`   ✅ UUID match: ${cat}`)
          return true
        }
        // Match by parent UUID (if category is a subcategory)
        if (categoryParentId && cat === categoryParentId) {
          console.log(`   ✅ Parent UUID match: ${cat}`)
          return true
        }
        // Match by exact slug
        if (slugLower && catLower === slugLower) {
          console.log(`   ✅ Exact slug match: ${cat}`)
          return true
        }
        // Match by slug prefix (e.g., helper has "plumbing", job is "plumbing-repair")
        if (slugLower && slugLower.startsWith(catLower)) {
          console.log(`   ✅ Slug prefix match: ${cat} -> ${categorySlug}`)
          return true
        }
        // Match by category name contains (e.g., helper has "Plumbing", job is "Plumbing Service")
        if (nameLower && nameLower.includes(catLower)) {
          console.log(`   ✅ Name contains match: ${cat} in ${finalCategoryName}`)
          return true
        }
        // Match by helper's category contains job category (e.g., helper has "Pet Care", job is "Pet")
        if (nameLower && catLower.includes(nameLower.split(' ')[0])) {
          console.log(`   ✅ Reverse name match: ${cat} contains ${nameLower.split(' ')[0]}`)
          return true
        }
        return false
      })
      
      // EXCLUDE helpers who don't match the category
      if (!categoryMatch) {
        console.log(`❌ Helper ${helper.id}: category MISMATCH. Requested: "${finalCategoryName}" (${categorySlug}), Has: [${categories.slice(0,5).join(', ')}]`)
        return false
      }
      
      console.log(`✅ Helper ${helper.id}: category MATCH for "${finalCategoryName}"`)
      
      // Attach distance and category match for later use
      ;(helper as any).distance_km = distance
      ;(helper as any).category_match = categoryMatch

      return true // Include helpers within radius AND matching category
    }) || []

    // Sort helpers: Category match first, then by distance (closest first)
    filteredHelpers.sort((a, b) => {
      const aMatch = (a as any).category_match ? 1 : 0
      const bMatch = (b as any).category_match ? 1 : 0
      
      // If both match or both don't match, sort by distance
      if (aMatch === bMatch) {
        return ((a as any).distance_km || 0) - ((b as any).distance_km || 0)
      }
      
      // Otherwise, category match comes first
      return bMatch - aMatch
    })

    // FALLBACK: If no helpers found within radius with matching category,
    // try to find helpers with matching category in a larger radius (50km)
    if (filteredHelpers.length === 0 && relevantHelpers && relevantHelpers.length > 0) {
      const EXTENDED_RADIUS_KM = 50
      
      const extendedHelpers = relevantHelpers.filter(helper => {
        // Skip OFFLINE helpers - only online helpers get notifications
        if (!helper.is_online) return false
        
        // Skip busy helpers
        if (busyHelperUserIds.has(helper.user_id)) return false
        
        // Check category match - STRICT: must have categories defined
        const categories = helper.service_categories || []
        
        // Skip helpers with no categories
        if (categories.length === 0) return false
        
        // Check for category match
        const categoryMatch = categories.some((cat: string) => {
          const catLower = (cat || '').toLowerCase()
          const slugLower = (categorySlug || '').toLowerCase()
          const nameLower = (finalCategoryName || '').toLowerCase()
          
          if (cat === finalCategoryId) return true
          if (categoryParentId && cat === categoryParentId) return true
          if (slugLower && catLower === slugLower) return true
          if (slugLower && slugLower.startsWith(catLower)) return true
          if (nameLower && nameLower.includes(catLower)) return true
          if (nameLower && catLower.includes(nameLower.split(' ')[0])) return true
          return false
        })
        
        if (!categoryMatch) return false
        
        // Check extended distance
        const baseLat = helper.latitude
        const baseLng = helper.longitude
        if (locationLat && locationLng && baseLat && baseLng) {
          const distance = calculateDistanceKm(locationLat, locationLng, baseLat, baseLng)
          if (distance <= EXTENDED_RADIUS_KM) {
            ;(helper as any).distance_km = distance
            ;(helper as any).category_match = true
            return true
          }
        }
        return false
      })
      
      if (extendedHelpers.length > 0) {
        console.log(`⚠️ No helpers in ${NOTIFICATION_RADIUS_KM}km. Found ${extendedHelpers.length} matching helpers in extended ${EXTENDED_RADIUS_KM}km radius.`)
        filteredHelpers = extendedHelpers
      } else {
        console.log(`⚠️ No helpers found with matching category "${finalCategoryName}" even in ${EXTENDED_RADIUS_KM}km radius.`)
      }
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

      // 🚨 Send URGENT job alerts via FCM (high-priority with sound & vibration)
      // This will trigger full-screen overlay on helper's app
      const helperUserIds = filteredHelpers.map(h => h.user_id).filter(Boolean)
      if (helperUserIds.length > 0) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://helparo.in'
          const jobAlertResponse = await fetch(`${baseUrl}/api/push/job-alert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              helperUserIds,
              jobId: serviceRequest.id,
              title: `New ${finalCategoryName} Job!`,
              description: description,
              price: estimatedPrice,
              location: address,
              customerName: customerProfile?.full_name || 'A customer',
              urgency: urgency || 'urgent',
              expiresInSeconds: 30
            })
          })
          
          if (jobAlertResponse.ok) {
            const alertResult = await jobAlertResponse.json()
            console.log(`🚨 Urgent job alerts sent: ${alertResult.sent} success, ${alertResult.failed} failed`)
          } else {
            console.error('Failed to send urgent job alerts:', await jobAlertResponse.text())
          }
        } catch (alertError) {
          console.error('Error sending urgent job alerts:', alertError)
          // Don't fail the whole request if alerts fail
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
