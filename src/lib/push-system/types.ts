/**
 * ============================================================================
 * COST-OPTIMIZED PUSH NOTIFICATION SYSTEM
 * ============================================================================
 * 
 * DESIGN PHILOSOPHY:
 * - Push contains enough data to render UI WITHOUT a DB fetch
 * - DB reads happen ONLY when user explicitly interacts
 * - Deduplicate at every level
 * - Single source of truth (push OR realtime, never both)
 * 
 * HARD RULES:
 * 1. Push receipt → SHOW notification only, NO fetch
 * 2. Notification tap → Open screen, render from payload, NO fetch
 * 3. User interaction (button tap) → THEN fetch scoped data
 * 4. Push + Realtime: Pick ONE per event, never duplicate
 */

// ============================================================================
// NOTIFICATION EVENT TYPES
// ============================================================================

export type NotificationEventType =
  // CUSTOMER EVENTS
  | 'booking_abandoned'        // Cart/booking started but not completed
  | 'helpers_searching'        // Broadcast in progress
  | 'helper_applied'           // A helper bid on the job
  | 'helper_assigned'          // Helper confirmed for the job
  | 'job_started'              // Helper started work (OTP verified)
  | 'job_completed'            // Job finished
  | 'payment_pending'          // Payment not yet received
  | 'no_helpers_found'         // Broadcast expired, no helpers
  | 're_engagement'            // User inactive for X days
  
  // HELPER EVENTS
  | 'new_job_nearby'           // New job within service radius
  | 'job_expiring'             // Job about to expire (30s warning)
  | 'job_accepted'             // Your bid was accepted
  | 'job_rejected'             // Job given to another helper
  | 'customer_otp_shared'      // Customer shared start OTP
  | 'payment_credited'         // Money added to wallet
  | 'inactivity_reminder'      // Haven't been online in X days
  | 'document_expiring'        // ID/verification expiring soon

// ============================================================================
// PUSH PAYLOAD SCHEMAS (Minimal, Self-Sufficient)
// ============================================================================

/**
 * Base payload - EVERY push must include this
 */
export interface BasePushPayload {
  type: NotificationEventType
  requestId?: string           // For job-related notifications
  timestamp: string            // ISO string for deduplication
  version: '1'                 // Schema version for future changes
}

/**
 * Customer: Helper Applied
 * GOAL: Show "Helper X applied for your job" without fetching
 */
export interface HelperAppliedPayload extends BasePushPayload {
  type: 'helper_applied'
  helperName: string           // "Raju K." (first name + initial)
  helperRating: string         // "4.8" - pre-formatted
  proposedPrice: string        // "₹599" - pre-formatted with symbol
  serviceTitle: string         // "Plumbing - Tap Repair"
  totalBids: string            // "3" - how many helpers have applied
}

/**
 * Customer: Job Started
 * GOAL: Show "Work started" with OTP status
 */
export interface JobStartedPayload extends BasePushPayload {
  type: 'job_started'
  helperName: string
  serviceTitle: string
  startTime: string            // "2:30 PM" - pre-formatted
}

/**
 * Customer: Job Completed
 * GOAL: Show completion, prompt for rating/payment
 */
export interface JobCompletedPayload extends BasePushPayload {
  type: 'job_completed'
  helperName: string
  serviceTitle: string
  finalAmount: string          // "₹650" - pre-formatted
  duration: string             // "45 mins" - pre-formatted
  paymentStatus: 'pending' | 'paid'
}

/**
 * Customer: Payment Pending
 * GOAL: Remind about unpaid job
 */
export interface PaymentPendingPayload extends BasePushPayload {
  type: 'payment_pending'
  serviceTitle: string
  amount: string               // "₹599"
  helperName: string
  dueDate?: string             // "Today"
}

/**
 * Helper: New Job Nearby
 * GOAL: Show job card, allow accept/reject from notification
 */
export interface NewJobNearbyPayload extends BasePushPayload {
  type: 'new_job_nearby'
  jobTitle: string             // "Plumbing - Tap Repair"
  price: string                // "₹400-600"
  distance: string             // "2.3 km"
  location: string             // "Labbipet, Vijayawada"
  urgency: 'normal' | 'urgent' | 'emergency'
  expiresAt: string            // ISO timestamp
  customerName?: string        // "Sanjay M." - optional for privacy
}

/**
 * Helper: Payment Credited
 * GOAL: Show wallet update without fetching full transaction history
 */
export interface PaymentCreditedPayload extends BasePushPayload {
  type: 'payment_credited'
  amount: string               // "₹599"
  newBalance: string           // "₹2,450"
  jobTitle: string             // "Plumbing - Tap Repair"
}

/**
 * Re-engagement (both customer and helper)
 */
export interface ReEngagementPayload extends BasePushPayload {
  type: 're_engagement' | 'inactivity_reminder'
  message: string              // Pre-written engaging message
  ctaText: string              // "Book Now" or "Go Online"
  daysSinceLastActivity: string
}

// Union type for all payloads
export type PushPayload =
  | HelperAppliedPayload
  | JobStartedPayload
  | JobCompletedPayload
  | PaymentPendingPayload
  | NewJobNearbyPayload
  | PaymentCreditedPayload
  | ReEngagementPayload
  | BasePushPayload

// ============================================================================
// EVENT → PUSH DECISION TABLE
// ============================================================================

export interface PushDecision {
  shouldSendPush: boolean
  shouldUseRealtime: boolean
  priority: 'high' | 'normal'
  ttlSeconds: number
  dedupeKey: string            // Unique key to prevent duplicate sends
  rateLimit: {
    maxPerHour: number
    maxPerDay: number
  }
  respectQuietHours: boolean
}

export const PUSH_DECISIONS: Record<NotificationEventType, PushDecision> = {
  // CUSTOMER EVENTS
  booking_abandoned: {
    shouldSendPush: true,
    shouldUseRealtime: false,     // No need for realtime - it's a reminder
    priority: 'normal',
    ttlSeconds: 3600,             // 1 hour validity
    dedupeKey: 'booking_abandoned:{userId}:{requestId}',
    rateLimit: { maxPerHour: 1, maxPerDay: 2 },
    respectQuietHours: true,
  },
  helpers_searching: {
    shouldSendPush: false,        // DON'T spam - only push on STATE CHANGE
    shouldUseRealtime: true,      // Use realtime for live updates
    priority: 'normal',
    ttlSeconds: 60,
    dedupeKey: 'helpers_searching:{requestId}',
    rateLimit: { maxPerHour: 2, maxPerDay: 10 },
    respectQuietHours: false,     // Job-related, time-sensitive
  },
  helper_applied: {
    shouldSendPush: true,
    shouldUseRealtime: false,     // Push is sufficient
    priority: 'high',
    ttlSeconds: 1800,             // 30 mins - job might expire
    dedupeKey: 'helper_applied:{requestId}:{helperId}',
    rateLimit: { maxPerHour: 10, maxPerDay: 50 },
    respectQuietHours: false,
  },
  helper_assigned: {
    shouldSendPush: true,
    shouldUseRealtime: true,      // BOTH - critical event, ensure delivery
    priority: 'high',
    ttlSeconds: 3600,
    dedupeKey: 'helper_assigned:{requestId}',
    rateLimit: { maxPerHour: 5, maxPerDay: 20 },
    respectQuietHours: false,
  },
  job_started: {
    shouldSendPush: true,
    shouldUseRealtime: false,     // Push is enough
    priority: 'high',
    ttlSeconds: 3600,
    dedupeKey: 'job_started:{requestId}',
    rateLimit: { maxPerHour: 5, maxPerDay: 20 },
    respectQuietHours: false,
  },
  job_completed: {
    shouldSendPush: true,
    shouldUseRealtime: false,
    priority: 'high',
    ttlSeconds: 7200,             // 2 hours
    dedupeKey: 'job_completed:{requestId}',
    rateLimit: { maxPerHour: 5, maxPerDay: 20 },
    respectQuietHours: false,
  },
  payment_pending: {
    shouldSendPush: true,
    shouldUseRealtime: false,
    priority: 'normal',
    ttlSeconds: 86400,            // 24 hours
    dedupeKey: 'payment_pending:{requestId}:{date}',
    rateLimit: { maxPerHour: 1, maxPerDay: 3 },
    respectQuietHours: true,
  },
  no_helpers_found: {
    shouldSendPush: true,
    shouldUseRealtime: false,
    priority: 'normal',
    ttlSeconds: 1800,
    dedupeKey: 'no_helpers_found:{requestId}',
    rateLimit: { maxPerHour: 2, maxPerDay: 5 },
    respectQuietHours: false,
  },
  re_engagement: {
    shouldSendPush: true,
    shouldUseRealtime: false,
    priority: 'normal',
    ttlSeconds: 86400,
    dedupeKey: 're_engagement:{userId}:{date}',
    rateLimit: { maxPerHour: 1, maxPerDay: 1 },
    respectQuietHours: true,
  },
  
  // HELPER EVENTS
  new_job_nearby: {
    shouldSendPush: true,
    shouldUseRealtime: false,     // Push only - no realtime for job alerts
    priority: 'high',
    ttlSeconds: 60,               // Jobs expire fast
    dedupeKey: 'new_job_nearby:{requestId}:{helperId}',
    rateLimit: { maxPerHour: 30, maxPerDay: 100 },
    respectQuietHours: false,     // Time-sensitive
  },
  job_expiring: {
    shouldSendPush: true,
    shouldUseRealtime: false,
    priority: 'high',
    ttlSeconds: 30,
    dedupeKey: 'job_expiring:{requestId}:{helperId}',
    rateLimit: { maxPerHour: 10, maxPerDay: 50 },
    respectQuietHours: false,
  },
  job_accepted: {
    shouldSendPush: true,
    shouldUseRealtime: true,      // Both for critical event
    priority: 'high',
    ttlSeconds: 3600,
    dedupeKey: 'job_accepted:{requestId}:{helperId}',
    rateLimit: { maxPerHour: 5, maxPerDay: 20 },
    respectQuietHours: false,
  },
  job_rejected: {
    shouldSendPush: true,
    shouldUseRealtime: false,
    priority: 'normal',
    ttlSeconds: 1800,
    dedupeKey: 'job_rejected:{requestId}:{helperId}',
    rateLimit: { maxPerHour: 10, maxPerDay: 50 },
    respectQuietHours: false,
  },
  customer_otp_shared: {
    shouldSendPush: true,
    shouldUseRealtime: false,
    priority: 'high',
    ttlSeconds: 600,              // 10 mins
    dedupeKey: 'customer_otp_shared:{requestId}',
    rateLimit: { maxPerHour: 5, maxPerDay: 20 },
    respectQuietHours: false,
  },
  payment_credited: {
    shouldSendPush: true,
    shouldUseRealtime: false,
    priority: 'normal',
    ttlSeconds: 86400,
    dedupeKey: 'payment_credited:{requestId}',
    rateLimit: { maxPerHour: 5, maxPerDay: 20 },
    respectQuietHours: true,
  },
  inactivity_reminder: {
    shouldSendPush: true,
    shouldUseRealtime: false,
    priority: 'normal',
    ttlSeconds: 86400,
    dedupeKey: 'inactivity_reminder:{userId}:{date}',
    rateLimit: { maxPerHour: 1, maxPerDay: 1 },
    respectQuietHours: true,
  },
  document_expiring: {
    shouldSendPush: true,
    shouldUseRealtime: false,
    priority: 'normal',
    ttlSeconds: 86400,
    dedupeKey: 'document_expiring:{userId}:{documentType}:{date}',
    rateLimit: { maxPerHour: 1, maxPerDay: 2 },
    respectQuietHours: true,
  },
}

// ============================================================================
// DB FETCH RULES
// ============================================================================

export interface FetchRule {
  onPushReceipt: 'FORBIDDEN'
  onNotificationTap: 'FORBIDDEN' | 'ALLOWED_SCOPED'
  onUserInteraction: 'ALLOWED_SCOPED'
  scopedQuery?: string          // What query is allowed
}

export const FETCH_RULES: Record<NotificationEventType, FetchRule> = {
  helper_applied: {
    onPushReceipt: 'FORBIDDEN',
    onNotificationTap: 'FORBIDDEN',       // Show from payload
    onUserInteraction: 'ALLOWED_SCOPED',  // Only when user taps "View All Bids"
    scopedQuery: 'SELECT * FROM request_applications WHERE request_id = ? LIMIT 10',
  },
  job_started: {
    onPushReceipt: 'FORBIDDEN',
    onNotificationTap: 'ALLOWED_SCOPED',  // Can fetch job details
    onUserInteraction: 'ALLOWED_SCOPED',
    scopedQuery: 'SELECT * FROM service_requests WHERE id = ?',
  },
  new_job_nearby: {
    onPushReceipt: 'FORBIDDEN',
    onNotificationTap: 'FORBIDDEN',       // MUST render from payload
    onUserInteraction: 'ALLOWED_SCOPED',  // Only if user taps "More Details"
    scopedQuery: 'SELECT * FROM service_requests WHERE id = ?',
  },
  payment_credited: {
    onPushReceipt: 'FORBIDDEN',
    onNotificationTap: 'FORBIDDEN',
    onUserInteraction: 'ALLOWED_SCOPED',
    scopedQuery: 'SELECT * FROM wallet_transactions WHERE id = ? LIMIT 1',
  },
  // ... similar for all other events
  booking_abandoned: {
    onPushReceipt: 'FORBIDDEN',
    onNotificationTap: 'FORBIDDEN',
    onUserInteraction: 'ALLOWED_SCOPED',
  },
  helpers_searching: {
    onPushReceipt: 'FORBIDDEN',
    onNotificationTap: 'FORBIDDEN',
    onUserInteraction: 'ALLOWED_SCOPED',
  },
  helper_assigned: {
    onPushReceipt: 'FORBIDDEN',
    onNotificationTap: 'ALLOWED_SCOPED',
    onUserInteraction: 'ALLOWED_SCOPED',
  },
  job_completed: {
    onPushReceipt: 'FORBIDDEN',
    onNotificationTap: 'ALLOWED_SCOPED',
    onUserInteraction: 'ALLOWED_SCOPED',
  },
  payment_pending: {
    onPushReceipt: 'FORBIDDEN',
    onNotificationTap: 'FORBIDDEN',
    onUserInteraction: 'ALLOWED_SCOPED',
  },
  no_helpers_found: {
    onPushReceipt: 'FORBIDDEN',
    onNotificationTap: 'FORBIDDEN',
    onUserInteraction: 'ALLOWED_SCOPED',
  },
  re_engagement: {
    onPushReceipt: 'FORBIDDEN',
    onNotificationTap: 'FORBIDDEN',
    onUserInteraction: 'ALLOWED_SCOPED',
  },
  job_expiring: {
    onPushReceipt: 'FORBIDDEN',
    onNotificationTap: 'FORBIDDEN',
    onUserInteraction: 'ALLOWED_SCOPED',
  },
  job_accepted: {
    onPushReceipt: 'FORBIDDEN',
    onNotificationTap: 'ALLOWED_SCOPED',
    onUserInteraction: 'ALLOWED_SCOPED',
  },
  job_rejected: {
    onPushReceipt: 'FORBIDDEN',
    onNotificationTap: 'FORBIDDEN',
    onUserInteraction: 'ALLOWED_SCOPED',
  },
  customer_otp_shared: {
    onPushReceipt: 'FORBIDDEN',
    onNotificationTap: 'FORBIDDEN',
    onUserInteraction: 'ALLOWED_SCOPED',
  },
  inactivity_reminder: {
    onPushReceipt: 'FORBIDDEN',
    onNotificationTap: 'FORBIDDEN',
    onUserInteraction: 'ALLOWED_SCOPED',
  },
  document_expiring: {
    onPushReceipt: 'FORBIDDEN',
    onNotificationTap: 'FORBIDDEN',
    onUserInteraction: 'ALLOWED_SCOPED',
  },
}

// ============================================================================
// NOTIFICATION TEMPLATES (Pre-formatted for zero DB fetch)
// ============================================================================

export const NOTIFICATION_TEMPLATES: Record<NotificationEventType, {
  title: (data: Record<string, string>) => string
  body: (data: Record<string, string>) => string
}> = {
  helper_applied: {
    title: () => '🙋 New helper applied!',
    body: (d) => `${d.helperName} (${d.helperRating}★) applied for ${d.proposedPrice}. ${d.totalBids} helpers interested.`,
  },
  job_started: {
    title: () => '🔧 Work started!',
    body: (d) => `${d.helperName} has started work on ${d.serviceTitle}`,
  },
  job_completed: {
    title: () => '✅ Job completed!',
    body: (d) => `${d.serviceTitle} completed by ${d.helperName}. Amount: ${d.finalAmount}`,
  },
  payment_pending: {
    title: () => '💳 Payment pending',
    body: (d) => `Please pay ${d.amount} to ${d.helperName} for ${d.serviceTitle}`,
  },
  new_job_nearby: {
    title: (d) => `🚨 ${d.urgency === 'emergency' ? 'EMERGENCY' : 'New Job'}: ${d.jobTitle}`,
    body: (d) => `${d.price} • ${d.distance} away • ${d.location}`,
  },
  payment_credited: {
    title: () => '💰 Payment received!',
    body: (d) => `${d.amount} credited. New balance: ${d.newBalance}`,
  },
  booking_abandoned: {
    title: () => '📝 Complete your booking',
    body: () => 'Your service request is waiting. Book now to get help!',
  },
  helpers_searching: {
    title: () => '🔍 Finding helpers...',
    body: () => 'We\'re searching for the best helpers near you',
  },
  helper_assigned: {
    title: () => '✨ Helper confirmed!',
    body: (d) => `${d.helperName} is assigned to your job`,
  },
  no_helpers_found: {
    title: () => '😔 No helpers available',
    body: () => 'Try booking again or modify your request',
  },
  re_engagement: {
    title: () => '👋 We miss you!',
    body: (d) => d.message,
  },
  job_expiring: {
    title: () => '⏰ Job expiring soon!',
    body: (d) => `${d.jobTitle} - Accept now before it's gone!`,
  },
  job_accepted: {
    title: () => '🎉 Job accepted!',
    body: (d) => `You've been assigned to ${d.jobTitle}`,
  },
  job_rejected: {
    title: () => '😔 Job taken',
    body: (d) => `${d.jobTitle} was assigned to another helper`,
  },
  customer_otp_shared: {
    title: () => '🔑 OTP received!',
    body: () => 'Customer has shared the OTP. You can start the work.',
  },
  inactivity_reminder: {
    title: () => '💼 Ready to earn?',
    body: (d) => d.message,
  },
  document_expiring: {
    title: () => '📄 Document expiring',
    body: (d) => `Your ${d.documentType} expires soon. Update it to keep earning.`,
  },
}
