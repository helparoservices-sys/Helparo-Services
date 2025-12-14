'use client'

import { useEffect, useState } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { isNativeApp } from '@/lib/capacitor'

export function MobileOfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine)

    // Web API listeners
    const handleOnline = () => {
      setIsOnline(true)
      setShowReconnected(true)
      setTimeout(() => setShowReconnected(false), 2000)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Custom events from Capacitor Network plugin
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9998] bg-red-500 text-white px-4 py-3 flex items-center justify-center gap-2 pt-safe"
        >
          <WifiOff className="w-5 h-5" />
          <span className="text-sm font-medium">No internet connection</span>
        </motion.div>
      )}

      {showReconnected && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9998] bg-green-500 text-white px-4 py-3 flex items-center justify-center gap-2 pt-safe"
        >
          <Wifi className="w-5 h-5" />
          <span className="text-sm font-medium">Back online</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
