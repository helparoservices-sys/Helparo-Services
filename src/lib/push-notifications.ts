/**
 * Simple Push Notifications Setup
 * Works with Capacitor + Firebase Cloud Messaging
 */

import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

/**
 * Initialize push notifications for the current user
 * Call this after user logs in
 */
export async function initPushNotifications(userId: string): Promise<string | null> {
  console.log('🔔 initPushNotifications called with userId:', userId)
  
  // Only works on native app (not web browser)
  if (!Capacitor.isNativePlatform()) {
    console.log('🔔 Not native platform, skipping push setup')
    return null
  }

  console.log('🔔 Running on native platform:', Capacitor.getPlatform())

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
      console.log('🔔 Push notification permission denied')
      return null
    }

    console.log('🔔 Permission granted, registering...')
    
    // Step 2: Register with Firebase
    await PushNotifications.register()
    console.log('🔔 Register called, waiting for token...')

    // Step 3: Wait for token
    return new Promise((resolve) => {
      // Success - got token
      PushNotifications.addListener('registration', async (token) => {
        console.log('📱 Push token received:', token.value.substring(0, 20) + '...')
        
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
            console.log('✅ Push token saved to server')
          } else {
            console.error('Failed to save token, status:', response.status)
          }
        } catch (err) {
          console.error('Failed to save push token:', err)
        }
        
        resolve(token.value)
      })

      // Error
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error)
        resolve(null)
      })

      // Handle incoming notification (app in foreground)
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('📬 Push received (foreground):', notification)
        // You can show a toast or update UI here
      })

      // Handle notification tap
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('👆 Push notification tapped:', action)
        // Navigate to relevant page based on action.notification.data
      })
    })
  } catch (error) {
    console.error('Push notification init error:', error)
    return null
  }
}
