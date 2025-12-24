'use client'

import { useEffect } from 'react'

/**
 * Hook to dynamically update status bar color based on page
 * Use this in any page component to change status bar color
 * 
 * @param color - Hex color code (e.g., '#FFFFFF', '#00C3B4')
 * @param style - 'light' for light text on dark bg, 'dark' for dark text on light bg
 * @param darkModeColor - Optional: color to use in dark mode (defaults to gray-800)
 */
export function useStatusBar(
  color: string, 
  style: 'light' | 'dark' = 'dark',
  darkModeColor: string = '#1F2937'
) {
  useEffect(() => {
    // Check if running in Capacitor
    if (typeof window === 'undefined' || !(window as any).Capacitor?.isNativePlatform?.()) {
      console.log('🌐 Not in Capacitor, skipping status bar update')
      return
    }

    const updateStatusBar = async () => {
      try {
        // Check current theme from localStorage
        const isDarkMode = localStorage.getItem('darkMode') === 'true'
        
        const { StatusBar, Style } = await import('@capacitor/status-bar')
        
        // CRITICAL: Set overlaysWebView to false first to ensure proper spacing
        await StatusBar.setOverlaysWebView({ overlay: false })
        
        // Determine color based on theme
        const actualColor = isDarkMode ? darkModeColor : color
        const actualStyle = isDarkMode ? Style.Light : (style === 'light' ? Style.Light : Style.Dark)
        
        // Set background color
        await StatusBar.setBackgroundColor({ color: actualColor })
        
        // Set text style  
        await StatusBar.setStyle({ style: actualStyle })
        
        console.log(`✅ Status bar set to ${actualColor} (${isDarkMode ? 'dark mode' : 'light mode'})`)
      } catch (error) {
        console.error('❌ Status bar update failed:', error)
      }
    }

    // Add small delay to ensure DOM and Capacitor are ready
    const timer = setTimeout(updateStatusBar, 100)

    return () => clearTimeout(timer)
  }, [color, style, darkModeColor])
}
