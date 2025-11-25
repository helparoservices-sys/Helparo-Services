'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Navigation, Clock, Loader2 } from 'lucide-react'

interface HelperTrackingMapProps {
  requestId: string
  helperId: string
  className?: string
}

interface LocationData {
  latitude: number
  longitude: number
  timestamp: string
}

export default function HelperTrackingMap({ requestId, helperId, className = '' }: HelperTrackingMapProps) {
  const [helperLocation, setHelperLocation] = useState<LocationData | null>(null)
  const [customerLocation, setCustomerLocation] = useState<LocationData | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [eta, setEta] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLocations()
    const cleanup = subscribeToLocationUpdates()
    return () => cleanup?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, helperId])

  async function loadLocations() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load helper location
    const { data: helperProfile } = await supabase
      .from('profiles')
      .select('location_lat, location_lng, location_updated_at')
      .eq('id', helperId)
      .single()

    if (helperProfile?.location_lat && helperProfile?.location_lng) {
      setHelperLocation({
        latitude: helperProfile.location_lat,
        longitude: helperProfile.location_lng,
        timestamp: helperProfile.location_updated_at || new Date().toISOString(),
      })
    }

    // Load customer location
    const { data: customerProfile } = await supabase
      .from('profiles')
      .select('location_lat, location_lng, location_updated_at')
      .eq('id', user.id)
      .single()

    if (customerProfile?.location_lat && customerProfile?.location_lng) {
      setCustomerLocation({
        latitude: customerProfile.location_lat,
        longitude: customerProfile.location_lng,
        timestamp: customerProfile.location_updated_at || new Date().toISOString(),
      })
    }

    // Calculate distance and ETA
    if (helperProfile?.location_lat && helperProfile?.location_lng && 
        customerProfile?.location_lat && customerProfile?.location_lng) {
      
      const { data: distanceData } = await supabase.rpc('calculate_distance', {
        lat1: helperProfile.location_lat,
        lon1: helperProfile.location_lng,
        lat2: customerProfile.location_lat,
        lon2: customerProfile.location_lng,
      })

      if (distanceData) {
        setDistance(distanceData as number)
        // Estimate ETA: assume average speed of 30 km/h in city
        const etaMinutes = Math.round((distanceData as number / 30) * 60)
        setEta(etaMinutes)
      }
    }

    setLoading(false)
  }

  function subscribeToLocationUpdates() {
    const supabase = createClient()
    
    const channel = supabase
      .channel(`helper-location-${helperId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${helperId}`,
        },
        (payload) => {
          const updated = payload.new as { location_lat?: number; location_lng?: number; location_updated_at?: string }
          if (updated.location_lat && updated.location_lng) {
            setHelperLocation({
              latitude: updated.location_lat,
              longitude: updated.location_lng,
              timestamp: updated.location_updated_at || new Date().toISOString(),
            })
            loadLocations() // Recalculate distance and ETA
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  function getMapUrl() {
    if (!helperLocation || !customerLocation) return null
    
    // Create Google Maps URL with directions
    return `https://www.google.com/maps/dir/${helperLocation.latitude},${helperLocation.longitude}/${customerLocation.latitude},${customerLocation.longitude}`
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 bg-slate-100 dark:bg-slate-800 rounded-lg ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!helperLocation) {
    return (
      <div className={`p-6 bg-slate-100 dark:bg-slate-800 rounded-lg text-center ${className}`}>
        <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Helper location not available yet
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
      {/* Map Preview - Using static map or embedded iframe */}
      <div className="relative h-64 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
        {/* Static map placeholder - in production, use Google Maps API or Mapbox */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-3" />
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              Live Location Tracking
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Updated {new Date(helperLocation.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        {/* Coordinates overlay */}
        <div className="absolute top-3 left-3 right-3 flex justify-between gap-2">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs">
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium mb-1">
              <Navigation className="h-3 w-3" />
              Helper
            </div>
            <div className="text-slate-700 dark:text-slate-300 font-mono">
              {helperLocation.latitude.toFixed(6)}, {helperLocation.longitude.toFixed(6)}
            </div>
          </div>
          {customerLocation && (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs">
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium mb-1">
                <MapPin className="h-3 w-3" />
                You
              </div>
              <div className="text-slate-700 dark:text-slate-300 font-mono">
                {customerLocation.latitude.toFixed(6)}, {customerLocation.longitude.toFixed(6)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="p-4 space-y-3">
        {/* Distance & ETA */}
        {distance !== null && eta !== null && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Navigation className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Distance</div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {distance.toFixed(2)} km
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-xs text-slate-600 dark:text-slate-400">ETA</div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {eta} min
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Directions Button */}
        {getMapUrl() && (
          <a
            href={getMapUrl()!}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-center rounded-lg font-medium transition-all"
          >
            <Navigation className="h-4 w-4 inline mr-2" />
            View Directions in Maps
          </a>
        )}

        {/* Auto-refresh indicator */}
        <div className="text-xs text-center text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Live tracking active
          </span>
        </div>
      </div>
    </div>
  )
}
