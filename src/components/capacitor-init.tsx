'use client'

import { useEffect } from 'react'
import { initializeCapacitor } from '@/lib/capacitor-auth'

/**
 * Initialize Capacitor app features once when the app starts
 * This component should be included in the root layout
 */
export function CapacitorInit() {
  useEffect(() => {
    // Initialize deep link handling and other Capacitor features
    initializeCapacitor()
  }, [])

  return null
}
