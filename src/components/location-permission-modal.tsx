'use client'

import { useEffect, useState } from 'react'
import { MapPin, X, AlertCircle, Check } from 'lucide-react'
import { useLocation } from '@/lib/use-location'
import { createClient } from '@/lib/supabase/client'

interface LocationPermissionModalProps {
  onLocationGranted?: (coordinates: { latitude: number; longitude: number }) => void
  onSkip?: () => void
}

export function LocationPermissionModal({ onLocationGranted, onSkip }: LocationPermissionModalProps) {
  const [show, setShow] = useState(false)
  const [hasAsked, setHasAsked] = useState(false)
  const { requestLocation, isLoading, error, hasPermission, coordinates, address } = useLocation()
  const supabase = createClient()

  useEffect(() => {
    // Check if we've already asked for location
    const asked = localStorage.getItem('location_permission_asked')
    if (asked || hasPermission) {
      setHasAsked(true)
      return
    }

    // Show modal after a brief delay
    const timer = setTimeout(() => {
      setShow(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [hasPermission])

  useEffect(() => {
    // Save location to user profile when granted
    if (coordinates && address) {
      saveUserLocation()
      if (onLocationGranted) {
        onLocationGranted(coordinates)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates, address])

  const saveUserLocation = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !coordinates || !address) return

    // Update user profile with location
    await supabase
      .from('profiles')
      .update({
        location_lat: coordinates.latitude,
        location_lng: coordinates.longitude,
        address: address.formatted_address,
        city: address.city,
        state: address.state,
        pincode: address.pincode
      })
      .eq('id', user.id)
  }

  const handleAllow = async () => {
    localStorage.setItem('location_permission_asked', 'true')
    setHasAsked(true)
    await requestLocation()
    
    // Close modal after 2 seconds if successful
    if (!error) {
      setTimeout(() => setShow(false), 2000)
    }
  }

  const handleSkip = () => {
    localStorage.setItem('location_permission_asked', 'true')
    setHasAsked(true)
    setShow(false)
    onSkip?.()
  }

  if (!show || hasAsked) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-[340px] w-full shadow-2xl overflow-hidden"
        style={{
          animation: 'modalSlideUp 0.3s ease-out'
        }}
      >
        {/* Illustration Section */}
        <div className="relative pt-8 pb-6 px-6">
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>

          {/* Location illustration */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Outer glow ring */}
              <div className="absolute -inset-4 bg-guardian-teal-500/10 rounded-full animate-pulse" />
              <div className="absolute -inset-2 bg-guardian-teal-500/20 rounded-full" />
              {/* Main circle with map icon */}
              <div className="relative w-20 h-20 bg-gradient-to-br from-guardian-teal-400 to-guardian-teal-600 rounded-full flex items-center justify-center shadow-lg shadow-guardian-teal-500/30">
                <MapPin className="h-10 w-10 text-white" strokeWidth={2.5} />
              </div>
              {/* Animated ping */}
              <div className="absolute inset-0 rounded-full border-4 border-guardian-teal-400 animate-ping opacity-20" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
            Where are you?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
            Enable location for the best experience
          </p>
        </div>

        {/* Benefits Section */}
        <div className="px-6 pb-4">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {coordinates && address ? (
            <div className="bg-guardian-teal-50 dark:bg-guardian-teal-900/20 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-guardian-teal-500 rounded-full flex items-center justify-center">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-guardian-teal-900 dark:text-guardian-teal-100">Location found!</p>
                  <p className="text-xs text-guardian-teal-700 dark:text-guardian-teal-300 mt-0.5">{address.formatted_address}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {[
                { emoji: '📍', text: 'Find helpers near your location' },
                { emoji: '⚡', text: 'Get instant price estimates' },
                { emoji: '🚀', text: 'Faster checkout experience' },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3"
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!coordinates && (
          <div className="px-6 pb-6 space-y-3">
            <button
              onClick={handleAllow}
              disabled={isLoading}
              className="w-full py-4 bg-guardian-teal-500 hover:bg-guardian-teal-600 text-white rounded-2xl font-semibold text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-guardian-teal-500/20"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Detecting...
                </span>
              ) : (
                'Allow Location Access'
              )}
            </button>
            
            <button
              onClick={handleSkip}
              disabled={isLoading}
              className="w-full py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium text-sm transition-colors"
            >
              Enter location manually
            </button>
          </div>
        )}

        {/* Trust footer */}
        <div className="border-t border-gray-100 dark:border-slate-800 px-6 py-3">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center flex items-center justify-center gap-1.5">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Your location is private & secure
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}
