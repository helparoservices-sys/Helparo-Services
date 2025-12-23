/**
 * ============================================================================
 * PUSH NOTIFICATION SYSTEM - BARREL EXPORT
 * ============================================================================
 */

// Types and schemas
export * from './types'

// Server-side dispatcher
export { sendNotification, sendToMultipleUsers } from './dispatcher'
export type { SendNotificationParams, SendResult } from './dispatcher'

// Event handlers
export * from './handlers'

// Push + Realtime coordination
export {
  CHANNEL_OWNERSHIP,
  ClientEventTracker,
  getRequiredRealtimeSubscriptions,
  createPushHandler,
} from './coordination'

// Client-side handler
export {
  initPushNotificationHandler,
  subscribeToNotificationState,
  getNotificationState,
  getTotalBadgeCount,
  clearNotificationState,
  dismissJobAlert,
} from './client-handler'
export type { NotificationState } from './client-handler'
