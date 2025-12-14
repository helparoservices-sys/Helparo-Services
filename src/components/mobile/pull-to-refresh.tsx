'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { hapticImpact, isNativeApp } from '@/lib/capacitor'

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  className?: string
}

export function PullToRefresh({ children, onRefresh, className }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [startY, setStartY] = useState(0)
  const [isPulling, setIsPulling] = useState(false)

  const threshold = 80 // Pixels to trigger refresh

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY)
      setIsPulling(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return
    
    const currentY = e.touches[0].clientY
    const distance = Math.max(0, (currentY - startY) * 0.5) // 0.5 for resistance
    
    if (distance > 0 && window.scrollY === 0) {
      e.preventDefault()
      setPullDistance(Math.min(distance, 120))
    }
  }

  const handleTouchEnd = async () => {
    if (!isPulling) return
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      
      if (isNativeApp()) {
        await hapticImpact('medium')
      }
      
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setIsPulling(false)
    setPullDistance(0)
  }

  const progress = Math.min(pullDistance / threshold, 1)

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: isRefreshing ? 60 : pullDistance,
              opacity: 1 
            }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-center overflow-hidden bg-gray-50"
          >
            <motion.div
              animate={{
                rotate: isRefreshing ? 360 : progress * 180,
                scale: isRefreshing ? 1 : 0.8 + progress * 0.2,
              }}
              transition={{
                rotate: isRefreshing 
                  ? { duration: 1, repeat: Infinity, ease: "linear" }
                  : { duration: 0 }
              }}
            >
              <RefreshCw 
                className={`w-6 h-6 ${pullDistance >= threshold || isRefreshing ? 'text-guardian-teal' : 'text-gray-400'}`}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div
        animate={{
          y: isPulling && !isRefreshing ? pullDistance * 0.3 : 0
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
