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

export async function POST(request: Request) {
  try {
    const { title, body, targetAudience, userIds } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    
    let tokenQuery = supabase
      .from('device_tokens')
      .select(`
        token,
        user_id,
        profiles!inner(role)
      `)
      .eq('is_active', true)

    // Filter by target audience
    if (targetAudience === 'customers') {
      tokenQuery = tokenQuery.eq('profiles.role', 'customer')
    } else if (targetAudience === 'helpers') {
      tokenQuery = tokenQuery.eq('profiles.role', 'helper')
    } else if (targetAudience === 'specific' && userIds?.length > 0) {
      tokenQuery = tokenQuery.in('user_id', userIds)
    }
    // 'all' - no additional filter

    const { data: tokens, error } = await tokenQuery

    if (error) {
      console.error('Token fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, message: 'No devices found' })
    }

    const tokenList = tokens.map(t => t.token)
    console.log(`Sending push to ${tokenList.length} device(s) for ${targetAudience}`)

    // Send in batches of 500 (FCM limit)
    let totalSuccess = 0
    let totalFailed = 0
    const invalidTokens: string[] = []

    for (let i = 0; i < tokenList.length; i += 500) {
      const batch = tokenList.slice(i, i + 500)
      
      const message = {
        tokens: batch,
        notification: {
          title,
          body: body || ''
        },
        data: {
          type: 'admin_broadcast',
          timestamp: new Date().toISOString()
        },
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'default'
          }
        }
      }

      try {
        const response = await admin.messaging().sendEachForMulticast(message)
        totalSuccess += response.successCount
        totalFailed += response.failureCount

        // Collect invalid tokens
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
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

    console.log(`Push complete: ${totalSuccess} success, ${totalFailed} failed`)

    return NextResponse.json({ 
      sent: totalSuccess,
      failed: totalFailed,
      removed: invalidTokens.length
    })
  } catch (error) {
    console.error('Push send error:', error)
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
  }
}
