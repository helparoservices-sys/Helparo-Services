/**
 * ============================================================================
 * PUSH NOTIFICATION DISPATCHER
 * ============================================================================
 * 
 * Central orchestration for all push notifications.
 * Handles: Rate limiting, deduplication, quiet hours, payload building
 */

import { createClient } from '@supabase/supabase-js'
import admin from 'firebase-admin'
import {
  NotificationEventType,
  PushPayload,
  PUSH_DECISIONS,
  NOTIFICATION_TEMPLATES,
} from './types'

// Initialize Firebase Admin (singleton)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================================
// DEDUPLICATION CACHE (In-memory for serverless, Redis for production)
// ============================================================================

// For serverless: use Map (per-instance, resets on cold start)
// For production at scale: swap with Redis
const sentNotifications = new Map<string, number>()
const DEDUPE_TTL_MS = 60 * 60 * 1000 // 1 hour

function hasBeenSent(dedupeKey: string): boolean {
  const sentAt = sentNotifications.get(dedupeKey)
  if (!sentAt) return false
  if (Date.now() - sentAt > DEDUPE_TTL_MS) {
    sentNotifications.delete(dedupeKey)
    return false
  }
  return true
}

function markAsSent(dedupeKey: string): void {
  sentNotifications.set(dedupeKey, Date.now())
  // Cleanup old entries periodically
  if (sentNotifications.size > 10000) {
    const now = Date.now()
    for (const [key, time] of sentNotifications.entries()) {
      if (now - time > DEDUPE_TTL_MS) {
        sentNotifications.delete(key)
      }
    }
  }
}

// ============================================================================
// RATE LIMITING (DB-backed for accuracy)
// ============================================================================

interface RateLimitResult {
  allowed: boolean
  reason?: string
}

async function checkRateLimit(
  userId: string,
  eventType: NotificationEventType
): Promise<RateLimitResult> {
  const decision = PUSH_DECISIONS[eventType]
  
  // Count notifications sent in the last hour
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: hourCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('data->>type', eventType)
    .gte('created_at', hourAgo)
  
  if ((hourCount ?? 0) >= decision.rateLimit.maxPerHour) {
    return { allowed: false, reason: 'hourly_limit_exceeded' }
  }
  
  // Count notifications sent today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count: dayCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('data->>type', eventType)
    .gte('created_at', today.toISOString())
  
  if ((dayCount ?? 0) >= decision.rateLimit.maxPerDay) {
    return { allowed: false, reason: 'daily_limit_exceeded' }
  }
  
  return { allowed: true }
}

// ============================================================================
// QUIET HOURS CHECK
// ============================================================================

interface QuietHours {
  enabled: boolean
  start: string  // "22:00"
  end: string    // "07:00"
  timezone: string
}

async function isInQuietHours(userId: string): Promise<boolean> {
  const { data: prefs } = await supabase
    .from('user_notification_prefs')
    .select('quiet_hours')
    .eq('user_id', userId)
    .single()
  
  if (!prefs?.quiet_hours) return false
  
  const quietHours = prefs.quiet_hours as QuietHours
  if (!quietHours.enabled) return false
  
  // Get current time in user's timezone
  const now = new Date()
  const userTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: quietHours.timezone || 'Asia/Kolkata',
  }).format(now)
  
  const currentMinutes = parseInt(userTime.split(':')[0]) * 60 + parseInt(userTime.split(':')[1])
  const startMinutes = parseInt(quietHours.start.split(':')[0]) * 60 + parseInt(quietHours.start.split(':')[1])
  const endMinutes = parseInt(quietHours.end.split(':')[0]) * 60 + parseInt(quietHours.end.split(':')[1])
  
  // Handle overnight quiet hours (e.g., 22:00 to 07:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes
  }
  
  return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

// ============================================================================
// TOKEN FETCHING (Optimized: batch fetch, skip inactive)
// ============================================================================

interface DeviceToken {
  token: string
  provider: 'fcm' | 'apns'
  platform: 'android' | 'ios' | 'web'
}

async function getActiveTokens(userId: string): Promise<DeviceToken[]> {
  const { data: tokens } = await supabase
    .from('device_tokens')
    .select('token, provider, platform')
    .eq('user_id', userId)
    .eq('is_active', true)
  
  return tokens || []
}

// ============================================================================
// MAIN DISPATCH FUNCTION
// ============================================================================

export interface SendNotificationParams {
  userId: string
  eventType: NotificationEventType
  payload: Partial<PushPayload>
  requestId?: string
  helperId?: string // For dedupe key
}

export interface SendResult {
  success: boolean
  sent: boolean
  reason?: string
  notificationId?: string
}

export async function sendNotification(params: SendNotificationParams): Promise<SendResult> {
  const { userId, eventType, payload, requestId, helperId } = params
  const decision = PUSH_DECISIONS[eventType]
  
  // 1. Check if we should send push for this event
  if (!decision.shouldSendPush) {
    return { success: true, sent: false, reason: 'push_disabled_for_event' }
  }
  
  // 2. Build dedupe key
  const dedupeKey = decision.dedupeKey
    .replace('{userId}', userId)
    .replace('{requestId}', requestId || '')
    .replace('{helperId}', helperId || '')
    .replace('{date}', new Date().toISOString().split('T')[0])
  
  // 3. Check deduplication
  if (hasBeenSent(dedupeKey)) {
    return { success: true, sent: false, reason: 'deduplicated' }
  }
  
  // 4. Check quiet hours (if applicable)
  if (decision.respectQuietHours) {
    const inQuietHours = await isInQuietHours(userId)
    if (inQuietHours) {
      // Queue for later instead of dropping
      await queueForLater(params)
      return { success: true, sent: false, reason: 'quiet_hours' }
    }
  }
  
  // 5. Check rate limit
  const rateLimitResult = await checkRateLimit(userId, eventType)
  if (!rateLimitResult.allowed) {
    return { success: false, sent: false, reason: rateLimitResult.reason }
  }
  
  // 6. Get device tokens
  const tokens = await getActiveTokens(userId)
  if (tokens.length === 0) {
    return { success: true, sent: false, reason: 'no_active_tokens' }
  }
  
  // 7. Build full payload
  const fullPayload: PushPayload = {
    type: eventType,
    requestId,
    timestamp: new Date().toISOString(),
    version: '1',
    ...payload,
  } as PushPayload
  
  // 8. Build notification content from template
  const template = NOTIFICATION_TEMPLATES[eventType]
  const templateData = payload as Record<string, string>
  const title = template.title(templateData)
  const body = template.body(templateData)
  
  // 9. Send to FCM
  const fcmTokens = tokens.filter(t => t.provider === 'fcm').map(t => t.token)
  
  if (fcmTokens.length > 0) {
    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: fcmTokens,
        notification: {
          title,
          body,
        },
        data: {
          // Stringify all values for FCM
          ...Object.fromEntries(
            Object.entries(fullPayload).map(([k, v]) => [k, String(v)])
          ),
          click_action: getClickAction(eventType, requestId),
        },
        android: {
          priority: decision.priority === 'high' ? 'high' : 'normal',
          ttl: decision.ttlSeconds * 1000,
          notification: {
            channelId: getChannelId(eventType),
            priority: decision.priority === 'high' ? 'max' : 'default',
            defaultVibrateTimings: decision.priority === 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: { title, body },
              sound: decision.priority === 'high' ? 'default' : undefined,
              'content-available': 1,
            },
          },
        },
      }
      
      const response = await admin.messaging().sendEachForMulticast(message)
      
      // Handle failed tokens (mark as inactive)
      if (response.failureCount > 0) {
        const failedTokens: string[] = []
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
            failedTokens.push(fcmTokens[idx])
          }
        })
        
        if (failedTokens.length > 0) {
          await supabase
            .from('device_tokens')
            .update({ is_active: false })
            .in('token', failedTokens)
        }
      }
    } catch (error) {
      console.error('FCM send error:', error)
      return { success: false, sent: false, reason: 'fcm_error' }
    }
  }
  
  // 10. Record in notifications table
  const { data: notification } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      request_id: requestId,
      channel: 'push',
      title,
      body,
      data: fullPayload,
      status: 'sent',
    })
    .select('id')
    .single()
  
  // 11. Mark as sent for deduplication
  markAsSent(dedupeKey)
  
  return { 
    success: true, 
    sent: true, 
    notificationId: notification?.id 
  }
}

// ============================================================================
// BATCH SEND (For job broadcasts to multiple helpers)
// ============================================================================

export async function sendToMultipleUsers(
  userIds: string[],
  eventType: NotificationEventType,
  payload: Partial<PushPayload>,
  requestId?: string
): Promise<Map<string, SendResult>> {
  const results = new Map<string, SendResult>()
  
  // Batch in chunks of 10 to avoid overwhelming the DB
  const BATCH_SIZE = 10
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(userId => 
        sendNotification({ userId, eventType, payload, requestId })
          .then(result => ({ userId, result }))
      )
    )
    
    batchResults.forEach(({ userId, result }) => {
      results.set(userId, result)
    })
    
    // Small delay between batches to prevent rate limiting
    if (i + BATCH_SIZE < userIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return results
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getClickAction(eventType: NotificationEventType, requestId?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://helparo.in'
  
  switch (eventType) {
    case 'helper_applied':
    case 'helper_assigned':
    case 'job_started':
    case 'job_completed':
      return `${baseUrl}/customer/bookings/${requestId}`
    
    case 'new_job_nearby':
    case 'job_expiring':
      return `${baseUrl}/helper/jobs/${requestId}`
    
    case 'job_accepted':
    case 'job_rejected':
      return `${baseUrl}/helper/my-jobs`
    
    case 'payment_credited':
      return `${baseUrl}/helper/wallet`
    
    case 'payment_pending':
      return `${baseUrl}/customer/payments`
    
    default:
      return baseUrl
  }
}

function getChannelId(eventType: NotificationEventType): string {
  switch (eventType) {
    case 'new_job_nearby':
    case 'job_expiring':
      return 'job_alerts'        // High priority channel
    
    case 'helper_applied':
    case 'helper_assigned':
    case 'job_started':
    case 'job_completed':
    case 'job_accepted':
      return 'job_updates'       // Important but not urgent
    
    case 'payment_credited':
    case 'payment_pending':
      return 'payments'          // Financial notifications
    
    default:
      return 'default'           // General notifications
  }
}

async function queueForLater(params: SendNotificationParams): Promise<void> {
  // Queue notification for sending after quiet hours end
  // In production, use a proper job queue (Bull, AWS SQS, etc.)
  await supabase
    .from('notifications')
    .insert({
      user_id: params.userId,
      request_id: params.requestId,
      channel: 'push',
      data: params.payload,
      status: 'queued',
    })
}
