'use client'

import { useEffect } from 'react'

/**
 * Hook to dynamically update status bar color based on page
 * Use this in any page component to change status bar color
 * 
 * @param color - Hex color code (e.g., '#FFFFFF', '#00C3B4')
 * @param style - 'light' for light text on dark bg, 'dark' for dark text on light bg
 */
export function useStatusBar(color: string, style: 'light' | 'dark' = 'dark') {
  useEffect(() => {
    // Check if running in Capacitor
    if (typeof window === 'undefined' || !(window as any).Capacitor?.isNativePlatform?.()) {
      console.log('🌐 Not in Capacitor, skipping status bar update')
      return
    }

    const updateStatusBar = async () => {
      try {
        console.log(`🎨 Attempting to set status bar: ${color} with ${style} text`)
        
        const { StatusBar, Style } = await import('@capacitor/status-bar')
        
        // CRITICAL: Set overlaysWebView to false first to ensure proper spacing
        await StatusBar.setOverlaysWebView({ overlay: false })
        
        // Set background color
        await StatusBar.setBackgroundColor({ color })
        
        // Set text style  
        const styleValue = style === 'light' ? Style.Light : Style.Dark
        await StatusBar.setStyle({ style: styleValue })
        
        console.log(`✅ Status bar successfully updated to ${color}`)
      } catch (error) {
        console.error('❌ Status bar update failed:', error)
      }
    }

    // Add small delay to ensure DOM and Capacitor are ready
    const timer = setTimeout(updateStatusBar, 100)

    return () => clearTimeout(timer)
  }, [color, style])
}
