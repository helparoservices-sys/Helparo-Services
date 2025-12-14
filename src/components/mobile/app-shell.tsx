'use client'

import { useEffect, useState } from 'react'
import { isNativeApp, initializeNativePlugins, getPlatform } from '@/lib/capacitor'
import { MobileSplashScreen } from './splash-screen'
import { MobileBottomNav, useShouldShowBottomNav } from './bottom-nav'
import { MobileOfflineIndicator } from './offline-indicator'
import { cn } from '@/lib/utils'

interface MobileAppShellProps {
  children: React.ReactNode
}

export function MobileAppShell({ children }: MobileAppShellProps) {
  const [isReady, setIsReady] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { show: showBottomNav, userType } = useShouldShowBottomNav()

  useEffect(() => {
    // Initialize native plugins when app loads
    const init = async () => {
      if (isNativeApp()) {
        await initializeNativePlugins()
      }
      setIsReady(true)
    }

    init()

    // Check if mobile viewport
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || isNativeApp())
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    // Handle keyboard show/hide for mobile
    const setupKeyboardHandling = async () => {
      if (isNativeApp()) {
        try {
          const { Keyboard } = await import('@capacitor/keyboard')
          
          Keyboard.addListener('keyboardWillShow', (info: any) => {
            const keyboardHeight = info.keyboardHeight || 0
            document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`)
          })
          
          Keyboard.addListener('keyboardWillHide', () => {
            document.documentElement.style.setProperty('--keyboard-height', '0px')
          })
        } catch (e) {
          // Keyboard plugin not available
        }
      }
    }

    setupKeyboardHandling()

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const platform = getPlatform()

  return (
    <>
      {/* Splash screen for native app */}
      <MobileSplashScreen />
      
      {/* Offline indicator */}
      <MobileOfflineIndicator />

      {/* Main content wrapper */}
      <div
        className={cn(
          "min-h-screen",
          // Add padding for native app safe areas
          isNativeApp() && "pt-safe",
          // Add bottom padding when bottom nav is visible
          showBottomNav && isMobile && "pb-20",
          // Add extra padding for iOS home indicator
          platform === 'ios' && "pb-safe"
        )}
      >
        {children}
      </div>

      {/* Mobile bottom navigation */}
      {showBottomNav && isMobile && userType && (
        <MobileBottomNav userType={userType} />
      )}
    </>
  )
}
