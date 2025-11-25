'use client'

import { useState, useEffect } from 'react'
import { MapPin, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function CustomerLocationPermissionPrompt() {
  const [show, setShow] = useState(false)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    checkIfShouldShow()
  }, [])

  const checkIfShouldShow = async () => {
    // Check if already granted or denied
    const dismissed = localStorage.getItem('customer_location_permission_dismissed')
    if (dismissed) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Check if customer profile already has location
    const { data: profile } = await supabase
      .from('profiles')
      .select('location_lat, location_lng')
      .eq('id', user.id)
      .single()

    // Show prompt if no location saved
    if (!profile?.location_lat || !profile?.location_lng) {
      setShow(true)
    }
  }

  const requestLocationPermission = async () => {
    setRequesting(true)

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      setRequesting(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // Try to get address
          let address = ''
          let city = ''
          let state = ''
          let pincode = ''

          try {
            const response = await fetch(
              `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}`
            )
            if (response.ok) {
              const geoData = await response.json()
              if (geoData && geoData.address) {
                const addr = geoData.address
                address = geoData.display_name || ''
                city = addr.city || addr.town || addr.village || ''
                state = addr.state || addr.region || ''
                pincode = addr.postcode || addr.postal_code || ''
              }
            }
          } catch (err) {
            console.log('Address fetch failed, saving coordinates only')
          }

          // Save to profile
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user) {
            const { error } = await supabase
              .from('profiles')
              .update({
                location_lat: latitude,
                location_lng: longitude,
                address: address || null,
                city: city || null,
                state: state || null,
                pincode: pincode || null,
                location_updated_at: new Date().toISOString()
              })
              .eq('id', user.id)

            if (!error) {
              setShow(false)
              localStorage.setItem('customer_location_permission_dismissed', 'true')
            }
          }
        } catch (error) {
          console.error('Location save error:', error)
        }

        setRequesting(false)
      },
      (error) => {
        console.error('Location error:', error)
        setRequesting(false)
        
        // Don't show again if user explicitly denied
        if (error.code === error.PERMISSION_DENIED) {
          localStorage.setItem('customer_location_permission_dismissed', 'true')
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
    localStorage.setItem('customer_location_permission_dismissed', 'true')
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
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapPin className="h-8 w-8 text-white" />
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
          Enable Location Access
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
          Allow location access to find nearby helpers and get faster service.
        </p>

        {/* Benefits */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Find helpers near you instantly
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Get accurate arrival time estimates
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Auto-fill service address when booking
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
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-400 disabled:to-slate-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
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
          Your exact location is kept private and only used for service matching
        </p>
      </div>
    </div>
  )
}
