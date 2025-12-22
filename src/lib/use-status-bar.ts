'use client'

import { useEffect } from 'react'
import { isCapacitor } from '@/lib/capacitor-auth'

/**
 * Hook to dynamically update status bar color based on page
 * Use this in any page component to change status bar color
 * 
 * @param color - Hex color code (e.g., '#FFFFFF', '#00C3B4')
 * @param style - 'light' for light text on dark bg, 'dark' for dark text on light bg
 */
export function useStatusBar(color: string, style: 'light' | 'dark' = 'dark') {
  useEffect(() => {
    if (!isCapacitor()) return

    let mounted = true

    const updateStatusBar = async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar')
        
        if (!mounted) return

        // Set background color
        await StatusBar.setBackgroundColor({ color })
        
        // Set text style
        await StatusBar.setStyle({ 
          style: style === 'light' ? Style.Light : Style.Dark 
        })
        
        console.log(`✅ Status bar updated: ${color} with ${style} style`)
      } catch (error) {
        console.error('⚠️ Status bar update failed:', error)
      }
    }

    updateStatusBar()

    return () => {
      mounted = false
    }
  }, [color, style])
}
