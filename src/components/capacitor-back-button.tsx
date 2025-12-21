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
        
        // On Android, set a fixed status bar height since env(safe-area-inset-top) returns 0
        // Typical Android status bar is 24dp which is ~24-28px depending on density
        const isAndroid = (window as any).Capacitor?.getPlatform?.() === 'android'
        if (isAndroid) {
          document.body.classList.add('capacitor-android')
          // Set CSS variable for Android status bar height (24dp standard)
          document.documentElement.style.setProperty('--android-status-bar-height', '24px')
        }
      }
      
      try {
        // Setup StatusBar for Android
        const { StatusBar, Style } = await import('@capacitor/status-bar')
        
        // Use dark content on light background
        await StatusBar.setStyle({ style: Style.Dark })
        
        // CRITICAL: Set overlay to FALSE - Android will push content below status bar
        await StatusBar.setOverlaysWebView({ overlay: false })
        
        // Set status bar background to match app header
        await StatusBar.setBackgroundColor({ color: '#FFFFFF' })
        
        // Ensure status bar is visible
        await StatusBar.show()
        
        console.log('✅ StatusBar configured correctly')
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
            // Not on dashboard: Normal back navigation
            router.back()
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
