'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type DarkModeContextType = {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined)

/**
 * Update the native status bar to match the current theme
 * CRITICAL: This ensures status bar icons are visible in both light and dark modes
 */
async function updateStatusBarForTheme(isDarkMode: boolean) {
  // Only run in Capacitor native environment
  if (typeof window === 'undefined' || !(window as any).Capacitor?.isNativePlatform?.()) {
    return
  }

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    
    // CRITICAL: Prevent WebView from drawing under system status bar
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
    
    // Ensure status bar is visible
    await StatusBar.show()
    
    console.log(`✅ Status bar updated for ${isDarkMode ? 'DARK' : 'LIGHT'} mode`)
  } catch (error) {
    console.error('❌ Failed to update status bar for theme:', error)
  }
}

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) {
      setIsDarkMode(stored === 'true')
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(systemPrefersDark)
    }
  }, [])

  // Apply dark mode class to HTML element AND update native status bar
  useEffect(() => {
    if (!mounted) return
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('darkMode', 'false')
    }
    
    // CRITICAL: Update native status bar when theme changes
    // Small delay to ensure Capacitor is ready
    const timer = setTimeout(() => {
      updateStatusBarForTheme(isDarkMode)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [isDarkMode, mounted])

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev)
  }

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  )
}

export function useDarkMode() {
  const context = useContext(DarkModeContext)
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider')
  }
  return context
}
