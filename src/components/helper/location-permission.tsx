'use client'

import { useState, useEffect } from 'react'
import { MapPin, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '../ui/toast-notification'

export function LocationPermissionPrompt() {
  const { showError } = useToast()
  const [show, setShow] = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    checkIfShouldShow()
  }, [])

  const checkIfShouldShow = async () => {
    // Check if already granted or denied
    const dismissed = localStorage.getItem('location_permission_dismissed')
    if (dismissed) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Check if helper profile already has location
    const { data: profile } = await supabase
      .from('helper_profiles')
      .select('latitude, longitude')
      .eq('user_id', user.id)
      .single()

    // Show prompt if no location saved
    if (!profile?.latitude || !profile?.longitude) {
      setShow(true)
    }
  }

  const requestLocationPermission = async () => {
    setRequesting(true)

    if (!navigator.geolocation) {
      showError('Not Supported', 'Geolocation is not supported by your browser')
      setRequesting(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        // Save to profile (no address fetching needed here)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { error } = await supabase
            .from('helper_profiles')
            .update({
              latitude: latitude.toString(),
              longitude: longitude.toString()
            })
            .eq('user_id', user.id)

          if (!error) {
            setShow(false)
            localStorage.setItem('location_permission_dismissed', 'true')
          }
        }

        setRequesting(false)
      },
      (error) => {
        console.error('Location error:', error)
        setRequesting(false)
        
        // Don't show again if user explicitly denied
        if (error.code === error.PERMISSION_DENIED) {
          localStorage.setItem('location_permission_dismissed', 'true')
          setShow(false)
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const dismiss = () => {
    setShow(false)
    localStorage.setItem('location_permission_dismissed', 'true')
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapPin className="h-8 w-8 text-white" />
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
          Enable Location Access
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
          Allow location access to help customers find you easily and get matched with nearby service requests.
        </p>

        {/* Benefits */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Get matched with customers in your area
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Show accurate service radius to customers
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2"></div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Receive nearby job notifications
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={dismiss}
            className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={requestLocationPermission}
            disabled={requesting}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {requesting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Requesting...
              </>
            ) : (
              'Allow Access'
            )}
          </button>
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
          Your exact location is kept private and only used for job matching
        </p>
      </div>
    </div>
  )
}
