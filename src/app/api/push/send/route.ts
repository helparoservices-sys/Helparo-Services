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
    console.log('Firebase Admin initialized')
  } catch (error) {
    console.error('Firebase Admin init error:', error)
  }
}

export async function POST(request: Request) {
  try {
    const { userId, title, body, data } = await request.json()

    if (!userId || !title) {
      return NextResponse.json({ error: 'userId and title are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get user's device tokens
    const { data: tokens, error } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching tokens:', error)
      return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
    }

    if (!tokens || tokens.length === 0) {
      console.log('No device tokens found for user:', userId)
      return NextResponse.json({ sent: 0, message: 'No device tokens found' })
    }

    const tokenList = tokens.map(t => t.token)
    console.log(`Sending push to ${tokenList.length} device(s) for user ${userId}`)

    // Send push notification via FCM
    const message = {
      tokens: tokenList,
      notification: {
        title,
        body: body || ''
      },
      data: data || {},
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default',
          channelId: 'default'
        }
      }
    }

    const response = await admin.messaging().sendEachForMulticast(message)

    console.log(`Push sent: ${response.successCount} success, ${response.failureCount} failed`)

    // Remove invalid tokens
    if (response.failureCount > 0) {
      const tokensToRemove: string[] = []
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code
          // Remove tokens that are invalid/unregistered
          if (errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered') {
            tokensToRemove.push(tokenList[idx])
          }
        }
      })

      if (tokensToRemove.length > 0) {
        await supabase
          .from('device_tokens')
          .delete()
          .in('token', tokensToRemove)
        console.log(`Removed ${tokensToRemove.length} invalid tokens`)
      }
    }

    return NextResponse.json({ 
      sent: response.successCount,
      failed: response.failureCount
    })
  } catch (error) {
    console.error('Push send error:', error)
    return NextResponse.json({ error: 'Failed to send push' }, { status: 500 })
  }
}
