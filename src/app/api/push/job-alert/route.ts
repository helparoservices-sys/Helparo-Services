import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import admin from 'firebase-admin'

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY || '{}')
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })
  } catch (error) {
    console.error('Firebase Admin init error:', error)
  }
}

export interface JobAlertPayload {
  helperUserIds: string[]  // User IDs of helpers to notify
  jobId: string
  title: string
  description: string
  price: number
  location: string
  distance?: string
  customerName?: string
  urgency: 'normal' | 'urgent' | 'emergency'
  expiresInSeconds?: number  // Default 30 seconds
}

/**
 * Send urgent job alerts to helpers
 * Uses high-priority FCM with custom sound and vibration
 * This triggers full-screen overlay on helper's app
 */
export async function POST(request: Request) {
  try {
    const payload: JobAlertPayload = await request.json()
    
    const {
      helperUserIds,
      jobId,
      title,
      description,
      price,
      location,
      distance,
      customerName,
      urgency = 'urgent',
      expiresInSeconds = 30
    } = payload

    if (!helperUserIds || helperUserIds.length === 0) {
      return NextResponse.json({ error: 'No helpers specified' }, { status: 400 })
    }

    if (!jobId || !title) {
      return NextResponse.json({ error: 'Job ID and title are required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    
    // Get FCM tokens for specified helpers
    const { data: tokens, error } = await supabase
      .from('device_tokens')
      .select('token, user_id')
      .in('user_id', helperUserIds)
      .eq('is_active', true)

    if (error) {
      console.error('Token fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
    }

    if (!tokens || tokens.length === 0) {
      console.log('No active device tokens found for specified helpers')
      return NextResponse.json({ sent: 0, failed: 0, message: 'No devices found' })
    }

    const tokenList = tokens.map(t => t.token)
    console.log(`🚨 Sending URGENT job alert to ${tokenList.length} device(s)`)

    // Calculate expiration timestamp
    const expiresAt = Date.now() + (expiresInSeconds * 1000)

    // Build the high-priority FCM message with job_alerts channel
    const message = {
      tokens: tokenList,
      notification: {
        title: `🚨 ${title}`,
        body: `₹${price} • ${location}${distance ? ` • ${distance}` : ''}`
      },
      data: {
        // Type indicator for the app to show full-screen alert
        type: 'new_job',
        jobId: jobId,
        job_id: jobId,  // Alternative key for compatibility
        title: title,
        description: description,
        price: String(price),
        location: location,
        distance: distance || '',
        customerName: customerName || '',
        customer_name: customerName || '',
        urgency: urgency,
        expiresAt: String(expiresAt),
        // Timestamp for deduplication
        timestamp: new Date().toISOString()
      },
      android: {
        // Maximum priority for time-sensitive alerts
        priority: 'high' as const,
        // Time-to-live: expire after the job expires
        ttl: expiresInSeconds * 1000,
        notification: {
          // Use the job_alerts channel with custom sound & vibration
          channelId: 'job_alerts',
          // Custom sound (must be in res/raw folder)
          sound: 'job_alert',
          // High priority to wake device
          priority: 'high' as const,
          // Show on lock screen
          visibility: 'public' as const,
          // Tag to replace previous job alerts
          tag: `job_${jobId}`,
          // Don't auto-cancel - user must interact
          sticky: true
        },
        // Direct boot mode - show even before device unlock
        directBootOk: true
      },
      apns: {
        // iOS specific settings
        headers: {
          'apns-priority': '10',  // Maximum priority
          'apns-expiration': String(Math.floor(expiresAt / 1000))
        },
        payload: {
          aps: {
            alert: {
              title: `🚨 ${title}`,
              body: `₹${price} • ${location}`
            },
            sound: 'job_alert.wav',
            badge: 1,
            'content-available': 1,
            'interruption-level': 'time-sensitive'
          }
        }
      }
    }

    let totalSuccess = 0
    let totalFailed = 0
    const invalidTokens: string[] = []

    // Send in batches of 500 (FCM limit)
    for (let i = 0; i < tokenList.length; i += 500) {
      const batch = tokenList.slice(i, i + 500)
      const batchMessage = { ...message, tokens: batch }

      try {
        const response = await admin.messaging().sendEachForMulticast(batchMessage)
        totalSuccess += response.successCount
        totalFailed += response.failureCount

        console.log(`🚨 Job alert batch result: ${response.successCount} success, ${response.failureCount} failed`)

        // Collect invalid tokens for cleanup
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Token ${idx} error:`, resp.error?.code, resp.error?.message)
            const errorCode = resp.error?.code
            if (errorCode === 'messaging/invalid-registration-token' ||
                errorCode === 'messaging/registration-token-not-registered') {
              invalidTokens.push(batch[idx])
            }
          }
        })
      } catch (batchError) {
        console.error('Batch send error:', batchError)
        totalFailed += batch.length
      }
    }

    // Remove invalid tokens
    if (invalidTokens.length > 0) {
      await supabase
        .from('device_tokens')
        .delete()
        .in('token', invalidTokens)
      console.log(`Removed ${invalidTokens.length} invalid tokens`)
    }

    console.log(`🚨 Job alert complete: ${totalSuccess} success, ${totalFailed} failed`)

    return NextResponse.json({ 
      sent: totalSuccess,
      failed: totalFailed,
      removed: invalidTokens.length,
      jobId
    })
  } catch (error) {
    console.error('Job alert send error:', error)
    return NextResponse.json({ error: 'Failed to send job alert' }, { status: 500 })
  }
}
