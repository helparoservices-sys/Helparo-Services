'use client'

import { useEffect, useState } from 'react'
import { MapPin, X, AlertCircle } from 'lucide-react'
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-t-xl text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <MapPin className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">Enable Location</h2>
            </div>
            <button
              onClick={handleSkip}
              className="text-white/80 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm opacity-90">
            Help us serve you better by sharing your location
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {coordinates && address && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100">Location Detected!</p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">{address.formatted_address}</p>
                </div>
              </div>
            </div>
          )}

          {!coordinates && (
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Find helpers and services near you</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Get accurate service quotes based on distance</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Faster booking with auto-filled address</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Track helper arrival in real-time</span>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your location is only used to improve your experience and is never shared without your permission.
          </p>

          {/* Actions */}
          {!coordinates && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 font-medium"
                disabled={isLoading}
              >
                Skip for Now
              </button>
              <button
                onClick={handleAllow}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Detecting...
                  </span>
                ) : (
                  'Allow Location'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
