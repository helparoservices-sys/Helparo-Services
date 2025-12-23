/**
 * ============================================================================
 * PUSH + REALTIME COORDINATION
 * ============================================================================
 * 
 * RULE: For any event, use either Push OR Realtime, never both for same data.
 * 
 * This module defines:
 * 1. Which channel handles which event
 * 2. How to prevent duplicate fetches
 * 3. Client-side coordination logic
 */

import { NotificationEventType, PUSH_DECISIONS } from './types'

// ============================================================================
// CHANNEL OWNERSHIP TABLE
// ============================================================================

export type DataChannel = 'push_only' | 'realtime_only' | 'push_primary_realtime_backup'

export interface ChannelConfig {
  channel: DataChannel
  realtimeTable?: string
  realtimeFilter?: string
  description: string
}

/**
 * For each event type, define which channel "owns" the data delivery.
 * This prevents the anti-pattern of: push arrives → realtime fires → 2 fetches
 */
export const CHANNEL_OWNERSHIP: Record<NotificationEventType, ChannelConfig> = {
  // ========== PUSH ONLY ==========
  // These events send all data in push payload, no realtime needed
  
  booking_abandoned: {
    channel: 'push_only',
    description: 'Reminder notification, no realtime needed',
  },
  payment_pending: {
    channel: 'push_only',
    description: 'Payment reminder, no live updates needed',
  },
  payment_credited: {
    channel: 'push_only',
    description: 'One-time payment confirmation',
  },
  re_engagement: {
    channel: 'push_only',
    description: 'Marketing notification',
  },
  inactivity_reminder: {
    channel: 'push_only',
    description: 'Marketing notification',
  },
  document_expiring: {
    channel: 'push_only',
    description: 'Reminder notification',
  },
  job_rejected: {
    channel: 'push_only',
    description: 'One-time status update',
  },
  no_helpers_found: {
    channel: 'push_only',
    description: 'Broadcast timeout notification',
  },
  
  // ========== REALTIME ONLY ==========
  // App is likely open, use realtime for live updates
  
  helpers_searching: {
    channel: 'realtime_only',
    realtimeTable: 'service_requests',
    realtimeFilter: 'status=eq.searching',
    description: 'Live search progress shown in-app',
  },
  
  // ========== PUSH PRIMARY, REALTIME BACKUP ==========
  // Critical events: push for when app is closed, realtime when open
  // CLIENT MUST DEDUPE: if push received, ignore realtime for same event
  
  helper_applied: {
    channel: 'push_primary_realtime_backup',
    realtimeTable: 'request_applications',
    description: 'New bid notification - critical for customer',
  },
  helper_assigned: {
    channel: 'push_primary_realtime_backup',
    realtimeTable: 'service_requests',
    realtimeFilter: 'status=eq.assigned',
    description: 'Assignment confirmation - must not miss',
  },
  job_started: {
    channel: 'push_primary_realtime_backup',
    realtimeTable: 'service_requests',
    realtimeFilter: 'status=eq.in_progress',
    description: 'Work started - time-sensitive',
  },
  job_completed: {
    channel: 'push_primary_realtime_backup',
    realtimeTable: 'service_requests',
    realtimeFilter: 'status=eq.completed',
    description: 'Completion - triggers payment flow',
  },
  new_job_nearby: {
    channel: 'push_primary_realtime_backup',
    realtimeTable: 'service_requests',
    realtimeFilter: 'status=eq.searching',
    description: 'Job alert - time-critical for helper',
  },
  job_expiring: {
    channel: 'push_primary_realtime_backup',
    description: 'Urgency reminder',
  },
  job_accepted: {
    channel: 'push_primary_realtime_backup',
    realtimeTable: 'request_applications',
    description: 'Bid acceptance - critical for helper',
  },
  customer_otp_shared: {
    channel: 'push_primary_realtime_backup',
    realtimeTable: 'service_requests',
    description: 'OTP for job start',
  },
}

// ============================================================================
// CLIENT-SIDE DEDUPLICATION
// ============================================================================

/**
 * Client-side event tracker to prevent duplicate processing.
 * Use this in your React/Capacitor app.
 * 
 * Usage:
 * ```typescript
 * // When push received
 * const eventKey = `${payload.type}:${payload.requestId}:${payload.timestamp}`
 * if (eventTracker.hasProcessed(eventKey)) return
 * eventTracker.markProcessed(eventKey)
 * // Now handle the event
 * 
 * // When realtime event received
 * const eventKey = `helper_applied:${request_id}:${created_at}`
 * if (eventTracker.hasProcessed(eventKey)) return
 * // Push already handled this, skip
 * ```
 */
export class ClientEventTracker {
  private processedEvents = new Map<string, number>()
  private readonly TTL_MS = 5 * 60 * 1000 // 5 minutes
  
  hasProcessed(eventKey: string): boolean {
    const timestamp = this.processedEvents.get(eventKey)
    if (!timestamp) return false
    
    // Expire old entries
    if (Date.now() - timestamp > this.TTL_MS) {
      this.processedEvents.delete(eventKey)
      return false
    }
    
    return true
  }
  
  markProcessed(eventKey: string): void {
    this.processedEvents.set(eventKey, Date.now())
    this.cleanup()
  }
  
  private cleanup(): void {
    if (this.processedEvents.size > 100) {
      const now = Date.now()
      for (const [key, time] of this.processedEvents.entries()) {
        if (now - time > this.TTL_MS) {
          this.processedEvents.delete(key)
        }
      }
    }
  }
  
  /**
   * Generate event key from push payload
   */
  static keyFromPush(payload: { type: string; requestId?: string; timestamp: string }): string {
    return `${payload.type}:${payload.requestId || 'none'}:${payload.timestamp}`
  }
  
  /**
   * Generate event key from realtime event
   */
  static keyFromRealtime(
    eventType: NotificationEventType,
    recordId: string,
    createdAt: string
  ): string {
    return `${eventType}:${recordId}:${createdAt}`
  }
}

// ============================================================================
// REALTIME SUBSCRIPTION MANAGER
// ============================================================================

/**
 * Smart subscription manager that only subscribes to tables
 * when the corresponding push channel is not sufficient.
 * 
 * RULE: Don't subscribe to realtime if push_only handles the event.
 */
export function getRequiredRealtimeSubscriptions(
  userRole: 'customer' | 'helper',
  hasActivePushToken: boolean
): { table: string; filter?: string }[] {
  const subscriptions: { table: string; filter?: string }[] = []
  
  // If no push token, need realtime for everything
  if (!hasActivePushToken) {
    if (userRole === 'customer') {
      subscriptions.push(
        { table: 'service_requests' },
        { table: 'request_applications' },
      )
    } else {
      subscriptions.push(
        { table: 'service_requests', filter: 'status=eq.searching' },
        { table: 'request_applications' },
      )
    }
    return subscriptions
  }
  
  // With push token, only subscribe for live in-app updates
  if (userRole === 'customer') {
    // Customer needs live bid updates when viewing their request
    subscriptions.push({
      table: 'request_applications',
      // Only when customer is on the bids screen
    })
  } else {
    // Helper needs live job updates when viewing job details
    subscriptions.push({
      table: 'service_requests',
      filter: 'status=in.(searching,assigned)',
    })
  }
  
  return subscriptions
}

// ============================================================================
// ANTI-DOUBLE-FETCH HOOKS
// ============================================================================

/**
 * Example React hook for handling push notifications
 * without triggering redundant fetches.
 * 
 * ```typescript
 * // In your notification handler component
 * const { handlePushNotification } = usePushHandler()
 * 
 * useEffect(() => {
 *   // Register push listener
 *   PushNotifications.addListener('pushNotificationReceived', (notification) => {
 *     handlePushNotification(notification.data)
 *   })
 * }, [])
 * ```
 */
export interface PushHandlerConfig {
  // Called when notification should update local state (NOT fetch from DB)
  onStateUpdate: (eventType: NotificationEventType, payload: unknown) => void
  
  // Called when notification should show UI (toast, badge, etc.)
  onShowNotification: (title: string, body: string) => void
  
  // Event tracker instance
  eventTracker: ClientEventTracker
}

export function createPushHandler(config: PushHandlerConfig) {
  return {
    handlePushNotification: (payload: Record<string, string>) => {
      const eventType = payload.type as NotificationEventType
      const eventKey = ClientEventTracker.keyFromPush({
        type: eventType,
        requestId: payload.requestId,
        timestamp: payload.timestamp,
      })
      
      // Check if already processed
      if (config.eventTracker.hasProcessed(eventKey)) {
        console.log('[Push] Skipping duplicate event:', eventKey)
        return
      }
      
      // Mark as processed
      config.eventTracker.markProcessed(eventKey)
      
      // Update local state from payload (NO FETCH!)
      config.onStateUpdate(eventType, payload)
      
      // Show notification UI if app is in foreground
      // (background notifications handled by OS)
    },
    
    handleRealtimeEvent: (
      eventType: NotificationEventType,
      record: { id: string; created_at: string; [key: string]: unknown }
    ) => {
      const eventKey = ClientEventTracker.keyFromRealtime(
        eventType,
        record.id,
        record.created_at
      )
      
      // Check if push already handled this
      if (config.eventTracker.hasProcessed(eventKey)) {
        console.log('[Realtime] Skipping event (push handled):', eventKey)
        return
      }
      
      // Mark as processed
      config.eventTracker.markProcessed(eventKey)
      
      // Update local state from realtime record (NO FETCH!)
      config.onStateUpdate(eventType, record)
    },
  }
}
