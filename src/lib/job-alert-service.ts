/**
 * Job Alert Service
 * Manages urgent job alerts with Rapido-style notifications
 * Handles sound, vibration, and overlay display
 * 
 * CRITICAL: Uses localStorage to persist pending alerts
 * This ensures alerts survive app initialization when opened from notification
 */

// Singleton pattern for job alert management
type JobAlertCallback = (job: JobAlertData | null) => void

export interface JobAlertData {
  jobId: string
  title: string
  description: string
  price: number
  location: string
  distance?: string
  customerName?: string
  urgency: 'normal' | 'urgent' | 'emergency'
  expiresAt: number // Unix timestamp
}

const PENDING_ALERT_KEY = 'helparo_pending_job_alert'

class JobAlertServiceClass {
  private listeners: Set<JobAlertCallback> = new Set()
  private currentAlert: JobAlertData | null = null
  private retryTimeout: NodeJS.Timeout | null = null
  
  constructor() {
    // Check for pending alerts on initialization (browser only)
    if (typeof window !== 'undefined') {
      setTimeout(() => this.checkPendingAlert(), 100)
    }
  }
  
  // Check localStorage for pending alerts (from notification tap)
  private checkPendingAlert() {
    try {
      const stored = localStorage.getItem(PENDING_ALERT_KEY)
      if (stored) {
        const alert = JSON.parse(stored) as JobAlertData
        // Check if alert hasn't expired
        if (alert.expiresAt > Date.now()) {
          console.log('🚨 JobAlertService: Found pending alert from storage', alert.jobId)
          this.currentAlert = alert
          // Clear from storage
          localStorage.removeItem(PENDING_ALERT_KEY)
          // Notify with small delay to allow components to mount
          setTimeout(() => this.notifyListeners(), 200)
        } else {
          // Expired, remove it
          localStorage.removeItem(PENDING_ALERT_KEY)
        }
      }
    } catch (e) {
      console.error('JobAlertService: Error checking pending alert', e)
    }
  }
  
  // Subscribe to job alerts
  subscribe(callback: JobAlertCallback): () => void {
    this.listeners.add(callback)
    
    // If there's a current alert, notify immediately
    if (this.currentAlert) {
      console.log('🚨 JobAlertService: New subscriber, sending current alert', this.currentAlert.jobId)
      // Small delay to ensure component is fully mounted
      setTimeout(() => callback(this.currentAlert), 50)
    } else {
      // Check storage again - subscriber might have mounted before we checked
      this.checkPendingAlert()
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
    }
  }
  
  // Show a new job alert
  showAlert(job: JobAlertData) {
    console.log('🚨 JobAlertService: Showing alert for job', job.jobId, 'listeners:', this.listeners.size)
    this.currentAlert = job
    
    // Also persist to localStorage in case app is still initializing
    // This ensures the alert survives navigation/reloads
    try {
      localStorage.setItem(PENDING_ALERT_KEY, JSON.stringify(job))
    } catch (e) {
      console.error('JobAlertService: Failed to persist alert', e)
    }
    
    // Notify immediately
    this.notifyListeners()
    
    // If no listeners, retry a few times (app might still be initializing)
    if (this.listeners.size === 0) {
      console.log('🚨 JobAlertService: No listeners yet, will retry...')
      this.scheduleRetry()
    }
  }
  
  // Retry notification for apps that are still initializing
  private scheduleRetry() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
    
    let attempts = 0
    const maxAttempts = 10 // Retry for up to 5 seconds
    
    const retry = () => {
      attempts++
      if (this.currentAlert && this.listeners.size > 0) {
        console.log('🚨 JobAlertService: Retry succeeded, notifying listeners')
        this.notifyListeners()
        return
      }
      
      if (attempts < maxAttempts && this.currentAlert) {
        this.retryTimeout = setTimeout(retry, 500)
      } else if (this.currentAlert) {
        console.log('🚨 JobAlertService: Alert persisted to storage for later')
      }
    }
    
    this.retryTimeout = setTimeout(retry, 500)
  }
  
  // Clear current alert
  clearAlert() {
    console.log('🚨 JobAlertService: Clearing alert')
    this.currentAlert = null
    
    // Also clear from storage
    try {
      localStorage.removeItem(PENDING_ALERT_KEY)
    } catch (e) {}
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
      this.retryTimeout = null
    }
    
    this.notifyListeners()
  }
  
  // Get current alert
  getCurrentAlert(): JobAlertData | null {
    return this.currentAlert
  }
  
  // Notify all listeners
  private notifyListeners() {
    console.log('🚨 JobAlertService: Notifying', this.listeners.size, 'listeners')
    this.listeners.forEach(callback => {
      try {
        callback(this.currentAlert)
      } catch (error) {
        console.error('JobAlertService: Listener error', error)
      }
    })
    
    // If we successfully notified and there are listeners, clear storage
    if (this.currentAlert && this.listeners.size > 0) {
      try {
        localStorage.removeItem(PENDING_ALERT_KEY)
      } catch (e) {}
    }
  }
}

// Export singleton instance
export const JobAlertService = new JobAlertServiceClass()

// Helper to parse push notification data into JobAlertData
export function parseJobNotification(data: Record<string, string>): JobAlertData | null {
  if (data.type !== 'new_job' && data.type !== 'urgent_job') {
    return null
  }
  
  try {
    return {
      jobId: data.jobId || data.job_id || '',
      title: data.title || 'New Job Available',
      description: data.description || data.body || '',
      price: parseFloat(data.price) || 0,
      location: data.location || data.address || 'Location not specified',
      distance: data.distance,
      customerName: data.customerName || data.customer_name,
      urgency: (data.urgency as JobAlertData['urgency']) || 'urgent',
      expiresAt: parseInt(data.expiresAt) || Date.now() + 30000, // Default 30 seconds
    }
  } catch (error) {
    console.error('Failed to parse job notification:', error)
    return null
  }
}
