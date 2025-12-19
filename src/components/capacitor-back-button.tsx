'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function CapacitorBackButton() {
  const router = useRouter()

  useEffect(() => {
    // Only run on client and when Capacitor is available
    if (typeof window === 'undefined') return

    let App: any = null

    const setupCapacitor = async () => {
      try {
        // Setup StatusBar - make content NOT go under status bar
        const { StatusBar, Style } = await import('@capacitor/status-bar')
        await StatusBar.setStyle({ style: Style.Light })
        await StatusBar.setBackgroundColor({ color: '#ffffff' })
        // This makes content not overlap with status bar
        await StatusBar.setOverlaysWebView({ overlay: false })
      } catch (error) {
        console.log('StatusBar not available')
      }

      try {
        // Dynamically import Capacitor App plugin
        const { App: CapApp } = await import('@capacitor/app')
        App = CapApp

        // Listen for hardware back button
        App.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
          if (canGoBack || window.history.length > 1) {
            // Go back in browser history
            router.back()
          } else {
            // If can't go back, minimize app (don't exit)
            App.minimizeApp()
          }
        })
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
  }, [router])

  return null
}
