'use client'

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, MoreVertical, Share2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { hapticImpact, isNativeApp } from '@/lib/capacitor'
import { cn } from '@/lib/utils'

interface MobileHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  showMore?: boolean
  showShare?: boolean
  onMore?: () => void
  onShare?: () => void
  transparent?: boolean
  className?: string
  rightContent?: React.ReactNode
}

export const MobileHeader = forwardRef<HTMLDivElement, MobileHeaderProps>(({
  title,
  subtitle,
  showBack = true,
  showMore = false,
  showShare = false,
  onMore,
  onShare,
  transparent = false,
  className,
  rightContent,
}, ref) => {
  const router = useRouter()

  const handleBack = async () => {
    if (isNativeApp()) {
      await hapticImpact('light')
    }
    router.back()
  }

  const handleMore = async () => {
    if (isNativeApp()) {
      await hapticImpact('light')
    }
    onMore?.()
  }

  const handleShare = async () => {
    if (isNativeApp()) {
      await hapticImpact('light')
    }
    
    if (onShare) {
      onShare()
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    }
  }

  return (
    <header
      ref={ref}
      className={cn(
        "sticky top-0 z-40 w-full",
        !transparent && "bg-white/95 backdrop-blur-lg border-b border-gray-100",
        "pt-safe",
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left section - Back button */}
        <div className="flex items-center gap-2 w-20">
          {showBack && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </motion.button>
          )}
        </div>

        {/* Center - Title */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-gray-500 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center justify-end gap-1 w-20">
          {rightContent}
          
          {showShare && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            >
              <Share2 className="w-5 h-5 text-gray-700" />
            </motion.button>
          )}
          
          {showMore && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleMore}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            >
              <MoreVertical className="w-5 h-5 text-gray-700" />
            </motion.button>
          )}
        </div>
      </div>
    </header>
  )
})

MobileHeader.displayName = 'MobileHeader'
