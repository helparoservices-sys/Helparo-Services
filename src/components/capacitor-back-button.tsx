'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function CapacitorBackButton() {
  const router = useRouter()

  useEffect(() => {
    // Only run on client and when Capacitor is available
    if (typeof window === 'undefined') return

    let App: any = null

    const setupBackButton = async () => {
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

    setupBackButton()

    // Cleanup
    return () => {
      if (App) {
        App.removeAllListeners()
      }
    }
  }, [router])

  return null
}
