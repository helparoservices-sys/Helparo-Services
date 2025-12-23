/**
 * Job Alert Service
 * Manages urgent job alerts with Rapido-style notifications
 * Handles sound, vibration, and overlay display
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

class JobAlertServiceClass {
  private listeners: Set<JobAlertCallback> = new Set()
  private currentAlert: JobAlertData | null = null
  
  // Subscribe to job alerts
  subscribe(callback: JobAlertCallback): () => void {
    this.listeners.add(callback)
    
    // If there's a current alert, notify immediately
    if (this.currentAlert) {
      callback(this.currentAlert)
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
    }
  }
  
  // Show a new job alert
  showAlert(job: JobAlertData) {
    console.log('🚨 JobAlertService: Showing alert for job', job.jobId)
    this.currentAlert = job
    this.notifyListeners()
  }
  
  // Clear current alert
  clearAlert() {
    console.log('🚨 JobAlertService: Clearing alert')
    this.currentAlert = null
    this.notifyListeners()
  }
  
  // Get current alert
  getCurrentAlert(): JobAlertData | null {
    return this.currentAlert
  }
  
  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentAlert)
      } catch (error) {
        console.error('JobAlertService: Listener error', error)
      }
    })
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
