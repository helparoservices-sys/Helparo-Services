/**
 * Simple Push Notifications Setup
 * Works with Capacitor + Firebase Cloud Messaging
 */

import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { toast } from 'sonner'

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

  toast.info('Setting up notifications...')

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
      toast.error('Notification permission denied')
      return null
    }

    toast.success('Permission granted!')
    
    // Step 2: Register with Firebase
    await PushNotifications.register()

    // Step 3: Wait for token
    return new Promise((resolve) => {
      // Success - got token
      PushNotifications.addListener('registration', async (token) => {
        toast.info('Got FCM token, saving...')
        
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
            toast.success('Push notifications enabled!')
          } else {
            toast.error('Failed to save token: ' + response.status)
          }
        } catch (err) {
          toast.error('Token save error: ' + String(err))
        }
        
        resolve(token.value)
      })

      // Error
      PushNotifications.addListener('registrationError', (error) => {
        toast.error('FCM registration failed: ' + JSON.stringify(error))
        resolve(null)
      })

      // Handle incoming notification (app in foreground)
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        toast.info(notification.title || 'New notification')
      })

      // Handle notification tap
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('👆 Push notification tapped:', action)
      })
    })
  } catch (error) {
    toast.error('Push init error: ' + String(error))
    return null
  }
}
