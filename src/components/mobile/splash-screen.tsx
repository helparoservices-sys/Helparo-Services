'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { isNativeApp } from '@/lib/capacitor'

export function MobileSplashScreen() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // Only show splash on native app, web loads fast enough
    if (!isNativeApp()) {
      setShowSplash(false)
      return
    }

    // Hide splash after animation
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-guardian-teal"
        >
          <div className="flex flex-col items-center">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="mb-6"
            >
              <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center shadow-2xl">
                <svg 
                  viewBox="0 0 100 100" 
                  className="w-16 h-16"
                  fill="none"
                >
                  {/* Helparo Logo - H with helping hand */}
                  <path
                    d="M25 20 L25 80 M25 50 L45 50 M45 20 L45 80"
                    stroke="#00C3B4"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="70"
                    cy="35"
                    r="12"
                    fill="#00C3B4"
                  />
                  <path
                    d="M58 55 Q60 70 70 75 Q80 70 82 55"
                    stroke="#00C3B4"
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>
            </motion.div>

            {/* App Name */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-3xl font-bold text-white tracking-tight"
            >
              Helparo
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-white/80 text-sm mt-2"
            >
              Trusted Help at Your Doorstep
            </motion.p>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12"
            >
              <div className="flex space-x-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-white"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
