'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirects mobile app users to login on mount
 * Only runs client-side after hydration
 */
export function MobileRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Check if running in Capacitor native app
    const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.()
    
    if (isCapacitor) {
      // Redirect to login page for mobile app users
      router.replace('/auth/login')
    }
  }, [router])

  // This component renders nothing
  return null
}
