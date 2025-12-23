/**
 * Simple Push Notifications Setup
 * Works with Capacitor + Firebase Cloud Messaging
 */

import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { toast } from 'sonner'

// Track if push notifications have been initialized to prevent duplicate setup
let pushInitialized = false
let currentUserId: string | null = null

/**
 * Initialize push notifications for the current user
 * Call this after user logs in
 */
export async function initPushNotifications(userId: string): Promise<string | null> {
  // Prevent duplicate initialization for same user
  if (pushInitialized && currentUserId === userId) {
    console.log('🔔 Push already initialized for this user, skipping')
    return null
  }
  
  console.log('🔔 initPushNotifications called with userId:', userId)
  
  // Only works on native app (not web browser)
  if (!Capacitor.isNativePlatform()) {
    console.log('🔔 Not native platform, skipping push setup')
    return null
  }

  try {
    // Step 1: Check/request permission
    let permission = await PushNotifications.checkPermissions()
    console.log('🔔 Current permission status:', permission.receive)
    
    if (permission.receive === 'prompt') {
      console.log('🔔 Requesting permission...')
      permission = await PushNotifications.requestPermissions()
      console.log('🔔 Permission after request:', permission.receive)
    }

    if (permission.receive !== 'granted') {
      console.log('🔔 Notification permission denied')
      return null
    }
    
    // Step 2: Register with Firebase
    await PushNotifications.register()

    // Step 3: Wait for token
    return new Promise((resolve) => {
      // Success - got token
      PushNotifications.addListener('registration', async (token) => {
        console.log('🔔 Got FCM token, saving...')
        
        // Save token to server (use absolute URL for Capacitor)
        try {
          const baseUrl = 'https://helparo.in'
          const response = await fetch(`${baseUrl}/api/push/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId, 
              token: token.value,
              platform: Capacitor.getPlatform()
            })
          })
          
          if (response.ok) {
            // Mark as initialized only on success
            pushInitialized = true
            currentUserId = userId
            console.log('🔔 Push notifications enabled successfully')
          } else {
            console.error('🔔 Failed to save token:', response.status)
          }
        } catch (err) {
          console.error('🔔 Token save error:', err)
        }
        
        resolve(token.value)
      })

      // Error
      PushNotifications.addListener('registrationError', (error) => {
        console.error('🔔 FCM registration failed:', error)
        resolve(null)
      })

      // Handle incoming notification (app in foreground)
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        // Show toast for incoming notifications
        toast.info(notification.title || 'New notification')
      })

      // Handle notification tap
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('👆 Push notification tapped:', action)
      })
    })
  } catch (error) {
    console.error('🔔 Push init error:', error)
    return null
  }
}
