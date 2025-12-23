/**
 * ============================================================================
 * PUSH NOTIFICATION EVENT HANDLERS
 * ============================================================================
 * 
 * Specific handlers for each event type.
 * Each handler knows how to build the minimal payload.
 */

import { sendNotification, sendToMultipleUsers } from './dispatcher'
import type {
  HelperAppliedPayload,
  JobStartedPayload,
  JobCompletedPayload,
  PaymentPendingPayload,
  NewJobNearbyPayload,
  PaymentCreditedPayload,
} from './types'

// ============================================================================
// CUSTOMER EVENT HANDLERS
// ============================================================================

/**
 * Send notification when a helper applies for a job
 * Called when: INSERT on request_applications
 */
export async function notifyHelperApplied(params: {
  customerId: string
  requestId: string
  helperName: string
  helperRating: number
  proposedPrice: number
  serviceTitle: string
  totalBids: number
}) {
  const payload: Partial<HelperAppliedPayload> = {
    helperName: formatName(params.helperName),
    helperRating: params.helperRating.toFixed(1),
    proposedPrice: formatCurrency(params.proposedPrice),
    serviceTitle: params.serviceTitle,
    totalBids: params.totalBids.toString(),
  }
  
  return sendNotification({
    userId: params.customerId,
    eventType: 'helper_applied',
    payload,
    requestId: params.requestId,
    helperId: params.helperName, // For dedupe
  })
}

/**
 * Send notification when helper is assigned to a job
 * Called when: UPDATE on service_requests.helper_id
 */
export async function notifyHelperAssigned(params: {
  customerId: string
  requestId: string
  helperName: string
  serviceTitle: string
}) {
  return sendNotification({
    userId: params.customerId,
    eventType: 'helper_assigned',
    payload: {
      helperName: formatName(params.helperName),
      serviceTitle: params.serviceTitle,
    },
    requestId: params.requestId,
  })
}

/**
 * Send notification when job starts
 * Called when: UPDATE on service_requests.status = 'in_progress'
 */
export async function notifyJobStarted(params: {
  customerId: string
  requestId: string
  helperName: string
  serviceTitle: string
}) {
  const payload: Partial<JobStartedPayload> = {
    helperName: formatName(params.helperName),
    serviceTitle: params.serviceTitle,
    startTime: formatTime(new Date()),
  }
  
  return sendNotification({
    userId: params.customerId,
    eventType: 'job_started',
    payload,
    requestId: params.requestId,
  })
}

/**
 * Send notification when job completes
 * Called when: UPDATE on service_requests.status = 'completed'
 */
export async function notifyJobCompleted(params: {
  customerId: string
  requestId: string
  helperName: string
  serviceTitle: string
  finalAmount: number
  duration: number // in minutes
  paymentStatus: 'pending' | 'paid'
}) {
  const payload: Partial<JobCompletedPayload> = {
    helperName: formatName(params.helperName),
    serviceTitle: params.serviceTitle,
    finalAmount: formatCurrency(params.finalAmount),
    duration: formatDuration(params.duration),
    paymentStatus: params.paymentStatus,
  }
  
  return sendNotification({
    userId: params.customerId,
    eventType: 'job_completed',
    payload,
    requestId: params.requestId,
  })
}

/**
 * Send payment reminder
 * Called by: Cron job for unpaid completed jobs
 */
export async function notifyPaymentPending(params: {
  customerId: string
  requestId: string
  helperName: string
  serviceTitle: string
  amount: number
}) {
  const payload: Partial<PaymentPendingPayload> = {
    helperName: formatName(params.helperName),
    serviceTitle: params.serviceTitle,
    amount: formatCurrency(params.amount),
  }
  
  return sendNotification({
    userId: params.customerId,
    eventType: 'payment_pending',
    payload,
    requestId: params.requestId,
  })
}

/**
 * Notify when no helpers found after broadcast timeout
 */
export async function notifyNoHelpersFound(params: {
  customerId: string
  requestId: string
  serviceTitle: string
}) {
  return sendNotification({
    userId: params.customerId,
    eventType: 'no_helpers_found',
    payload: {
      serviceTitle: params.serviceTitle,
    },
    requestId: params.requestId,
  })
}

// ============================================================================
// HELPER EVENT HANDLERS
// ============================================================================

/**
 * Broadcast new job to nearby helpers
 * Called when: INSERT on service_requests with status='searching'
 * 
 * CRITICAL: This is the highest-volume notification.
 * Must be optimized for minimal cost.
 */
export async function notifyNewJobNearby(params: {
  helperIds: string[]
  requestId: string
  jobTitle: string
  minPrice: number
  maxPrice: number
  distance: Map<string, number> // helperId -> distance in km
  location: string // Area name
  urgency: 'normal' | 'urgent' | 'emergency'
  expiresAt: Date
}) {
  // Group helpers by distance bracket to reduce unique payloads
  const results = new Map<string, Awaited<ReturnType<typeof sendNotification>>>()
  
  for (const helperId of params.helperIds) {
    const helperDistance = params.distance.get(helperId) || 0
    
    const payload: Partial<NewJobNearbyPayload> = {
      jobTitle: params.jobTitle,
      price: `${formatCurrency(params.minPrice)}-${formatCurrency(params.maxPrice)}`,
      distance: `${helperDistance.toFixed(1)} km`,
      location: params.location,
      urgency: params.urgency,
      expiresAt: params.expiresAt.toISOString(),
    }
    
    const result = await sendNotification({
      userId: helperId,
      eventType: 'new_job_nearby',
      payload,
      requestId: params.requestId,
      helperId,
    })
    
    results.set(helperId, result)
  }
  
  return results
}

/**
 * Notify helper their bid was accepted
 */
export async function notifyJobAccepted(params: {
  helperId: string
  requestId: string
  jobTitle: string
  customerName: string
  agreedPrice: number
}) {
  return sendNotification({
    userId: params.helperId,
    eventType: 'job_accepted',
    payload: {
      jobTitle: params.jobTitle,
      customerName: formatName(params.customerName),
      agreedPrice: formatCurrency(params.agreedPrice),
    },
    requestId: params.requestId,
  })
}

/**
 * Notify helper their bid was rejected
 */
export async function notifyJobRejected(params: {
  helperId: string
  requestId: string
  jobTitle: string
}) {
  return sendNotification({
    userId: params.helperId,
    eventType: 'job_rejected',
    payload: {
      jobTitle: params.jobTitle,
    },
    requestId: params.requestId,
  })
}

/**
 * Notify helper that customer shared OTP (can start work)
 */
export async function notifyOtpShared(params: {
  helperId: string
  requestId: string
  customerName: string
  jobTitle: string
}) {
  return sendNotification({
    userId: params.helperId,
    eventType: 'customer_otp_shared',
    payload: {
      customerName: formatName(params.customerName),
      jobTitle: params.jobTitle,
    },
    requestId: params.requestId,
  })
}

/**
 * Notify helper of payment credited
 */
export async function notifyPaymentCredited(params: {
  helperId: string
  requestId: string
  amount: number
  newBalance: number
  jobTitle: string
}) {
  const payload: Partial<PaymentCreditedPayload> = {
    amount: formatCurrency(params.amount),
    newBalance: formatCurrency(params.newBalance),
    jobTitle: params.jobTitle,
  }
  
  return sendNotification({
    userId: params.helperId,
    eventType: 'payment_credited',
    payload,
    requestId: params.requestId,
  })
}

/**
 * Notify helper about job expiring soon
 */
export async function notifyJobExpiring(params: {
  helperId: string
  requestId: string
  jobTitle: string
  secondsRemaining: number
}) {
  return sendNotification({
    userId: params.helperId,
    eventType: 'job_expiring',
    payload: {
      jobTitle: params.jobTitle,
      secondsRemaining: params.secondsRemaining.toString(),
    },
    requestId: params.requestId,
    helperId: params.helperId,
  })
}

// ============================================================================
// RE-ENGAGEMENT HANDLERS (Called by cron jobs)
// ============================================================================

export async function sendReEngagement(params: {
  userId: string
  userType: 'customer' | 'helper'
  daysSinceLastActivity: number
}) {
  const messages = {
    customer: [
      'Need help around the house? Book a professional in minutes!',
      'Your favorite helpers are waiting. Book a service today!',
      'Get 10% off your next booking. Limited time offer!',
    ],
    helper: [
      'New jobs are waiting for you. Go online and start earning!',
      'Your skills are in demand. Complete 3 jobs this week for a bonus!',
      'Haven\'t seen you in a while. Ready to earn again?',
    ],
  }
  
  const message = messages[params.userType][
    Math.floor(Math.random() * messages[params.userType].length)
  ]
  
  const eventType = params.userType === 'customer' 
    ? 're_engagement' 
    : 'inactivity_reminder'
  
  return sendNotification({
    userId: params.userId,
    eventType,
    payload: {
      message,
      ctaText: params.userType === 'customer' ? 'Book Now' : 'Go Online',
      daysSinceLastActivity: params.daysSinceLastActivity.toString(),
    },
  })
}

// ============================================================================
// FORMATTING HELPERS (Pre-format for zero client-side processing)
// ============================================================================

function formatName(fullName: string): string {
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`
  return `${hours} hr ${mins} min`
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}
