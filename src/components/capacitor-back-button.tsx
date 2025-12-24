'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'

export function CapacitorBackButton() {
  const router = useRouter()
  const pathname = usePathname()
  const lastBackPress = useRef<number>(0)

  useEffect(() => {
    // Only run on client and when Capacitor is available
    if (typeof window === 'undefined') return

    let App: any = null

    const setupCapacitor = async () => {
      // Check if we're in Capacitor
      const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.()
      
      if (isCapacitor) {
        // Add class to body for CSS targeting
        document.body.classList.add('capacitor-app')
        
        // On Android, mark for CSS targeting
        const isAndroid = (window as any).Capacitor?.getPlatform?.() === 'android'
        if (isAndroid) {
          document.body.classList.add('capacitor-android')
        }
      }
      
      try {
        // Configure Capacitor StatusBar to avoid overlapping content on Android
        const { StatusBar, Style } = await import('@capacitor/status-bar')

        // Check current theme from localStorage
        const isDarkMode = localStorage.getItem('darkMode') === 'true'
        
        // CRITICAL: Prevent the WebView from drawing under the system status bar
        await StatusBar.setOverlaysWebView({ overlay: false })

        if (isDarkMode) {
          // Dark mode: Dark background with LIGHT (white) icons/text
          await StatusBar.setBackgroundColor({ color: '#1F2937' }) // gray-800
          await StatusBar.setStyle({ style: Style.Light }) // Light = white icons on dark bg
        } else {
          // Light mode: Teal header - use matching teal color with white icons
          await StatusBar.setBackgroundColor({ color: '#14B8A6' }) // teal-500 to match header
          await StatusBar.setStyle({ style: Style.Light }) // Light = white icons on teal bg
        }

        // Ensure the bar is visible after applying the settings
        await StatusBar.show()

        console.log(`✅ StatusBar configured for ${isDarkMode ? 'DARK' : 'LIGHT'} mode`)
      } catch (error) {
        console.log('StatusBar not available:', error)
      }

      try {
        // Dynamically import Capacitor App plugin
        const { App: CapApp } = await import('@capacitor/app')
        App = CapApp

        // Listen for hardware back button
        App.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
          // Dashboard pages where we want double-tap to exit
          const dashboardPaths = [
            '/customer/dashboard',
            '/helper/dashboard',
            '/admin/dashboard'
          ]
          
          const isOnDashboard = dashboardPaths.some(path => pathname === path)
          
          if (isOnDashboard) {
            // On dashboard: Require double-tap to exit
            const now = Date.now()
            const timeSinceLastPress = now - lastBackPress.current
            
            if (timeSinceLastPress < 2000) {
              // Second press within 2 seconds - minimize app
              App.minimizeApp()
            } else {
              // First press - show toast
              lastBackPress.current = now
              toast('Press back again to exit', {
                duration: 2000,
                position: 'bottom-center',
              })
            }
          } else if (canGoBack || window.history.length > 1) {
            // Not on dashboard: Dispatch custom event first to allow pages to handle internally
            const event = new CustomEvent('capacitor-back-button', { cancelable: true })
            const handled = !window.dispatchEvent(event) // Returns false if preventDefault() was called
            
            if (!handled) {
              // Page didn't handle it, do normal back navigation
              router.back()
            }
          } else {
            // Can't go back: minimize app
            App.minimizeApp()
          }
        })
        
        console.log('✅ Back button handler registered')
      } catch (error) {
        // Not running in Capacitor, ignore
        console.log('Not running in Capacitor environment')
      }
    }

    setupCapacitor()

    // Cleanup
    return () => {
      if (App) {
        App.removeAllListeners()
      }
    }
  }, [router, pathname])

  return null
}
