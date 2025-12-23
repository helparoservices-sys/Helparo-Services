/**
 * ============================================================================
 * CLIENT-SIDE PUSH NOTIFICATION HANDLER
 * ============================================================================
 * 
 * Use this in your Capacitor/React Native app.
 * Key principle: Render from payload, NEVER auto-fetch on push receipt.
 */

import { PushNotifications, type PushNotificationSchema } from '@capacitor/push-notifications'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { NotificationEventType, PushPayload } from './types'
import { ClientEventTracker, CHANNEL_OWNERSHIP } from './coordination'

// ============================================================================
// STATE MANAGEMENT (Minimal local state from push payloads)
// ============================================================================

export interface NotificationState {
  // Unread counts by category
  unreadBids: number
  unreadJobUpdates: number
  unreadPayments: number
  
  // Latest data from push (rendered without fetch)
  latestBid?: {
    requestId: string
    helperName: string
    helperRating: string
    proposedPrice: string
    totalBids: string
  }
  
  latestJobUpdate?: {
    requestId: string
    status: string
    helperName?: string
    serviceTitle: string
    timestamp: string
  }
  
  latestPayment?: {
    amount: string
    newBalance: string
    jobTitle: string
  }
  
  // Job alerts for helper
  pendingJobAlerts: Array<{
    requestId: string
    jobTitle: string
    price: string
    distance: string
    location: string
    urgency: 'normal' | 'urgent' | 'emergency'
    expiresAt: string
    receivedAt: number
  }>
}

// Global state (use your preferred state management)
let notificationState: NotificationState = {
  unreadBids: 0,
  unreadJobUpdates: 0,
  unreadPayments: 0,
  pendingJobAlerts: [],
}

const eventTracker = new ClientEventTracker()

// ============================================================================
// PUSH NOTIFICATION HANDLER
// ============================================================================

/**
 * Initialize push notification handling
 * Call this once in your app's entry point
 */
export async function initPushNotificationHandler() {
  // Register listeners
  PushNotifications.addListener('pushNotificationReceived', handleForegroundPush)
  PushNotifications.addListener('pushNotificationActionPerformed', handleNotificationTap)
  
  console.log('[Push] Notification handler initialized')
}

/**
 * Handle push received while app is in foreground
 * RULE: Update local state ONLY, NO database fetch
 */
async function handleForegroundPush(notification: PushNotificationSchema) {
  const payload = notification.data as Record<string, string>
  const eventType = payload.type as NotificationEventType
  
  console.log('[Push] Foreground notification received:', eventType)
  
  // Check deduplication
  const eventKey = ClientEventTracker.keyFromPush({
    type: eventType,
    requestId: payload.requestId,
    timestamp: payload.timestamp,
  })
  
  if (eventTracker.hasProcessed(eventKey)) {
    console.log('[Push] Skipping duplicate:', eventKey)
    return
  }
  eventTracker.markProcessed(eventKey)
  
  // Update local state from payload
  updateStateFromPayload(eventType, payload)
  
  // Show local notification (app is in foreground, OS won't show it)
  await showLocalNotification(notification)
}

/**
 * Handle notification tap
 * RULE: Navigate to screen, render from payload, DON'T fetch unless user interacts
 */
function handleNotificationTap(action: { notification: PushNotificationSchema }) {
  const payload = action.notification.data as Record<string, string>
  const eventType = payload.type as NotificationEventType
  
  console.log('[Push] Notification tapped:', eventType)
  
  // Navigate to appropriate screen
  navigateToScreen(eventType, payload)
  
  // Mark notification as read (update badge counts)
  markAsRead(eventType)
}

// ============================================================================
// STATE UPDATE FUNCTIONS (Render from payload, no fetch)
// ============================================================================

function updateStateFromPayload(eventType: NotificationEventType, payload: Record<string, string>) {
  switch (eventType) {
    case 'helper_applied':
      notificationState.unreadBids++
      notificationState.latestBid = {
        requestId: payload.requestId || '',
        helperName: payload.helperName || '',
        helperRating: payload.helperRating || '',
        proposedPrice: payload.proposedPrice || '',
        totalBids: payload.totalBids || '',
      }
      break
    
    case 'helper_assigned':
    case 'job_started':
    case 'job_completed':
      notificationState.unreadJobUpdates++
      notificationState.latestJobUpdate = {
        requestId: payload.requestId || '',
        status: eventType,
        helperName: payload.helperName,
        serviceTitle: payload.serviceTitle || '',
        timestamp: payload.timestamp || '',
      }
      break
    
    case 'payment_credited':
      notificationState.unreadPayments++
      notificationState.latestPayment = {
        amount: payload.amount || '',
        newBalance: payload.newBalance || '',
        jobTitle: payload.jobTitle || '',
      }
      break
    
    case 'new_job_nearby':
      // Add to pending job alerts
      notificationState.pendingJobAlerts.push({
        requestId: payload.requestId || '',
        jobTitle: payload.jobTitle || '',
        price: payload.price || '',
        distance: payload.distance || '',
        location: payload.location || '',
        urgency: (payload.urgency as 'normal' | 'urgent' | 'emergency') || 'normal',
        expiresAt: payload.expiresAt || '',
        receivedAt: Date.now(),
      })
      
      // Remove expired alerts
      const now = Date.now()
      notificationState.pendingJobAlerts = notificationState.pendingJobAlerts.filter(
        alert => new Date(alert.expiresAt).getTime() > now
      )
      break
    
    case 'job_expiring':
      // Find and highlight the expiring job
      const expiringIdx = notificationState.pendingJobAlerts.findIndex(
        a => a.requestId === payload.requestId
      )
      if (expiringIdx !== -1) {
        notificationState.pendingJobAlerts[expiringIdx].urgency = 'urgent'
      }
      break
  }
  
  // Notify listeners (use your state management)
  notifyStateListeners()
}

function markAsRead(eventType: NotificationEventType) {
  switch (eventType) {
    case 'helper_applied':
      notificationState.unreadBids = Math.max(0, notificationState.unreadBids - 1)
      break
    case 'helper_assigned':
    case 'job_started':
    case 'job_completed':
      notificationState.unreadJobUpdates = Math.max(0, notificationState.unreadJobUpdates - 1)
      break
    case 'payment_credited':
      notificationState.unreadPayments = Math.max(0, notificationState.unreadPayments - 1)
      break
  }
  notifyStateListeners()
}

// ============================================================================
// NAVIGATION (Screen routing based on notification type)
// ============================================================================

function navigateToScreen(eventType: NotificationEventType, payload: Record<string, string>) {
  const requestId = payload.requestId
  
  // Use your navigation library (React Navigation, etc.)
  // This is pseudocode - implement with your navigation system
  
  switch (eventType) {
    case 'helper_applied':
      // Navigate to bids screen with the bid data already available
      // DON'T fetch all bids - show this one from payload
      // navigation.navigate('CustomerBids', { requestId, latestBid: payload })
      console.log('Navigate to bids:', requestId)
      break
    
    case 'helper_assigned':
    case 'job_started':
    case 'job_completed':
      // Navigate to job details - render from payload first, fetch only if needed
      // navigation.navigate('JobDetails', { requestId, ...payload })
      console.log('Navigate to job details:', requestId)
      break
    
    case 'payment_pending':
      // navigation.navigate('Payments', { requestId })
      console.log('Navigate to payments:', requestId)
      break
    
    case 'new_job_nearby':
      // Show job alert screen - render ENTIRELY from payload
      // navigation.navigate('JobAlert', { job: payload })
      console.log('Navigate to job alert:', requestId)
      break
    
    case 'job_accepted':
      // navigation.navigate('HelperMyJobs', { requestId })
      console.log('Navigate to my jobs:', requestId)
      break
    
    case 'payment_credited':
      // navigation.navigate('HelperWallet')
      console.log('Navigate to wallet')
      break
    
    default:
      // navigation.navigate('Home')
      console.log('Navigate to home')
  }
}

// ============================================================================
// LOCAL NOTIFICATIONS (For foreground display)
// ============================================================================

async function showLocalNotification(notification: PushNotificationSchema) {
  await LocalNotifications.schedule({
    notifications: [{
      id: Date.now(),
      title: notification.title || 'Helparo',
      body: notification.body || '',
      extra: notification.data,
    }],
  })
}

// ============================================================================
// STATE SUBSCRIPTION (For React components)
// ============================================================================

type StateListener = (state: NotificationState) => void
const stateListeners: StateListener[] = []

export function subscribeToNotificationState(listener: StateListener) {
  stateListeners.push(listener)
  // Immediately call with current state
  listener(notificationState)
  
  // Return unsubscribe function
  return () => {
    const idx = stateListeners.indexOf(listener)
    if (idx !== -1) stateListeners.splice(idx, 1)
  }
}

function notifyStateListeners() {
  stateListeners.forEach(listener => listener({ ...notificationState }))
}

export function getNotificationState(): NotificationState {
  return { ...notificationState }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get badge count for app icon
 */
export function getTotalBadgeCount(): number {
  return (
    notificationState.unreadBids +
    notificationState.unreadJobUpdates +
    notificationState.unreadPayments +
    notificationState.pendingJobAlerts.length
  )
}

/**
 * Clear all notification state (e.g., on logout)
 */
export function clearNotificationState() {
  notificationState = {
    unreadBids: 0,
    unreadJobUpdates: 0,
    unreadPayments: 0,
    pendingJobAlerts: [],
  }
  notifyStateListeners()
}

/**
 * Remove a job alert from pending list
 */
export function dismissJobAlert(requestId: string) {
  notificationState.pendingJobAlerts = notificationState.pendingJobAlerts.filter(
    a => a.requestId !== requestId
  )
  notifyStateListeners()
}
